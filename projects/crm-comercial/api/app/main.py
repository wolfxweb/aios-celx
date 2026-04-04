from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.seed import seed_crm_if_empty, seed_dev_user_if_empty
from app.db.session import SessionLocal, init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    data_dir = Path(__file__).resolve().parent.parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    init_db()
    db = SessionLocal()
    try:
        seed_dev_user_if_empty(db)
        seed_crm_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="CRM AIOS-CELX API", lifespan=lifespan)
settings = get_settings()

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_error_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": detail.get("code", "ERROR"),
                    "message": detail.get("message", ""),
                    "details": detail.get("details", []),
                }
            },
        )
    if isinstance(detail, str):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "HTTP_ERROR",
                    "message": detail,
                    "details": [],
                }
            },
        )
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": "ERROR", "message": str(detail), "details": []}})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
