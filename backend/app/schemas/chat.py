from pydantic import BaseModel


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: str

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    title: str
    is_saved: bool
    updated_at: str

    class Config:
        from_attributes = True


class ConversationDetail(ConversationOut):
    messages: list[MessageOut] = []


class SendMessageRequest(BaseModel):
    conversation_id: str | None = None
    content: str
    document_ids: list[str] = []


class AIConfigRequest(BaseModel):
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-6"
    api_key: str | None = None
    use_local_ollama: bool = False
