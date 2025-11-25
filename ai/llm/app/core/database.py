from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import os
from dotenv import load_dotenv
from app.core.logger import logger

# 환경 변수 로드
load_dotenv()

# PostgreSQL 연결 정보 (asyncpg 사용)
POSTGRES_USER = os.getenv("POSTGRES_USER", "handi")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "ssafyhandia306")
POSTGRES_DB = os.getenv("POSTGRES_DB", "handi")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

# SQLAlchemy 비동기 설정
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)
Base = declarative_base()

async def get_db():
    """비동기 데이터베이스 세션 의존성"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except SQLAlchemyError as e:
            logger.error(f"Database error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_database():
    """비동기 데이터베이스 초기화"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False

async def test_connection():
    """비동기 데이터베이스 연결 테스트"""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()  # fetchone()은 await 없이 사용
        logger.info("Database connection test successful")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False