from fastapi import APIRouter, Depends, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.loss_reason import LossReason
from app.models.user import User
from app.schemas.crm import LossReasonCreate, LossReasonPublic, LossReasonUpdate

router = APIRouter(prefix="/loss-reasons", tags=["loss-reasons"])


@router.get("", response_model=list[LossReasonPublic])
def list_loss_reasons(
    pipeline_id: int | None = None,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[LossReason]:
    q = db.query(LossReason).filter(LossReason.is_active.is_(True))
    if pipeline_id is not None:
        q = q.filter(
            or_(LossReason.pipeline_id == pipeline_id, LossReason.pipeline_id.is_(None))
        )
    return q.order_by(LossReason.sort_order, LossReason.id).all()


@router.post("", response_model=LossReasonPublic, status_code=status.HTTP_201_CREATED)
def create_loss_reason(
    body: LossReasonCreate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LossReason:
    lr = LossReason(
        pipeline_id=body.pipeline_id,
        name=body.name.strip(),
        sort_order=body.sort_order,
        is_active=body.is_active,
    )
    db.add(lr)
    db.commit()
    db.refresh(lr)
    return lr


@router.patch("/{loss_reason_id}", response_model=LossReasonPublic)
def update_loss_reason(
    loss_reason_id: int,
    body: LossReasonUpdate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LossReason:
    lr = db.get(LossReason, loss_reason_id)
    if lr is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Motivo de perda não encontrado."},
        )
    if body.name is not None:
        lr.name = body.name.strip()
    if body.pipeline_id is not None:
        lr.pipeline_id = body.pipeline_id
    if body.sort_order is not None:
        lr.sort_order = body.sort_order
    if body.is_active is not None:
        lr.is_active = body.is_active
    db.commit()
    db.refresh(lr)
    return lr
