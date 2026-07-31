import json
from collections.abc import AsyncIterator

import httpx
from loguru import logger

from app.services.ai.base import AIProviderAdapter, ChatMessage


class OllamaAdapter(AIProviderAdapter):
    def __init__(self, base_url: str, model: str = "llama3.1"):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def stream_chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        payload_messages = []
        if system_prompt:
            payload_messages.append({"role": "system", "content": system_prompt})
        payload_messages += [{"role": m.role, "content": m.content} for m in messages]

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": payload_messages,
                        "stream": True,
                        "options": {"temperature": temperature},
                    },
                ) as response:
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                        if chunk.get("done"):
                            break
        except Exception as exc:  # noqa: BLE001
            logger.exception("Ollama streaming failure")
            yield f"[[ERROR: Local Ollama unreachable ({exc}). Falling back requires the cloud API key.]]"

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:  # noqa: BLE001
            return False
