import json

import redis.asyncio as redis

from app.core.config import settings

_redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

MAX_TURNS_CACHED = 12
TTL_SECONDS = 60 * 60 * 6  # 6 hour rolling session cache


def _key(conversation_id: str) -> str:
    return f"cosmo:conv:{conversation_id}:recent"


async def push_turn(conversation_id: str, role: str, content: str) -> None:
    await _redis.rpush(_key(conversation_id), json.dumps({"role": role, "content": content}))
    await _redis.ltrim(_key(conversation_id), -MAX_TURNS_CACHED, -1)
    await _redis.expire(_key(conversation_id), TTL_SECONDS)


async def get_recent_turns(conversation_id: str) -> list[dict]:
    raw = await _redis.lrange(_key(conversation_id), 0, -1)
    return [json.loads(r) for r in raw]
