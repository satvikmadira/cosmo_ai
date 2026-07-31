import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import AsyncSessionLocal, get_db
from app.models.document import Document
from app.models.user import User
from app.services.rag.vector_store import delete_document, index_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


async def _process_document(document_id: str, user_id: str, file_path: str, filename: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            return
        try:
            chunk_count = index_document(user_id, document_id, file_path, filename)
            doc.chunk_count = chunk_count
            doc.status = "ready" if chunk_count else "failed"
        except Exception:
            doc.status = "failed"
        await db.commit()


@router.post("/upload")
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for RAG right now")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    document_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.pdf")

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    with open(file_path, "wb") as f:
        f.write(contents)

    doc = Document(
        id=document_id,
        user_id=current_user.id,
        filename=file.filename,
        status="processing",
        collection_name=f"doc_{current_user.id}_{document_id}",
    )
    db.add(doc)
    await db.commit()

    background_tasks.add_task(_process_document, document_id, current_user.id, file_path, file.filename)

    return {"id": document_id, "filename": file.filename, "status": "processing"}


@router.get("")
async def list_documents(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.user_id == current_user.id))
    docs = result.scalars().all()
    return [
        {"id": d.id, "filename": d.filename, "status": d.status, "chunk_count": d.chunk_count}
        for d in docs
    ]


@router.delete("/{document_id}")
async def remove_document(
    document_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    delete_document(current_user.id, document_id)
    await db.delete(doc)
    await db.commit()
    return {"ok": True}
