from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EntityType = Literal["lead", "company", "contact", "opportunity"]


class TagPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color_hex: str | None
    owner_user_id: int
    is_archived: bool
    created_at: datetime


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    color_hex: str | None = Field(default=None, max_length=16)


class TagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    color_hex: str | None = Field(default=None, max_length=16)
    is_archived: bool | None = None


class TagLinkBody(BaseModel):
    entity_type: EntityType
    entity_id: int


class SearchHit(BaseModel):
    type: str
    id: int
    title: str
    subtitle: str | None = None


class SearchResponse(BaseModel):
    hits: list[SearchHit]
    query: str
