from collections.abc import AsyncIterator

from groq import AsyncGroq
import groq
from loguru import logger

from app.services.ai.base import AIProviderAdapter, ChatMessage


class GroqAdapter(AIProviderAdapter):
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.model = model
        self._client = AsyncGroq(api_key=api_key)

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        formatted = [{"role": m.role, "content": m.content} for m in messages if m.role != "system"]
        formatted.insert(
            0,
            {"role": "system", "content": system_prompt or "You are Cosmo, a helpful, concise AI assistant."},
        )
        try:
            stream = await self._client.chat.completions.create(
                model=self.model,
                messages=formatted,
                temperature=temperature,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except groq.AuthenticationError:
            logger.warning("Groq authentication failed for a request")
            yield "[[ERROR: Your API key was rejected. Please check it in AI Engine settings.]]"
        except Exception as exc:  # noqa: BLE001
            logger.exception("Groq streaming failure")
            yield f"[[ERROR: {exc}]]"

    async def health_check(self) -> bool:
        try:
            await self._client.chat.completions.create(
                model=self.model,
                max_tokens=1,
                messages=[{"role": "user", "content": "ping"}],
            )
            return True
        except groq.AuthenticationError:
            return False
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Groq health check error: {exc}")
            return False
