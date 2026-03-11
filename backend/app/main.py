from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.database import engine

# Import all routers
from app.apps.users.router import router as auth_router
from app.apps.beneficiaries.router import router as beneficiaries_router
from app.apps.daily_logs.router import router as daily_logs_router
from app.apps.health_logs.router import router as health_logs_router
from app.apps.alerts.router import router as alerts_router
from app.apps.children.router import router as children_router
from app.apps.schemes.router import router as schemes_router
from app.apps.enrollments.router import router as enrollments_router
from app.apps.ai.router import router as ai_router
from app.apps.visits.router import router as visits_router
from app.apps.voice.router import router as voice_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    print("🚀 ASHA AI Backend Starting...")
    yield
    # Shutdown
    print("👋 ASHA AI Backend Shutting Down...")
    await engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="ASHA AI Backend",
    description="Voice-first maternal health companion API for rural India",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False  # Prevent 307 redirects
)

# Configure CORS - Allow all origins in development
# In production, restrict this to your frontend domain
origins = ["*"] if settings.DEBUG else settings.cors_origins_list

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include all routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(beneficiaries_router, prefix="/api/v1")
app.include_router(daily_logs_router, prefix="/api/v1")
app.include_router(health_logs_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(children_router, prefix="/api/v1")
app.include_router(schemes_router, prefix="/api/v1")
app.include_router(enrollments_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(visits_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to ASHA AI Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ASHA AI Backend"
    }


@app.get("/api/v1")
async def api_info():
    """API information endpoint"""
    return {
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "beneficiaries": "/api/v1/beneficiaries",
            "daily_logs": "/api/v1/daily-logs",
            "health_logs": "/api/v1/health-logs",
            "alerts": "/api/v1/alerts",
            "children": "/api/v1/children",
            "schemes": "/api/v1/schemes",
            "enrollments": "/api/v1/enrollments",
            "ai": "/api/v1/ai",
            "visits": "/api/v1/visits",
            "voice": "/api/v1/voice"
        }
    }
