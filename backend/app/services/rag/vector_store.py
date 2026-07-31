import chromadb
from chromadb.utils import embedding_functions
from pypdf import PdfReader

from app.core.config import settings

_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

# Lightweight, fully local embedding model — no extra API key/cost needed for RAG,
# keeping the "single API key" promise intact (embeddings never touch the LLM key).
_embedder = embedding_functions.DefaultEmbeddingFunction()


def _collection_name(user_id: str, document_id: str) -> str:
    return f"doc_{user_id}_{document_id}".replace("-", "")[:60]


def extract_pdf_text(file_path: str) -> str:
    reader = PdfReader(file_path)
    return "\n\n".join(page.extract_text() or "" for page in reader.pages)


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return [c.strip() for c in chunks if c.strip()]


def index_document(user_id: str, document_id: str, file_path: str, filename: str) -> int:
    text = extract_pdf_text(file_path)
    chunks = chunk_text(text)
    if not chunks:
        return 0

    collection = _client.get_or_create_collection(
        name=_collection_name(user_id, document_id), embedding_function=_embedder
    )
    collection.add(
        documents=chunks,
        ids=[f"{document_id}-{i}" for i in range(len(chunks))],
        metadatas=[{"filename": filename, "chunk_index": i} for i in range(len(chunks))],
    )
    return len(chunks)


def query_documents(user_id: str, document_ids: list[str], query: str, top_k: int = 4) -> list[str]:
    """Return the most relevant chunks across the selected documents for this query."""
    results: list[str] = []
    for doc_id in document_ids:
        try:
            collection = _client.get_collection(
                name=_collection_name(user_id, doc_id), embedding_function=_embedder
            )
        except Exception:
            continue
        found = collection.query(query_texts=[query], n_results=top_k)
        for docs in found.get("documents", []):
            results.extend(docs)
    return results


def delete_document(user_id: str, document_id: str) -> None:
    try:
        _client.delete_collection(_collection_name(user_id, document_id))
    except Exception:
        pass
