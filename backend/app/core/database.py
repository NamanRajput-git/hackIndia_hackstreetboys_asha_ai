import ssl
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

_is_pg = "postgresql" in settings.DATABASE_URL


def _get_connect_args() -> dict:
    """Get connection args (SSL context for Neon DB, empty otherwise)."""
    if not _is_pg:
        return {}
    url = settings.DATABASE_URL
    if 'neon.tech' in url or 'sslmode=require' in url:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return {"ssl": ctx}
    return {}


# Create async engine — works with both SQLite and PostgreSQL
_engine_kwargs = dict(
    echo=settings.SQL_ECHO,
)
if _is_pg:
    _engine_kwargs.update(
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args=_get_connect_args(),
    )

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


async def get_db() -> AsyncSession:
    """Dependency for getting database session"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
