from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.entity_tags_batch import public_with_tags, tags_by_entity_ids
from app.db.session import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.common import Paginated, PaginationMeta
from app.schemas.crm import CompanyCreate, CompanyPublic, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=Paginated[CompanyPublic])
def list_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100, alias="pageSize"),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Paginated[CompanyPublic]:
    q = (
        db.query(Company)
        .filter(Company.owner_user_id == current.id)
        .order_by(Company.id.desc())
    )
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total else 0
    return Paginated[CompanyPublic](
        data=[CompanyPublic.model_validate(r) for r in rows],
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=CompanyPublic, status_code=status.HTTP_201_CREATED)
def create_company(
    body: CompanyCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Company:
    now = datetime.now(UTC)
    c = Company(
        name=body.name.strip(),
        legal_name=body.legal_name.strip() if body.legal_name else None,
        tax_id=body.tax_id.strip() if body.tax_id else None,
        phone=body.phone,
        email=body.email,
        website=body.website,
        owner_user_id=current.id,
        created_at=now,
        updated_at=now,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/{company_id}", response_model=CompanyPublic)
def get_company(
    company_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyPublic:
    c = db.get(Company, company_id)
    if c is None or c.owner_user_id != current.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Empresa não encontrada."},
        )
    tag_map = tags_by_entity_ids(db, current.id, "company", [c.id])
    return public_with_tags(CompanyPublic, c, tag_map.get(c.id, []))


@router.patch("/{company_id}", response_model=CompanyPublic)
def update_company(
    company_id: int,
    body: CompanyUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Company:
    c = db.get(Company, company_id)
    if c is None or c.owner_user_id != current.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Empresa não encontrada."},
        )
    if body.name is not None:
        c.name = body.name.strip()
    if body.legal_name is not None:
        c.legal_name = body.legal_name.strip() if body.legal_name else None
    if body.tax_id is not None:
        c.tax_id = body.tax_id.strip() if body.tax_id else None
    if body.phone is not None:
        c.phone = body.phone
    if body.email is not None:
        c.email = body.email
    if body.website is not None:
        c.website = body.website
    c.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    c = db.get(Company, company_id)
    if c is None or c.owner_user_id != current.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Empresa não encontrada."},
        )
    db.delete(c)
    db.commit()
