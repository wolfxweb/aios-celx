"""Validação de vínculos a entidades CRM (mesmo dono que o utilizador autenticado)."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.contact import Contact
from app.models.lead import Lead
from app.models.opportunity import Opportunity


def validate_owned_entity(
    db: Session, user_id: int, entity_type: str | None, entity_id: int | None
) -> None:
    if entity_type is None and entity_id is None:
        return
    if entity_type is None or entity_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "entity_type e entity_id devem vir juntos ou omitidos.",
            },
        )
    if entity_type == "company":
        row = db.get(Company, entity_id)
        msg = "Empresa inválida."
    elif entity_type == "contact":
        row = db.get(Contact, entity_id)
        msg = "Contato inválido."
    elif entity_type == "opportunity":
        row = db.get(Opportunity, entity_id)
        msg = "Oportunidade inválida."
    elif entity_type == "lead":
        row = db.get(Lead, entity_id)
        msg = "Lead inválido."
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Tipo de entidade inválido."},
        )
    if row is None or row.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": msg},
        )
