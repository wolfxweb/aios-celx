"""Carga em lote de tags por entidade para listagens CRM."""

from __future__ import annotations

from typing import Any, TypeVar

from sqlalchemy.orm import Session

from app.models.tag import EntityTag, Tag

T = TypeVar("T")


def tags_by_entity_ids(
    db: Session,
    owner_user_id: int,
    entity_type: str,
    entity_ids: list[int],
) -> dict[int, list[Tag]]:
    if not entity_ids:
        return {}
    rows = (
        db.query(EntityTag.entity_id, Tag)
        .join(Tag, Tag.id == EntityTag.tag_id)
        .filter(
            EntityTag.owner_user_id == owner_user_id,
            EntityTag.entity_type == entity_type,
            EntityTag.entity_id.in_(entity_ids),
            Tag.owner_user_id == owner_user_id,
        )
        .order_by(EntityTag.entity_id, Tag.name)
    )
    out: dict[int, list[Tag]] = {}
    for eid, tag in rows.all():
        out.setdefault(eid, []).append(tag)
    return out


def public_with_tags(public_cls: type[T], orm_obj: Any, tags: list[Tag]) -> T:
    from app.schemas.tag import TagPublic

    data = public_cls.model_validate(orm_obj).model_dump()
    data["tags"] = [TagPublic.model_validate(t) for t in tags]
    return public_cls(**data)
