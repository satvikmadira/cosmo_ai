from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDType, gen_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # --- Single AI Engine configuration ---
    ai_provider: Mapped[str] = mapped_column(String(30), default="anthropic")
    ai_model: Mapped[str] = mapped_column(String(60), default="claude-sonnet-4-6")
    encrypted_api_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    use_local_ollama: Mapped[bool] = mapped_column(Boolean, default=False)
