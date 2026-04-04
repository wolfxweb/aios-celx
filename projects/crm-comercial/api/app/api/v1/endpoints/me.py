from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserPublic, UserUpdate

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserPublic)
def read_me(current: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic.model_validate(current)


@router.patch("", response_model=UserPublic)
def update_me(
    body: UserUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    if body.full_name is not None:
        current.full_name = body.full_name.strip()
    if body.phone is not None:
        p = body.phone.strip()
        current.phone = p if p else None
    if body.theme_preference is not None:
        current.theme_preference = body.theme_preference.strip()
    if body.sidebar_collapsed_default is not None:
        current.sidebar_collapsed_default = body.sidebar_collapsed_default
    db.add(current)
    db.commit()
    db.refresh(current)
    return current
