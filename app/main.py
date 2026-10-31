from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import init_db
from app.routers import admin, auth, books, categories, favorites, me, requests


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes database tables and performs startup retry (PRD Section 5 & 8).
    """
    init_db()
    yield


app = FastAPI(
    title="Scalable Digital Library Management System API",
    description="Backend API for Digital Library. Follows PRD Sections 5, 6, and 7.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# Standardized Error Handling (PRD Section 5: { "detail": "human readable message" })
# ==============================================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Normalizes validation errors to match the PRD contract: { "detail": "message" }.
    """
    errors = exc.errors()
    if errors:
        first_error = errors[0]
        field_loc = [str(x) for x in first_error.get("loc", []) if x not in ("body",)]
        field_name = ".".join(field_loc) if field_loc else "Field"
        msg = first_error.get("msg", "Invalid value")
        readable_message = f"{field_name}: {msg}" if field_loc else msg
    else:
        readable_message = "Validation error"

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": readable_message},
    )


# Public Health Check Endpoint (PRD Section 7 & Section 8.10)
@app.get("/health", tags=["Health"], summary="Health check endpoint for liveness/readiness probes")
def health_check():
    """
    Public health check endpoint.
    Has no DB dependency so Kubernetes probes and dev checks stay ultra-fast.
    """
    return {"status": "ok"}


# Mount Routers (PRD Section 5 & 7: No /api prefix on backend routes)
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(books.router, prefix="/books", tags=["Books"])
app.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
app.include_router(me.router, prefix="/me", tags=["User Profile"])
app.include_router(requests.router, prefix="/requests", tags=["Book Requests"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Operations"])
