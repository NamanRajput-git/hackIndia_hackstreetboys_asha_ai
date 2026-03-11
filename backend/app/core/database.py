from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings
import ssl

settings = get_settings()


def get_async_database_url():
    """
    Prepare the database URL for asyncpg.
    Removes sslmode parameter as asyncpg handles SSL differently.
    """
    url = settings.DATABASE_URL
    
    # Remove sslmode from URL - we'll handle SSL via connect_args
    if '?' in url:
        base, params = url.split('?', 1)
        # Filter out sslmode parameter
        params_list = [p for p in params.split('&') if not p.startswith('sslmode=') and not p.startswith('ssl=')]
        if params_list:
            url = f"{base}?{'&'.join(params_list)}"
        else:
            url = base
    
    return url


def get_ssl_context():
    """Create SSL context for Neon DB connection"""
    # Check if we need SSL (Neon DB requires it)
    if 'neon.tech' in settings.DATABASE_URL or 'sslmode=require' in settings.DATABASE_URL:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE  # For development; use CERT_REQUIRED in production
        return ssl_context
    return None


# Get SSL context if needed
ssl_context = get_ssl_context()

# Create async engine for Neon DB
engine = create_async_engine(
    get_async_database_url(),
    echo=settings.SQL_ECHO,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"ssl": ssl_context} if ssl_context else {}
)

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
    """Initialize database tables (used in dev only)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
