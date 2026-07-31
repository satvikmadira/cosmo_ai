from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass
class ChatMessage:
    role: str  # "user" | "assistant" | "system"
    content: str


class AIProviderAdapter(ABC):
    """
    Common interface every AI backend (cloud provider or local Ollama) implements.
    This is what lets Cosmo swap providers without touching chat/RAG/websocket code.
    """

    @abstractmethod
    async def stream_chat(
        self,
        messages: list[ChatMessage],
        system_prompt: str | None = None,
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        """Yield response text chunks as they arrive."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the provider is reachable/credentials are valid."""
        ...
