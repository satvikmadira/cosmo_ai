from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decrypt_api_key,
    encrypt_api_key,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserProfile
from app.schemas.chat import AIConfigRequest
from app.services.ai.anthropic_adapter import AnthropicAdapter
from app.services.ai.factory import detect_local_ollama

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_profile(user: User) -> UserProfile:
    return UserProfile(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        ai_provider=user.ai_provider,
        ai_model=user.ai_model,
        use_local_ollama=user.use_local_ollama,
        has_api_key=bool(user.encrypted_api_key),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == payload.email) | (User.username == payload.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email or username already registered")

    user = User(
        name=payload.name,
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id), refresh_token=create_refresh_token(user.id)
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            (User.email == payload.username_or_email) | (User.username == payload.username_or_email)
        )
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    return TokenResponse(
        access_token=create_access_token(user.id), refresh_token=create_refresh_token(user.id)
    )


@router.get("/me", response_model=UserProfile)
async def me(current_user: User = Depends(get_current_user)):
    return _to_profile(current_user)


@router.put("/ai-config", response_model=UserProfile)
async def update_ai_config(
    payload: AIConfigRequest,
    validate: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Single point where the user's one API key is stored (encrypted at rest) and,
    optionally, validated live against the provider before saving.
    """
    if payload.api_key:
        if validate and payload.provider == "anthropic":
            adapter = AnthropicAdapter(api_key=payload.api_key, model=payload.model)
            if not await adapter.health_check():
                raise HTTPException(status_code=400, detail="This API key was rejected by Anthropic.")
        current_user.encrypted_api_key = encrypt_api_key(payload.api_key)

    current_user.ai_provider = payload.provider
    current_user.ai_model = payload.model
    current_user.use_local_ollama = payload.use_local_ollama

    await db.commit()
    await db.refresh(current_user)
    return _to_profile(current_user)


@router.get("/ollama-status")
async def ollama_status():
    return {"available": await detect_local_ollama()}


@router.get("/ai-config/reveal-hint")
async def reveal_hint(current_user: User = Depends(get_current_user)):
    """Return a masked hint of the stored key, never the raw key, for UI display."""
    if not current_user.encrypted_api_key:
        return {"hint": None}
    raw = decrypt_api_key(current_user.encrypted_api_key)
    return {"hint": f"{raw[:4]}{'•' * 10}{raw[-4:]}"}
