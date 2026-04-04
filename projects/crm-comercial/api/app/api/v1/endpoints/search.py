from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.company import Company
from app.models.contact import Contact
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.tag import SearchHit, SearchResponse

router = APIRouter(prefix="/search", tags=["search"])

_MAX_PER_TYPE = 15
_MAX_TOTAL = 60


@router.get("", response_model=SearchResponse)
def global_search(
    q: str = Query(min_length=1, max_length=200),
    types: str | None = Query(
        None,
        description="Lista separada por vírgula: lead,company,contact,opportunity",
    ),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SearchResponse:
    uid = current.id
    raw = (types or "lead,company,contact,opportunity").lower().split(",")
    want = {t.strip() for t in raw if t.strip()}
    pat = f"%{q.strip()}%"
    hits: list[SearchHit] = []

    if "lead" in want:
        rows = (
            db.query(Lead)
            .filter(Lead.owner_user_id == uid)
            .filter(
                or_(
                    Lead.title.ilike(pat),
                    Lead.email.ilike(pat),
                    Lead.company_name.ilike(pat),
                )
            )
            .order_by(Lead.id.desc())
            .limit(_MAX_PER_TYPE)
            .all()
        )
        for r in rows:
            sub = r.email or r.company_name
            hits.append(SearchHit(type="lead", id=r.id, title=r.title, subtitle=sub))

    if "company" in want:
        rows = (
            db.query(Company)
            .filter(Company.owner_user_id == uid)
            .filter(
                or_(
                    Company.name.ilike(pat),
                    Company.legal_name.ilike(pat),
                    Company.tax_id.ilike(pat),
                    Company.email.ilike(pat),
                )
            )
            .order_by(Company.id.desc())
            .limit(_MAX_PER_TYPE)
            .all()
        )
        for r in rows:
            hits.append(SearchHit(type="company", id=r.id, title=r.name, subtitle=r.email))

    if "contact" in want:
        rows = (
            db.query(Contact)
            .filter(Contact.owner_user_id == uid)
            .filter(
                or_(
                    Contact.first_name.ilike(pat),
                    Contact.last_name.ilike(pat),
                    Contact.email.ilike(pat),
                    Contact.phone.ilike(pat),
                )
            )
            .order_by(Contact.id.desc())
            .limit(_MAX_PER_TYPE)
            .all()
        )
        for r in rows:
            name = r.first_name + (f" {r.last_name}" if r.last_name else "")
            hits.append(SearchHit(type="contact", id=r.id, title=name.strip(), subtitle=r.email))

    if "opportunity" in want:
        rows = (
            db.query(Opportunity)
            .filter(Opportunity.owner_user_id == uid)
            .filter(Opportunity.title.ilike(pat))
            .order_by(Opportunity.id.desc())
            .limit(_MAX_PER_TYPE)
            .all()
        )
        for r in rows:
            hits.append(
                SearchHit(
                    type="opportunity",
                    id=r.id,
                    title=r.title,
                    subtitle=str(r.amount_cents),
                )
            )

    return SearchResponse(hits=hits[:_MAX_TOTAL], query=q.strip())
