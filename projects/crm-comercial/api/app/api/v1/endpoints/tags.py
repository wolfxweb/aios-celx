from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.entity_ownership import validate_owned_entity
from app.db.session import get_db
from app.models.tag import EntityTag, Tag
from app.models.user import User
from app.schemas.tag import TagCreate, TagLinkBody, TagPublic, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])

_ENTITY_TYPES = frozenset({"lead", "company", "contact", "opportunity"})


def _tag_nf() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": "Tag não encontrada."},
    )


@router.get("", response_model=list[TagPublic])
def list_tags(
    include_archived: bool = False,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Tag]:
    q = db.query(Tag).filter(Tag.owner_user_id == current.id)
    if not include_archived:
        q = q.filter(Tag.is_archived.is_(False))
    return q.order_by(Tag.name).all()


@router.get("/by-entity/{entity_type}/{entity_id}", response_model=list[TagPublic])
def list_tags_for_entity(
    entity_type: str,
    entity_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Tag]:
    """Tags ligadas a uma entidade CRM (lead, company, contact, opportunity)."""
    if entity_type not in _ENTITY_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Tipo de entidade inválido.",
            },
        )
    validate_owned_entity(db, current.id, entity_type, entity_id)
    return (
        db.query(Tag)
        .join(EntityTag, EntityTag.tag_id == Tag.id)
        .filter(
            EntityTag.owner_user_id == current.id,
            EntityTag.entity_type == entity_type,
            EntityTag.entity_id == entity_id,
            Tag.owner_user_id == current.id,
        )
        .order_by(Tag.name)
        .all()
    )


@router.post("", response_model=TagPublic, status_code=status.HTTP_201_CREATED)
def create_tag(
    body: TagCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Tag:
    t = Tag(
        name=body.name.strip(),
        color_hex=body.color_hex.strip() if body.color_hex else None,
        owner_user_id=current.id,
        is_archived=False,
    )
    db.add(t)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE", "message": "Já existe uma tag com este nome."},
        ) from None
    db.refresh(t)
    return t


@router.get("/{tag_id}", response_model=TagPublic)
def get_tag(
    tag_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Tag:
    t = db.get(Tag, tag_id)
    if t is None or t.owner_user_id != current.id:
        raise _tag_nf()
    return t


@router.patch("/{tag_id}", response_model=TagPublic)
def update_tag(
    tag_id: int,
    body: TagUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Tag:
    t = db.get(Tag, tag_id)
    if t is None or t.owner_user_id != current.id:
        raise _tag_nf()
    if body.name is not None:
        t.name = body.name.strip()
    if body.color_hex is not None:
        t.color_hex = body.color_hex.strip() if body.color_hex else None
    if body.is_archived is not None:
        t.is_archived = body.is_archived
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE", "message": "Já existe uma tag com este nome."},
        ) from None
    db.refresh(t)
    return t


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_tag(
    tag_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    t = db.get(Tag, tag_id)
    if t is None or t.owner_user_id != current.id:
        raise _tag_nf()
    t.is_archived = True
    db.commit()


@router.post("/{tag_id}/link", status_code=status.HTTP_204_NO_CONTENT)
def link_tag(
    tag_id: int,
    body: TagLinkBody,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    t = db.get(Tag, tag_id)
    if t is None or t.owner_user_id != current.id or t.is_archived:
        raise _tag_nf()
    validate_owned_entity(db, current.id, body.entity_type, body.entity_id)
    exists = (
        db.query(EntityTag)
        .filter(
            EntityTag.tag_id == tag_id,
            EntityTag.entity_type == body.entity_type,
            EntityTag.entity_id == body.entity_id,
        )
        .first()
    )
    if exists is not None:
        return
    et = EntityTag(
        tag_id=tag_id,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        owner_user_id=current.id,
    )
    db.add(et)
    db.commit()


@router.delete("/{tag_id}/link", status_code=status.HTTP_204_NO_CONTENT)
def unlink_tag(
    tag_id: int,
    entity_type: str = Query(..., pattern="^(lead|company|contact|opportunity)$"),
    entity_id: int = Query(..., ge=1),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    t = db.get(Tag, tag_id)
    if t is None or t.owner_user_id != current.id:
        raise _tag_nf()
    row = (
        db.query(EntityTag)
        .filter(
            EntityTag.tag_id == tag_id,
            EntityTag.entity_type == entity_type,
            EntityTag.entity_id == entity_id,
            EntityTag.owner_user_id == current.id,
        )
        .first()
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Vínculo não encontrado."},
        )
    db.delete(row)
    db.commit()
