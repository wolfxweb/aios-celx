from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.pipeline import Pipeline, Stage
from app.models.user import User
from app.schemas.crm import (
    PipelineCreate,
    PipelinePublic,
    PipelineUpdate,
    StageCreate,
    StagePublic,
    StageUpdate,
)

router = APIRouter(prefix="/pipelines", tags=["pipelines"])


def _nf() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Pipeline não encontrado."},
    )


@router.get("", response_model=list[PipelinePublic])
def list_pipelines(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Pipeline]:
    rows = (
        db.query(Pipeline)
        .options(joinedload(Pipeline.stages))
        .order_by(Pipeline.id)
        .all()
    )
    return rows


@router.post("", response_model=PipelinePublic, status_code=status.HTTP_201_CREATED)
def create_pipeline(
    body: PipelineCreate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Pipeline:
    if body.is_default:
        db.query(Pipeline).update({Pipeline.is_default: False}, synchronize_session=False)
    p = Pipeline(name=body.name.strip(), is_default=body.is_default)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/{pipeline_id}", response_model=PipelinePublic)
def get_pipeline(
    pipeline_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Pipeline:
    p = (
        db.query(Pipeline)
        .options(joinedload(Pipeline.stages))
        .filter(Pipeline.id == pipeline_id)
        .one_or_none()
    )
    if p is None:
        raise _nf()
    return p


@router.patch("/{pipeline_id}", response_model=PipelinePublic)
def update_pipeline(
    pipeline_id: int,
    body: PipelineUpdate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Pipeline:
    p = db.get(Pipeline, pipeline_id)
    if p is None:
        raise _nf()
    if body.name is not None:
        p.name = body.name.strip()
    if body.is_default is not None:
        if body.is_default:
            db.query(Pipeline).filter(Pipeline.id != pipeline_id).update(
                {Pipeline.is_default: False}, synchronize_session=False
            )
        p.is_default = body.is_default
    db.commit()
    out = (
        db.query(Pipeline)
        .options(joinedload(Pipeline.stages))
        .filter(Pipeline.id == pipeline_id)
        .one()
    )
    return out


@router.post("/{pipeline_id}/stages", response_model=StagePublic, status_code=status.HTTP_201_CREATED)
def add_stage(
    pipeline_id: int,
    body: StageCreate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Stage:
    p = db.get(Pipeline, pipeline_id)
    if p is None:
        raise _nf()
    s = Stage(
        pipeline_id=pipeline_id,
        name=body.name.strip(),
        sort_order=body.sort_order,
        stage_type=body.stage_type,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
