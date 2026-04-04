from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.entity_tags_batch import public_with_tags, tags_by_entity_ids
from app.db.session import get_db
from app.models.company import Company
from app.models.contact import Contact
from app.models.user import User
from app.schemas.common import Paginated, PaginationMeta
from app.schemas.crm import ContactCreate, ContactPublic, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _ensure_company_owned(company_id: int | None, user_id: int, db: Session) -> None:
    if company_id is None:
        return
    co = db.get(Company, company_id)
    if co is None or co.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Empresa inválida ou sem permissão.",
            },
        )


@router.get("", response_model=Paginated[ContactPublic])
def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100, alias="pageSize"),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Paginated[ContactPublic]:
    q = (
        db.query(Contact)
        .filter(Contact.owner_user_id == current.id)
        .order_by(Contact.id.desc())
    )
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0
    ids = [r.id for r in rows]
    tag_map = tags_by_entity_ids(db, current.id, "contact", ids)
    return Paginated[ContactPublic](
        data=[public_with_tags(ContactPublic, r, tag_map.get(r.id, [])) for r in rows],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=ContactPublic, status_code=status.HTTP_201_CREATED)
def create_contact(
    body: ContactCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Contact:
    _ensure_company_owned(body.company_id, current.id, db)
    now = datetime.now(UTC)
    c = Contact(
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip() if body.last_name else None,
        email=body.email,
        phone=body.phone,
        company_id=body.company_id,
        owner_user_id=current.id,
        created_at=now,
        updated_at=now,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/{contact_id}", response_model=ContactPublic)
def get_contact(
    contact_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ContactPublic:
    c = db.get(Contact, contact_id)
    if c is None or c.owner_user_id != current.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Contato não encontrado."},
        )
    tag_map = tags_by_entity_ids(db, current.id, "contact", [c.id])
    return public_with_tags(ContactPublic, c, tag_map.get(c.id, []))


@router.patch("/{contact_id}", response_model=ContactPublic)
def update_contact(
    contact_id: int,
    body: ContactUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Contact:
    c = db.get(Contact, contact_id)
    if c is None or c.owner_user_id != current.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Contato não encontrado."},
        )
    if body.company_id is not None:
        _ensure_company_owned(body.company_id, current.id, db)
    if body.first_name is not None:
        c.first_name = body.first_name.strip()
    if body.last_name is not None:
        c.last_name = body.last_name.strip() if body.last_name else None
    if body.email is not None:
        c.email = body.email
    if body.phone is not None:
        c.phone = body.phone
    if body.company_id is not None:
        c.company_id = body.company_id
    c.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    c = db.get(Contact, contact_id)
    if c is None or c.owner_user_id != current.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Contato não encontrado."},
        )
    db.delete(c)
    db.commit()
