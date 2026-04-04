from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Paginated, PaginationMeta
from app.schemas.users_admin import UserCreateAdmin, UserListItem, UserUpdateAdmin

router = APIRouter(prefix="/users", tags=["users"])


def _nf() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Utilizador não encontrado."},
    )


@router.get("", response_model=Paginated[UserListItem])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100, alias="pageSize"),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Paginated[UserListItem]:
    q = db.query(User).order_by(User.id)
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0
    return Paginated[UserListItem](
        data=[UserListItem.model_validate(r) for r in rows],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=UserListItem, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreateAdmin,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> User:
    if db.query(User).filter(User.email == body.email.lower().strip()).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE_EMAIL", "message": "E-mail já registado."},
        )
    u = User(
        email=body.email.lower().strip(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name.strip(),
        is_active=True,
        is_admin=body.is_admin,
        theme_preference="system",
        sidebar_collapsed_default=False,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.get("/{user_id}", response_model=UserListItem)
def get_user(
    user_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> User:
    u = db.get(User, user_id)
    if u is None:
        raise _nf()
    return u


@router.patch("/{user_id}", response_model=UserListItem)
def update_user(
    user_id: int,
    body: UserUpdateAdmin,
    current: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> User:
    u = db.get(User, user_id)
    if u is None:
        raise _nf()
    if body.full_name is not None:
        u.full_name = body.full_name.strip()
    if body.is_active is not None:
        u.is_active = body.is_active
    if body.is_admin is not None:
        u.is_admin = body.is_admin
    if u.id == current.id and body.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID", "message": "Não pode desativar a própria conta."},
        )
    if u.id == current.id and body.is_admin is False:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID", "message": "Não pode remover o próprio privilégio de admin."},
        )
    db.commit()
    db.refresh(u)
    return u


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: int,
    current: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> None:
    if user_id == current.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID", "message": "Não pode eliminar a própria conta."},
        )
    u = db.get(User, user_id)
    if u is None:
        raise _nf()
    u.is_active = False
    db.commit()
