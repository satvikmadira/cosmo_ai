from collections.abc import AsyncIterator

import anthropic
from loguru import logger

from app.services.ai.base import AIProviderAdapter, ChatMessage


class AnthropicAdapter(AIProviderAdapter):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        self.model = model
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        formatted = [{"role": m.role, "content": m.content} for m in messages if m.role != "system"]
        try:
            async with self._client.messages.stream(
                model=self.model,
                max_tokens=4096,
                temperature=temperature,
                system=system_prompt or "You are Cosmo, a helpful, concise AI assistant.",
                messages=formatted,
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except anthropic.AuthenticationError:
            logger.warning("Anthropic authentication failed for a request")
            yield "[[ERROR: Your API key was rejected. Please check it in AI Engine settings.]]"
        except Exception as exc:  # noqa: BLE001
            logger.exception("Anthropic streaming failure")
            yield f"[[ERROR: {exc}]]"

    async def health_check(self) -> bool:
        try:
            await self._client.messages.create(
                model=self.model,
                max_tokens=1,
                messages=[{"role": "user", "content": "ping"}],
            )
            return True
        except anthropic.AuthenticationError:
            return False
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Anthropic health check error: {exc}")
            return False
