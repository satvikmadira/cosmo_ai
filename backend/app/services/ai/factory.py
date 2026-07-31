from app.core.config import settings
from app.core.security import decrypt_api_key
from app.models.user import User
from app.services.ai.anthropic_adapter import AnthropicAdapter
from app.services.ai.base import AIProviderAdapter
from app.services.ai.ollama_adapter import OllamaAdapter


class NoAPIKeyConfigured(Exception):
    pass


async def get_adapter_for_user(user: User) -> AIProviderAdapter:
    """
    Single entry point used by chat/websocket code. Resolves to the local
    Ollama model if the user has enabled it and it's reachable; otherwise
    uses the user's single stored cloud API key. This is the only place
    provider-switching logic lives, by design.
    """
    if user.use_local_ollama:
        local = OllamaAdapter(settings.OLLAMA_BASE_URL, settings.OLLAMA_DEFAULT_MODEL)
        if await local.health_check():
            return local
        # Local not actually available -> fall through to cloud key below.

    if not user.encrypted_api_key:
        raise NoAPIKeyConfigured(
            "No AI Engine API key configured. Add your API key in the sidebar to start chatting."
        )

    api_key = decrypt_api_key(user.encrypted_api_key)

    if user.ai_provider == "anthropic":
        return AnthropicAdapter(api_key=api_key, model=user.ai_model or settings.DEFAULT_MODEL)

    # Extensible: add more providers (OpenAI, Gemini, etc.) here later without
    # changing anything above this function or in the chat/RAG layers.
    raise ValueError(f"Unsupported provider: {user.ai_provider}")


async def detect_local_ollama() -> bool:
    return await OllamaAdapter(settings.OLLAMA_BASE_URL, settings.OLLAMA_DEFAULT_MODEL).health_check()
