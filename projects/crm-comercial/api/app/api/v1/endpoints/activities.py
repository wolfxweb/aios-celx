from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.entity_ownership import validate_owned_entity
from app.db.session import get_db
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityPublic, ActivityUpdate
from app.schemas.common import Paginated, PaginationMeta

router = APIRouter(prefix="/activities", tags=["activities"])


def _nf() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Atividade não encontrada."},
    )


@router.get("", response_model=Paginated[ActivityPublic])
def list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100, alias="pageSize"),
    activity_type: str | None = Query(None, alias="type"),
    entity_type: str | None = None,
    entity_id: int | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Paginated[ActivityPublic]:
    q = db.query(Activity).filter(Activity.owner_user_id == current.id)
    if activity_type is not None:
        q = q.filter(Activity.activity_type == activity_type)
    if entity_type is not None:
        q = q.filter(Activity.entity_type == entity_type)
    if entity_id is not None:
        q = q.filter(Activity.entity_id == entity_id)
    q = q.order_by(Activity.occurred_at.desc(), Activity.id.desc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0
    return Paginated[ActivityPublic](
        data=[ActivityPublic.model_validate(r) for r in rows],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=ActivityPublic, status_code=status.HTTP_201_CREATED)
def create_activity(
    body: ActivityCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Activity:
    validate_owned_entity(db, current.id, body.entity_type, body.entity_id)
    now = datetime.now(UTC)
    occurred = body.occurred_at if body.occurred_at is not None else now
    a = Activity(
        activity_type=body.activity_type,
        title=body.title.strip(),
        notes=body.notes.strip() if body.notes else None,
        occurred_at=occurred,
        outcome=body.outcome.strip() if body.outcome else None,
        owner_user_id=current.id,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        created_at=now,
        updated_at=now,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.get("/{activity_id}", response_model=ActivityPublic)
def get_activity(
    activity_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Activity:
    a = db.get(Activity, activity_id)
    if a is None or a.owner_user_id != current.id:
        raise _nf()
    return a


@router.patch("/{activity_id}", response_model=ActivityPublic)
def update_activity(
    activity_id: int,
    body: ActivityUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Activity:
    a = db.get(Activity, activity_id)
    if a is None or a.owner_user_id != current.id:
        raise _nf()
    if body.activity_type is not None:
        a.activity_type = body.activity_type
    if body.title is not None:
        a.title = body.title.strip()
    if body.notes is not None:
        a.notes = body.notes.strip() if body.notes else None
    if body.occurred_at is not None:
        a.occurred_at = body.occurred_at
    if body.outcome is not None:
        a.outcome = body.outcome.strip() if body.outcome else None
    upd = body.model_dump(exclude_unset=True)
    if "entity_type" in upd or "entity_id" in upd:
        et = upd.get("entity_type", a.entity_type)
        eid = upd.get("entity_id", a.entity_id)
        if (et is None) ^ (eid is None):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "VALIDATION_ERROR",
                    "message": "entity_type e entity_id devem vir juntos ou ambos nulos.",
                },
            )
        validate_owned_entity(db, current.id, et, eid)
        a.entity_type = et
        a.entity_id = eid
    a.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    a = db.get(Activity, activity_id)
    if a is None or a.owner_user_id != current.id:
        raise _nf()
    db.delete(a)
    db.commit()
