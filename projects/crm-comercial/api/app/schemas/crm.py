from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tag import TagPublic


class StagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pipeline_id: int
    name: str
    sort_order: int
    stage_type: str


class PipelinePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_default: bool
    created_at: datetime
    stages: list[StagePublic] = []


class PipelineCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    is_default: bool = False


class PipelineUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_default: bool | None = None


class StageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sort_order: int = 0
    stage_type: str = Field(default="open", pattern="^(open|won|lost)$")


class StageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    sort_order: int | None = None
    stage_type: str | None = Field(default=None, pattern="^(open|won|lost)$")


class CompanyPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    legal_name: str | None
    tax_id: str | None
    phone: str | None
    email: str | None
    website: str | None
    owner_user_id: int
    created_at: datetime
    updated_at: datetime


class CompanyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    legal_name: str | None = None
    tax_id: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    legal_name: str | None = None
    tax_id: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None


class ContactPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str | None
    email: str | None
    phone: str | None
    company_id: int | None
    owner_user_id: int
    created_at: datetime
    updated_at: datetime
    tags: list[TagPublic] = Field(default_factory=list)


class ContactCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=255)
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    company_id: int | None = None


class ContactUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=255)
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    company_id: int | None = None


class OpportunityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company_id: int | None
    contact_id: int | None
    pipeline_id: int
    stage_id: int
    amount_cents: int
    currency: str
    probability: int
    expected_close_date: date | None
    owner_user_id: int
    loss_reason_id: int | None
    created_at: datetime
    updated_at: datetime
    tags: list[TagPublic] = Field(default_factory=list)


class OpportunityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    company_id: int | None = None
    contact_id: int | None = None
    pipeline_id: int
    stage_id: int
    amount_cents: int = 0
    currency: str = Field(default="BRL", max_length=3)
    probability: int = Field(default=0, ge=0, le=100)
    expected_close_date: date | None = None


class OpportunityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    company_id: int | None = None
    contact_id: int | None = None
    pipeline_id: int | None = None
    stage_id: int | None = None
    amount_cents: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=3)
    probability: int | None = Field(default=None, ge=0, le=100)
    expected_close_date: date | None = None


class OpportunityStagePatch(BaseModel):
    stage_id: int


class MarkLostBody(BaseModel):
    loss_reason_id: int | None = None


class LossReasonPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pipeline_id: int | None
    name: str
    sort_order: int
    is_active: bool


class LossReasonCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    pipeline_id: int | None = None
    sort_order: int = 0
    is_active: bool = True


class LossReasonUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    pipeline_id: int | None = None
    sort_order: int | None = None
    is_active: bool | None = None
