from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Retrieve DATABASE_URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

# Ensure DATABASE_URL is loaded correctly, raise error if not found
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in the environment variables")

# Async Engine setup
engine = create_async_engine(DATABASE_URL, echo=True)

# SessionLocal setup for AsyncSession
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base for declarative models
Base = declarative_base()

# Dependency to get the database session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
