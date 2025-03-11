from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv  # Add this import

load_dotenv()

# Ensure the DATABASE_URL environment variable is loaded properly
DATABASE_URL = os.getenv("DATABASE_URL")  # Make sure this is set correctly in your environment
# Debugging: Print the DATABASE_URL to make sure it's being loaded
print(f"DATABASE_URL: {DATABASE_URL}")

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
