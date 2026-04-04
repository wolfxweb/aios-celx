from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.opportunity import Opportunity
from app.models.pipeline import Stage
from app.models.user import User
from app.schemas.crm import StagePublic, StageUpdate

router = APIRouter(prefix="/stages", tags=["stages"])


@router.patch("/{stage_id}", response_model=StagePublic)
def update_stage(
    stage_id: int,
    body: StageUpdate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Stage:
    s = db.get(Stage, stage_id)
    if s is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Etapa não encontrada."},
        )
    if body.name is not None:
        s.name = body.name.strip()
    if body.sort_order is not None:
        s.sort_order = body.sort_order
    if body.stage_type is not None:
        s.stage_type = body.stage_type
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stage(
    stage_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    s = db.get(Stage, stage_id)
    if s is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Etapa não encontrada."},
        )
    n = db.query(Opportunity).filter(Opportunity.stage_id == stage_id).count()
    if n > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "STAGE_IN_USE",
                "message": "Existem oportunidades nesta etapa; mova-as antes de excluir.",
            },
        )
    db.delete(s)
    db.commit()
