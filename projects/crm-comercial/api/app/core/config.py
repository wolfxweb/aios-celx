import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    app_name: str = "crm-comercial-api"
    database_url: str = "sqlite:///./data/crm.db"
    jwt_secret: str = "change-me-in-production-use-env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "crm-comercial-api"),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./data/crm.db"),
        jwt_secret=os.getenv("JWT_SECRET", "change-me-in-production-use-env"),
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24))),
        cors_origins=os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ),
    )
