from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

ActivityType = Literal["call", "meeting", "email", "note", "other"]
EntityType = Literal["company", "contact", "opportunity", "lead"]


class ActivityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activity_type: str
    title: str
    notes: str | None
    occurred_at: datetime
    outcome: str | None
    owner_user_id: int
    entity_type: str | None
    entity_id: int | None
    created_at: datetime
    updated_at: datetime


class ActivityCreate(BaseModel):
    activity_type: ActivityType
    title: str = Field(min_length=1, max_length=512)
    notes: str | None = None
    occurred_at: datetime | None = None
    outcome: str | None = Field(default=None, max_length=255)
    entity_type: EntityType | None = None
    entity_id: int | None = None

    @model_validator(mode="after")
    def entity_pair(self) -> ActivityCreate:
        if (self.entity_type is None) ^ (self.entity_id is None):
            raise ValueError("entity_type e entity_id devem vir juntos ou omitidos.")
        return self


class ActivityUpdate(BaseModel):
    activity_type: ActivityType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=512)
    notes: str | None = None
    occurred_at: datetime | None = None
    outcome: str | None = Field(default=None, max_length=255)
    entity_type: EntityType | None = None
    entity_id: int | None = None

    @model_validator(mode="after")
    def entity_pair(self) -> ActivityUpdate:
        if self.entity_type is None and self.entity_id is None:
            return self
        if (self.entity_type is None) ^ (self.entity_id is None):
            raise ValueError("entity_type e entity_id devem vir juntos ou omitidos.")
        return self
