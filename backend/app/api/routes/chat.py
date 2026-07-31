from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.schemas.chat import ConversationDetail, ConversationOut

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    saved_only: bool = False,
    q: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Conversation).where(
        Conversation.user_id == current_user.id, Conversation.is_archived == False  # noqa: E712
    )
    if saved_only:
        stmt = stmt.where(Conversation.is_saved == True)  # noqa: E712
    if q:
        # Simple conversation search across titles (message-body search handled client-side/expandable)
        stmt = stmt.where(or_(Conversation.title.ilike(f"%{q}%")))
    stmt = stmt.order_by(Conversation.updated_at.desc())
    result = await db.execute(stmt)
    convos = result.scalars().all()
    return [
        ConversationOut(
            id=c.id, title=c.title, is_saved=c.is_saved, updated_at=c.updated_at.isoformat()
        )
        for c in convos
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == current_user.id
        )
    )
    convo = result.scalar_one_or_none()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationDetail(
        id=convo.id,
        title=convo.title,
        is_saved=convo.is_saved,
        updated_at=convo.updated_at.isoformat(),
        messages=[
            {"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
            for m in convo.messages
        ],
    )


@router.post("/conversations/{conversation_id}/save")
async def toggle_save(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == current_user.id
        )
    )
    convo = result.scalar_one_or_none()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    convo.is_saved = not convo.is_saved
    await db.commit()
    return {"is_saved": convo.is_saved}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == current_user.id
        )
    )
    convo = result.scalar_one_or_none()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    convo.is_archived = True
    await db.commit()
    return {"ok": True}
