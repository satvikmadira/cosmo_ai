from app.services.rag.vector_store import query_documents

BASE_SYSTEM_PROMPT = (
    "You are Cosmo, a premium all-in-one AI assistant. Be clear, helpful, and concise. "
    "Use markdown and fenced code blocks with language tags when showing code."
)


def build_system_prompt(user_id: str, document_ids: list[str], user_query: str) -> str:
    if not document_ids:
        return BASE_SYSTEM_PROMPT

    chunks = query_documents(user_id, document_ids, user_query)
    if not chunks:
        return BASE_SYSTEM_PROMPT

    context = "\n\n---\n\n".join(chunks)
    return (
        f"{BASE_SYSTEM_PROMPT}\n\n"
        "The user has uploaded document(s). Use the following retrieved excerpts as your primary "
        "source of truth when relevant. If the excerpts don't contain the answer, say so honestly "
        "instead of guessing.\n\n"
        f"=== RETRIEVED CONTEXT ===\n{context}\n=== END CONTEXT ==="
    )
