from typing import Any

from pydantic import BaseModel, Field


class ReportCatalogItem(BaseModel):
    id: str
    title: str
    description: str


class ReportRunRequest(BaseModel):
    date_from: str | None = Field(default=None, description="ISO8601 data inicial (opcional)")
    date_to: str | None = Field(default=None, description="ISO8601 data final (opcional)")
    pipeline_id: int | None = None


class ReportRunResponse(BaseModel):
    report_id: str
    columns: list[str]
    rows: list[list[Any]]
    meta: dict[str, Any] = Field(default_factory=dict)
