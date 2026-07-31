import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger
from sqlalchemy import select

from app.api.deps import get_current_user_ws
from app.db.session import AsyncSessionLocal
from app.models.conversation import Conversation, Message
from app.services.ai.base import ChatMessage
from app.services.ai.factory import NoAPIKeyConfigured, get_adapter_for_user
from app.services.memory.memory_service import get_recent_turns, push_turn
from app.services.rag.prompt_builder import build_system_prompt

router = APIRouter()


def _title_from_message(text: str) -> str:
    words = text.strip().split()
    return " ".join(words[:6]) + ("…" if len(words) > 6 else "")


@router.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    await websocket.accept()
    token = websocket.query_params.get("token")

    async with AsyncSessionLocal() as db:
        user = await get_current_user_ws(token, db) if token else None
        if not user:
            await websocket.send_json({"type": "error", "message": "Unauthorized"})
            await websocket.close(code=4401)
            return

        try:
            while True:
                raw = await websocket.receive_text()
                payload = json.loads(raw)
                content: str = payload["content"]
                conversation_id: str | None = payload.get("conversation_id")
                document_ids: list[str] = payload.get("document_ids", [])

                # 1. Resolve or create the conversation
                if conversation_id:
                    result = await db.execute(
                        select(Conversation).where(
                            Conversation.id == conversation_id, Conversation.user_id == user.id
                        )
                    )
                    convo = result.scalar_one_or_none()
                else:
                    convo = None

                if not convo:
                    convo = Conversation(user_id=user.id, title=_title_from_message(content))
                    db.add(convo)
                    await db.commit()
                    await db.refresh(convo)

                # 2. Persist user message
                user_msg = Message(conversation_id=convo.id, role="user", content=content)
                db.add(user_msg)
                await db.commit()
                await push_turn(convo.id, "user", content)

                await websocket.send_json(
                    {"type": "conversation_started", "conversation_id": convo.id, "title": convo.title}
                )
                await websocket.send_json({"type": "thinking"})

                # 3. Resolve AI adapter (single API key, or local Ollama fallback)
                try:
                    adapter = await get_adapter_for_user(user)
                except NoAPIKeyConfigured as exc:
                    await websocket.send_json({"type": "error", "message": str(exc)})
                    continue

                # 4. Build context: recent memory + RAG-augmented system prompt
                recent = await get_recent_turns(convo.id)
                history = [ChatMessage(role=t["role"], content=t["content"]) for t in recent]
                system_prompt = build_system_prompt(user.id, document_ids, content)

                # 5. Stream the response back over the socket
                full_response = ""
                await websocket.send_json({"type": "stream_start"})
                async for chunk in adapter.stream_chat(history, system_prompt=system_prompt):
                    full_response += chunk
                    await websocket.send_json({"type": "token", "content": chunk})
                await websocket.send_json({"type": "stream_end"})

                # 6. Persist assistant message + update memory
                assistant_msg = Message(
                    conversation_id=convo.id,
                    role="assistant",
                    content=full_response,
                    used_document_ids=",".join(document_ids) if document_ids else None,
                )
                db.add(assistant_msg)
                await db.commit()
                await push_turn(convo.id, "assistant", full_response)

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user {user.id}")
        except Exception:  # noqa: BLE001
            logger.exception("Unhandled error in chat websocket")
            await websocket.send_json({"type": "error", "message": "Internal server error"})
