from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.entity_ownership import validate_owned_entity
from app.db.session import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.common import Paginated, PaginationMeta
from app.schemas.task import TaskCreate, TaskPublic, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _nf() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Tarefa não encontrada."},
    )


@router.get("", response_model=Paginated[TaskPublic])
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100, alias="pageSize"),
    status_filter: str | None = Query(None, alias="status"),
    entity_type: str | None = None,
    entity_id: int | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Paginated[TaskPublic]:
    q = db.query(Task).filter(Task.owner_user_id == current.id)
    if status_filter is not None:
        q = q.filter(Task.status == status_filter)
    if entity_type is not None:
        q = q.filter(Task.entity_type == entity_type)
    if entity_id is not None:
        q = q.filter(Task.entity_id == entity_id)
    q = q.order_by(Task.id.desc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0
    return Paginated[TaskPublic](
        data=[TaskPublic.model_validate(r) for r in rows],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=TaskPublic, status_code=status.HTTP_201_CREATED)
def create_task(
    body: TaskCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Task:
    validate_owned_entity(db, current.id, body.entity_type, body.entity_id)
    now = datetime.now(UTC)
    t = Task(
        title=body.title.strip(),
        description=body.description.strip() if body.description else None,
        status="pending",
        priority=body.priority,
        due_at=body.due_at,
        completed_at=None,
        owner_user_id=current.id,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        created_at=now,
        updated_at=now,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/{task_id}", response_model=TaskPublic)
def get_task(
    task_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Task:
    t = db.get(Task, task_id)
    if t is None or t.owner_user_id != current.id:
        raise _nf()
    return t


@router.patch("/{task_id}", response_model=TaskPublic)
def update_task(
    task_id: int,
    body: TaskUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Task:
    t = db.get(Task, task_id)
    if t is None or t.owner_user_id != current.id:
        raise _nf()
    if body.title is not None:
        t.title = body.title.strip()
    if body.description is not None:
        t.description = body.description.strip() if body.description else None
    if body.status is not None:
        t.status = body.status
        if body.status == "completed":
            t.completed_at = datetime.now(UTC)
        elif body.status == "pending":
            t.completed_at = None
    if body.priority is not None:
        t.priority = body.priority
    if body.due_at is not None:
        t.due_at = body.due_at
    upd = body.model_dump(exclude_unset=True)
    if "entity_type" in upd or "entity_id" in upd:
        et = upd.get("entity_type", t.entity_type)
        eid = upd.get("entity_id", t.entity_id)
        if (et is None) ^ (eid is None):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "VALIDATION_ERROR",
                    "message": "entity_type e entity_id devem vir juntos ou ambos nulos.",
                },
            )
        validate_owned_entity(db, current.id, et, eid)
        t.entity_type = et
        t.entity_id = eid
    t.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    t = db.get(Task, task_id)
    if t is None or t.owner_user_id != current.id:
        raise _nf()
    db.delete(t)
    db.commit()


@router.post("/{task_id}/complete", response_model=TaskPublic)
def complete_task(
    task_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Task:
    t = db.get(Task, task_id)
    if t is None or t.owner_user_id != current.id:
        raise _nf()
    now = datetime.now(UTC)
    t.status = "completed"
    t.completed_at = now
    t.updated_at = now
    db.commit()
    db.refresh(t)
    return t
