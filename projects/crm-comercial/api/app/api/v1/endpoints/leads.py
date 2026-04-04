from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.entity_tags_batch import public_with_tags, tags_by_entity_ids
from app.db.session import get_db
from app.models.company import Company
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.pipeline import Pipeline, Stage
from app.models.user import User
from app.schemas.common import Paginated, PaginationMeta
from app.schemas.lead import (
    LeadConvertBody,
    LeadCreate,
    LeadPublic,
    LeadStagePatch,
    LeadUpdate,
)

router = APIRouter(prefix="/leads", tags=["leads"])


def _nf() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Lead não encontrado."},
    )


def _validate_pipeline_stage(db: Session, pipeline_id: int, stage_id: int) -> None:
    st = db.get(Stage, stage_id)
    if st is None or st.pipeline_id != pipeline_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Etapa não pertence ao pipeline indicado.",
            },
        )


@router.get("", response_model=Paginated[LeadPublic])
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100, alias="pageSize"),
    status_filter: str | None = Query(None, alias="status"),
    qualification_stage: str | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Paginated[LeadPublic]:
    q = db.query(Lead).filter(Lead.owner_user_id == current.id)
    if status_filter is not None:
        q = q.filter(Lead.status == status_filter)
    if qualification_stage is not None:
        q = q.filter(Lead.qualification_stage == qualification_stage)
    q = q.order_by(Lead.id.desc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0
    ids = [r.id for r in rows]
    tag_map = tags_by_entity_ids(db, current.id, "lead", ids)
    return Paginated[LeadPublic](
        data=[public_with_tags(LeadPublic, r, tag_map.get(r.id, [])) for r in rows],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=LeadPublic, status_code=status.HTTP_201_CREATED)
def create_lead(
    body: LeadCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Lead:
    now = datetime.now(UTC)
    lead = Lead(
        title=body.title.strip(),
        email=body.email.strip() if body.email else None,
        phone=body.phone.strip() if body.phone else None,
        company_name=body.company_name.strip() if body.company_name else None,
        source=body.source.strip() if body.source else None,
        qualification_stage=body.qualification_stage,
        status="open",
        score=body.score,
        owner_user_id=current.id,
        converted_opportunity_id=None,
        created_at=now,
        updated_at=now,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadPublic)
def get_lead(
    lead_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadPublic:
    lead = db.get(Lead, lead_id)
    if lead is None or lead.owner_user_id != current.id:
        raise _nf()
    tag_map = tags_by_entity_ids(db, current.id, "lead", [lead.id])
    return public_with_tags(LeadPublic, lead, tag_map.get(lead.id, []))


@router.patch("/{lead_id}", response_model=LeadPublic)
def update_lead(
    lead_id: int,
    body: LeadUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None or lead.owner_user_id != current.id:
        raise _nf()
    if lead.status == "converted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "LEAD_CONVERTED", "message": "Lead já convertido."},
        )
    if body.title is not None:
        lead.title = body.title.strip()
    if body.email is not None:
        lead.email = body.email.strip() if body.email else None
    if body.phone is not None:
        lead.phone = body.phone.strip() if body.phone else None
    if body.company_name is not None:
        lead.company_name = body.company_name.strip() if body.company_name else None
    if body.source is not None:
        lead.source = body.source.strip() if body.source else None
    if body.qualification_stage is not None:
        lead.qualification_stage = body.qualification_stage
    if body.score is not None:
        lead.score = body.score
    if body.status is not None:
        lead.status = body.status
    lead.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    lead = db.get(Lead, lead_id)
    if lead is None or lead.owner_user_id != current.id:
        raise _nf()
    db.delete(lead)
    db.commit()


@router.patch("/{lead_id}/stage", response_model=LeadPublic)
def patch_lead_stage(
    lead_id: int,
    body: LeadStagePatch,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None or lead.owner_user_id != current.id:
        raise _nf()
    if lead.status != "open":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "INVALID_STATE", "message": "Apenas leads abertos podem mudar de etapa."},
        )
    lead.qualification_stage = body.qualification_stage
    if body.qualification_stage == "perdido":
        lead.status = "lost"
    lead.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/convert", response_model=LeadPublic)
def convert_lead(
    lead_id: int,
    body: LeadConvertBody,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None or lead.owner_user_id != current.id:
        raise _nf()
    if lead.status != "open":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "ALREADY_CONVERTED", "message": "Lead já convertido ou encerrado."},
        )
    if db.get(Pipeline, body.pipeline_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Pipeline inválido."},
        )
    _validate_pipeline_stage(db, body.pipeline_id, body.stage_id)

    company_id = body.company_id
    if company_id is not None:
        co = db.get(Company, company_id)
        if co is None or co.owner_user_id != current.id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "VALIDATION_ERROR", "message": "Empresa inválida."},
            )
    elif body.create_company_from_lead and (lead.company_name and lead.company_name.strip()):
        now = datetime.now(UTC)
        co = Company(
            name=lead.company_name.strip(),
            owner_user_id=current.id,
            created_at=now,
            updated_at=now,
        )
        db.add(co)
        db.flush()
        company_id = co.id

    now = datetime.now(UTC)
    opp_title = (body.opportunity_title or lead.title).strip()
    opp = Opportunity(
        title=opp_title,
        company_id=company_id,
        contact_id=None,
        pipeline_id=body.pipeline_id,
        stage_id=body.stage_id,
        amount_cents=body.amount_cents,
        currency=body.currency.upper(),
        probability=0,
        expected_close_date=None,
        owner_user_id=current.id,
        loss_reason_id=None,
        created_at=now,
        updated_at=now,
    )
    db.add(opp)
    db.flush()

    lead.status = "converted"
    lead.converted_opportunity_id = opp.id
    lead.qualification_stage = "qualificado"
    lead.updated_at = now
    db.commit()
    db.refresh(lead)
    return lead
