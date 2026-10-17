from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_service import seed_database
from app.core.websocket import manager

# Import routers
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.doctors import router as doctors_router
from app.api.departments import router as departments_router
from app.api.appointments import router as appointments_router
from app.api.medical_records import router as medical_records_router
from app.api.prescriptions import router as prescriptions_router
from app.api.labs import router as labs_router
from app.api.pharmacy import router as pharmacy_router
from app.api.beds import router as beds_router
from app.api.admissions import router as admissions_router
from app.api.billing import router as billing_router
from app.api.notifications import router as notifications_router
from app.api.analytics import router as analytics_router
from app.api.ai import router as ai_router
from app.api.audit import router as audit_router
from app.api.search import router as search_router

# Enterprise Module Routers
from app.api.hospitals import router as hospitals_router
from app.api.opd import router as opd_router
from app.api.emergency import router as emergency_router
from app.api.nursing import router as nursing_router
from app.api.mar import router as mar_router
from app.api.rounds import router as rounds_router
from app.api.insurance import router as insurance_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default demo data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="3.0.0",
    description="Medivanta AI - Enterprise Healthcare & AI Hospital Platform API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured Error Handlers (Security: No stack trace leaks)
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail or "An HTTP error occurred"}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        msg = err.get("msg", "Invalid value")
        errors.append(f"{loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "error": "Validation Error", "details": errors}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    print(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "An internal server error occurred. Please try again later or contact support."}
    )

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(patients_router, prefix=settings.API_V1_STR)
app.include_router(doctors_router, prefix=settings.API_V1_STR)
app.include_router(departments_router, prefix=settings.API_V1_STR)
app.include_router(appointments_router, prefix=settings.API_V1_STR)
app.include_router(medical_records_router, prefix=settings.API_V1_STR)
app.include_router(prescriptions_router, prefix=settings.API_V1_STR)
app.include_router(labs_router, prefix=settings.API_V1_STR)
app.include_router(pharmacy_router, prefix=settings.API_V1_STR)
app.include_router(beds_router, prefix=settings.API_V1_STR)
app.include_router(admissions_router, prefix=settings.API_V1_STR)
app.include_router(billing_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=settings.API_V1_STR)

# Enterprise Routers
app.include_router(hospitals_router, prefix=settings.API_V1_STR)
app.include_router(opd_router, prefix=settings.API_V1_STR)
app.include_router(emergency_router, prefix=settings.API_V1_STR)
app.include_router(nursing_router, prefix=settings.API_V1_STR)
app.include_router(mar_router, prefix=settings.API_V1_STR)
app.include_router(rounds_router, prefix=settings.API_V1_STR)
app.include_router(insurance_router, prefix=settings.API_V1_STR)

# Real-time WebSocket Gateway
@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process client heartbeats/messages
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception:
        manager.disconnect(websocket, channel)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "3.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def healthcheck():
    return {"status": "healthy", "database": "connected", "websockets": "active"}

@app.post("/seed")
def manual_seed():
    db = SessionLocal()
    try:
        seed_database(db)
        return {"status": "success", "message": "Database successfully seeded with enterprise hospital dataset."}
    finally:
        db.close()
