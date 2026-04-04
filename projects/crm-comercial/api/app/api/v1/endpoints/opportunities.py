from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.entity_tags_batch import public_with_tags, tags_by_entity_ids
from app.db.session import get_db
from app.models.company import Company
from app.models.contact import Contact
from app.models.loss_reason import LossReason
from app.models.opportunity import Opportunity
from app.models.pipeline import Pipeline, Stage
from app.models.user import User
from app.schemas.common import Paginated, PaginationMeta
from app.schemas.crm import (
    MarkLostBody,
    OpportunityCreate,
    OpportunityPublic,
    OpportunityStagePatch,
    OpportunityUpdate,
)

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Oportunidade não encontrada."},
    )


def _validate_pipeline_stage(db: Session, pipeline_id: int, stage_id: int) -> Stage:
    st = db.get(Stage, stage_id)
    if st is None or st.pipeline_id != pipeline_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Etapa não pertence ao pipeline indicado.",
            },
        )
    return st


def _validate_company(db: Session, company_id: int | None, user_id: int) -> None:
    if company_id is None:
        return
    c = db.get(Company, company_id)
    if c is None or c.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Empresa inválida."},
        )


def _validate_contact(db: Session, contact_id: int | None, user_id: int) -> None:
    if contact_id is None:
        return
    c = db.get(Contact, contact_id)
    if c is None or c.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Contato inválido."},
        )


def _find_stage_by_type(db: Session, pipeline_id: int, stage_type: str) -> Stage:
    st = (
        db.query(Stage)
        .filter(Stage.pipeline_id == pipeline_id, Stage.stage_type == stage_type)
        .order_by(Stage.sort_order)
        .first()
    )
    if st is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "MISSING_STAGE",
                "message": f"Não existe etapa do tipo «{stage_type}» neste pipeline.",
            },
        )
    return st


def _validate_loss_reason(
    db: Session, loss_reason_id: int | None, pipeline_id: int
) -> None:
    if loss_reason_id is None:
        return
    lr = db.get(LossReason, loss_reason_id)
    if lr is None or not lr.is_active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Motivo de perda inválido."},
        )
    if lr.pipeline_id is not None and lr.pipeline_id != pipeline_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Motivo de perda não se aplica a este pipeline.",
            },
        )


