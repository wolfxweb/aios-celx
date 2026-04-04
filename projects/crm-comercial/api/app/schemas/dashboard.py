from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PeriodBounds(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_: datetime = Field(serialization_alias="from")
    to: datetime


class DashboardSummary(BaseModel):
    period: PeriodBounds
    open_leads: int
    open_opportunities: int
    pending_tasks: int
    activities_in_period: int
    companies: int
    contacts: int
