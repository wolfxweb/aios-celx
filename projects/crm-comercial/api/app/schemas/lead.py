from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tag import TagPublic

QualificationStage = Literal["novo", "contato", "qualificado", "perdido"]
LeadStatus = Literal["open", "converted", "lost"]


class LeadPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    email: str | None
    phone: str | None
    company_name: str | None
    source: str | None
    qualification_stage: str
    status: str
    score: int
    owner_user_id: int
    converted_opportunity_id: int | None
    created_at: datetime
    updated_at: datetime
    tags: list[TagPublic] = Field(default_factory=list)


class LeadCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    email: str | None = None
    phone: str | None = None
    company_name: str | None = None
    source: str | None = None
    qualification_stage: QualificationStage = "novo"
    score: int = Field(default=0, ge=0, le=100)


class LeadUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    email: str | None = None
    phone: str | None = None
    company_name: str | None = None
    source: str | None = None
    qualification_stage: QualificationStage | None = None
    score: int | None = Field(default=None, ge=0, le=100)
    status: LeadStatus | None = None


class LeadStagePatch(BaseModel):
    qualification_stage: QualificationStage


class LeadConvertBody(BaseModel):
    pipeline_id: int
    stage_id: int
    opportunity_title: str | None = Field(default=None, max_length=512)
    company_id: int | None = None
    create_company_from_lead: bool = False
    amount_cents: int = Field(default=0, ge=0)
    currency: str = Field(default="BRL", max_length=3)