@router.get("", response_model=Paginated[OpportunityPublic])
def list_opportunities(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100, alias="pageSize"),
    pipeline_id: int | None = Query(None),
    stage_id: int | None = Query(None),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Paginated[OpportunityPublic]:
    q = db.query(Opportunity).filter(Opportunity.owner_user_id == current.id)
    if pipeline_id is not None:
        q = q.filter(Opportunity.pipeline_id == pipeline_id)
    if stage_id is not None:
        q = q.filter(Opportunity.stage_id == stage_id)
    q = q.order_by(Opportunity.id.desc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0
    ids = [r.id for r in rows]
    tag_map = tags_by_entity_ids(db, current.id, "opportunity", ids)
    return Paginated[OpportunityPublic](
        data=[public_with_tags(OpportunityPublic, r, tag_map.get(r.id, [])) for r in rows],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=OpportunityPublic, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    body: OpportunityCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Opportunity:
    if db.get(Pipeline, body.pipeline_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Pipeline inválido."},
        )
    _validate_pipeline_stage(db, body.pipeline_id, body.stage_id)
    _validate_company(db, body.company_id, current.id)
    _validate_contact(db, body.contact_id, current.id)
    now = datetime.now(UTC)
    o = Opportunity(
        title=body.title.strip(),
        company_id=body.company_id,
        contact_id=body.contact_id,
        pipeline_id=body.pipeline_id,
        stage_id=body.stage_id,
        amount_cents=body.amount_cents,
        currency=body.currency.upper(),
        probability=body.probability,
        expected_close_date=body.expected_close_date,
        owner_user_id=current.id,
        loss_reason_id=None,
        created_at=now,
        updated_at=now,
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return o


@router.get("/{opportunity_id}", response_model=OpportunityPublic)
def get_opportunity(
    opportunity_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OpportunityPublic:
    o = db.get(Opportunity, opportunity_id)
    if o is None or o.owner_user_id != current.id:
        raise _not_found()
    tag_map = tags_by_entity_ids(db, current.id, "opportunity", [o.id])
    return public_with_tags(OpportunityPublic, o, tag_map.get(o.id, []))


@router.patch("/{opportunity_id}", response_model=OpportunityPublic)
def update_opportunity(
    opportunity_id: int,
    body: OpportunityUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Opportunity:
    o = db.get(Opportunity, opportunity_id)
    if o is None or o.owner_user_id != current.id:
        raise _not_found()
    pid = body.pipeline_id if body.pipeline_id is not None else o.pipeline_id
    sid = body.stage_id if body.stage_id is not None else o.stage_id
    if body.pipeline_id is not None:
        if db.get(Pipeline, body.pipeline_id) is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "VALIDATION_ERROR", "message": "Pipeline inválido."},
            )
    if body.stage_id is not None or body.pipeline_id is not None:
        _validate_pipeline_stage(db, pid, sid)
    if body.company_id is not None:
        _validate_company(db, body.company_id, current.id)
    if body.contact_id is not None:
        _validate_contact(db, body.contact_id, current.id)

    if body.title is not None:
        o.title = body.title.strip()
    if body.company_id is not None:
        o.company_id = body.company_id
    if body.contact_id is not None:
        o.contact_id = body.contact_id
    if body.pipeline_id is not None:
        o.pipeline_id = body.pipeline_id
    if body.stage_id is not None:
        o.stage_id = body.stage_id
    if body.amount_cents is not None:
        o.amount_cents = body.amount_cents
    if body.currency is not None:
        o.currency = body.currency.upper()
    if body.probability is not None:
        o.probability = body.probability
    if body.expected_close_date is not None:
        o.expected_close_date = body.expected_close_date
    o.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(o)
    return o


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    o = db.get(Opportunity, opportunity_id)
    if o is None or o.owner_user_id != current.id:
        raise _not_found()
    db.delete(o)
    db.commit()


@router.patch("/{opportunity_id}/stage", response_model=OpportunityPublic)
def patch_opportunity_stage(
    opportunity_id: int,
    body: OpportunityStagePatch,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Opportunity:
    o = db.get(Opportunity, opportunity_id)
    if o is None or o.owner_user_id != current.id:
        raise _not_found()
    _validate_pipeline_stage(db, o.pipeline_id, body.stage_id)
    st = db.get(Stage, body.stage_id)
    assert st is not None
    o.stage_id = body.stage_id
    if st.stage_type != "lost":
        o.loss_reason_id = None
    o.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(o)
    return o


@router.post("/{opportunity_id}/mark-won", response_model=OpportunityPublic)
def mark_won(
    opportunity_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Opportunity:
    o = db.get(Opportunity, opportunity_id)
    if o is None or o.owner_user_id != current.id:
        raise _not_found()
    won = _find_stage_by_type(db, o.pipeline_id, "won")
    o.stage_id = won.id
    o.loss_reason_id = None
    o.probability = 100
    o.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(o)
    return o


@router.post("/{opportunity_id}/mark-lost", response_model=OpportunityPublic)
def mark_lost(
    opportunity_id: int,
    body: MarkLostBody,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Opportunity:
    o = db.get(Opportunity, opportunity_id)
    if o is None or o.owner_user_id != current.id:
        raise _not_found()
    lost = _find_stage_by_type(db, o.pipeline_id, "lost")
    _validate_loss_reason(db, body.loss_reason_id, o.pipeline_id)
    o.stage_id = lost.id
    o.loss_reason_id = body.loss_reason_id
    o.probability = 0
    o.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(o)
    return o
