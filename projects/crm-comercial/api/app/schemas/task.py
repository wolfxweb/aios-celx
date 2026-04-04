from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

EntityType = Literal["company", "contact", "opportunity", "lead"]


class TaskPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: str
    priority: str
    due_at: datetime | None
    completed_at: datetime | None
    owner_user_id: int
    entity_type: str | None
    entity_id: int | None
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    description: str | None = None
    priority: Literal["low", "normal", "high"] = "normal"
    due_at: datetime | None = None
    entity_type: EntityType | None = None
    entity_id: int | None = None

    @model_validator(mode="after")
    def entity_pair(self) -> TaskCreate:
        if (self.entity_type is None) ^ (self.entity_id is None):
            raise ValueError("entity_type e entity_id devem vir juntos ou omitidos.")
        return self


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    description: str | None = None
    status: Literal["pending", "completed", "cancelled"] | None = None
    priority: Literal["low", "normal", "high"] | None = None
    due_at: datetime | None = None
    entity_type: EntityType | None = None
    entity_id: int | None = None

    @model_validator(mode="after")
    def entity_pair(self) -> TaskUpdate:
        if self.entity_type is None and self.entity_id is None:
            return self
        if (self.entity_type is None) ^ (self.entity_id is None):
            raise ValueError("entity_type e entity_id devem vir juntos ou omitidos.")
        return self
