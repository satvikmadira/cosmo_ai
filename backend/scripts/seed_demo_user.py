"""
Quick demo seeding script for judges/reviewers.

Usage:
    cd backend
    python -m scripts.seed_demo_user

Creates a ready-to-use account: username `demo`, password `Demo12345!`
so judges can log in immediately without registering by hand.
"""
import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.models.user import User

DEMO_USERNAME = "demo"
DEMO_EMAIL = "demo@cosmo.ai"
DEMO_PASSWORD = "Demo12345!"


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == DEMO_USERNAME))
        if result.scalar_one_or_none():
            print(f"Demo user '{DEMO_USERNAME}' already exists — nothing to do.")
            return

        user = User(
            name="Demo Judge",
            username=DEMO_USERNAME,
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
        )
        db.add(user)
        await db.commit()
        print("Demo user created:")
        print(f"  username: {DEMO_USERNAME}")
        print(f"  password: {DEMO_PASSWORD}")
        print("  (Add your own Anthropic API key from the sidebar after logging in.)")


if __name__ == "__main__":
    asyncio.run(main())
