from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.activity import Activity
from app.models.company import Company
from app.models.contact import Contact
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.pipeline import Stage
from app.models.task import Task
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, PeriodBounds

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    days: int = Query(30, ge=1, le=366, description="Janela em dias até agora (UTC)"),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    uid = current.id
    to_dt = datetime.now(UTC)
    from_dt = to_dt - timedelta(days=days)

    open_leads = (
        db.query(func.count(Lead.id)).filter(Lead.owner_user_id == uid, Lead.status == "open").scalar()
        or 0
    )

    open_opportunities = (
        db.query(func.count(Opportunity.id))
        .join(Stage, Opportunity.stage_id == Stage.id)
        .filter(Opportunity.owner_user_id == uid, Stage.stage_type == "open")
        .scalar()
        or 0
    )

    pending_tasks = (
        db.query(func.count(Task.id))
        .filter(Task.owner_user_id == uid, Task.status == "pending")
        .scalar()
        or 0
    )

    activities_in_period = (
        db.query(func.count(Activity.id))
        .filter(
            Activity.owner_user_id == uid,
            Activity.occurred_at >= from_dt,
            Activity.occurred_at <= to_dt,
        )
        .scalar()
        or 0
    )

    companies = (
        db.query(func.count(Company.id)).filter(Company.owner_user_id == uid).scalar() or 0
    )

    contacts = (
        db.query(func.count(Contact.id)).filter(Contact.owner_user_id == uid).scalar() or 0
    )

    return DashboardSummary(
        period=PeriodBounds(from_=from_dt, to=to_dt),
        open_leads=int(open_leads),
        open_opportunities=int(open_opportunities),
        pending_tasks=int(pending_tasks),
        activities_in_period=int(activities_in_period),
        companies=int(companies),
        contacts=int(contacts),
    )
