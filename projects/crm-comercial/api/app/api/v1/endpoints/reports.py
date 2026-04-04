from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.activity import Activity
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.pipeline import Stage
from app.models.user import User
from app.schemas.reports import ReportCatalogItem, ReportRunRequest, ReportRunResponse

router = APIRouter(prefix="/reports", tags=["reports"])

CATALOG: list[ReportCatalogItem] = [
    ReportCatalogItem(
        id="leads-by-stage",
        title="Leads por etapa de qualificação",
        description="Contagem de leads abertos agrupados por etapa.",
    ),
    ReportCatalogItem(
        id="opportunities-by-stage",
        title="Oportunidades por etapa do pipeline",
        description="Contagem de oportunidades em etapas abertas, por nome de etapa.",
    ),
    ReportCatalogItem(
        id="activities-by-type",
        title="Atividades por tipo",
        description="Contagem de atividades no período (ou todas se datas omitidas).",
    ),
]


def _parse_dt(s: str | None) -> datetime | None:
    if s is None or not s.strip():
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


def _run_leads_by_stage(db: Session, uid: int, _: ReportRunRequest) -> ReportRunResponse:
    q = (
        db.query(Lead.qualification_stage, func.count(Lead.id))
        .filter(Lead.owner_user_id == uid, Lead.status == "open")
        .group_by(Lead.qualification_stage)
        .order_by(Lead.qualification_stage)
    )
    rows_data = [[str(a), int(b)] for a, b in q.all()]
    return ReportRunResponse(
        report_id="leads-by-stage",
        columns=["Etapa", "Total"],
        rows=rows_data,
        meta={},
    )


def _run_opportunities_by_stage(db: Session, uid: int, body: ReportRunRequest) -> ReportRunResponse:
    q = (
        db.query(Stage.name, func.count(Opportunity.id))
        .join(Opportunity, Opportunity.stage_id == Stage.id)
        .filter(Opportunity.owner_user_id == uid, Stage.stage_type == "open")
    )
    if body.pipeline_id is not None:
        q = q.filter(Stage.pipeline_id == body.pipeline_id)
    q = q.group_by(Stage.id, Stage.name).order_by(Stage.name)
    rows_data = [[str(a), int(b)] for a, b in q.all()]
    return ReportRunResponse(
        report_id="opportunities-by-stage",
        columns=["Etapa", "Total"],
        rows=rows_data,
        meta={},
    )


def _run_activities_by_type(db: Session, uid: int, body: ReportRunRequest) -> ReportRunResponse:
    q = db.query(Activity.activity_type, func.count(Activity.id)).filter(Activity.owner_user_id == uid)
    df = _parse_dt(body.date_from)
    dt = _parse_dt(body.date_to)
    if df is not None:
        q = q.filter(Activity.occurred_at >= df)
    if dt is not None:
        q = q.filter(Activity.occurred_at <= dt)
    q = q.group_by(Activity.activity_type).order_by(Activity.activity_type)
    rows_data = [[str(a), int(b)] for a, b in q.all()]
    return ReportRunResponse(
        report_id="activities-by-type",
        columns=["Tipo", "Total"],
        rows=rows_data,
        meta={},
    )


RUNNERS: dict[str, Any] = {
    "leads-by-stage": _run_leads_by_stage,
    "opportunities-by-stage": _run_opportunities_by_stage,
    "activities-by-type": _run_activities_by_type,
}


@router.get("", response_model=list[ReportCatalogItem])
def list_reports(_: User = Depends(get_current_user)) -> list[ReportCatalogItem]:
    return CATALOG


@router.post("/{report_id}/run", response_model=ReportRunResponse)
def run_report(
    report_id: str,
    body: ReportRunRequest,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReportRunResponse:
    if report_id not in RUNNERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Relatório desconhecido."},
        )
    return RUNNERS[report_id](db, current.id, body)
