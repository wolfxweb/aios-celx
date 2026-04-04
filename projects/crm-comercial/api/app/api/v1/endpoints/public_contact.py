from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.contact_submission import ContactSubmission
from app.schemas.public_contact import PublicContactBody

router = APIRouter(prefix="/public", tags=["public"])


@router.post("/contact", status_code=status.HTTP_201_CREATED)
def submit_public_contact(
    body: PublicContactBody,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    if not body.consent:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "CONSENT_REQUIRED", "message": "É necessário aceitar o consentimento."},
        )
    row = ContactSubmission(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        company=body.company.strip() if body.company else None,
        phone=body.phone.strip() if body.phone else None,
        message=body.message.strip(),
        consent=True,
    )
    db.add(row)
    db.commit()
    return {"ok": True}
