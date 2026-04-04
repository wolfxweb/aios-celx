from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.loss_reason import LossReason
from app.models.pipeline import Pipeline, Stage
from app.models.user import User


def seed_dev_user_if_empty(db: Session) -> None:
    if db.query(User).first() is not None:
        return
    user = User(
        email="admin@example.com",
        hashed_password=hash_password("admin123"),
        full_name="Administrador Demo",
        is_active=True,
        is_admin=True,
        theme_preference="light",
        sidebar_collapsed_default=False,
    )
    db.add(user)
    db.commit()


def seed_crm_if_empty(db: Session) -> None:
    if db.query(Pipeline).first() is not None:
        return
    p = Pipeline(name="Vendas padrão", is_default=True)
    db.add(p)
    db.flush()
    for name, order, stype in (
        ("Prospecção", 1, "open"),
        ("Qualificação", 2, "open"),
        ("Proposta", 3, "open"),
        ("Ganho", 4, "won"),
        ("Perdido", 5, "lost"),
    ):
        db.add(Stage(pipeline_id=p.id, name=name, sort_order=order, stage_type=stype))
    db.add(LossReason(pipeline_id=p.id, name="Preço", sort_order=1))
    db.add(LossReason(pipeline_id=p.id, name="Concorrência", sort_order=2))
    db.add(LossReason(pipeline_id=None, name="Outro", sort_order=99))
    db.commit()
