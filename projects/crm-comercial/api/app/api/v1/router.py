from fastapi import APIRouter

from app.api.v1.endpoints import (
    activities,
    auth,
    companies,
    contacts,
    dashboard,
    leads,
    loss_reasons,
    me,
    opportunities,
    pipelines,
    public_contact,
    reports,
    search,
    stages,
    tags,
    tasks,
    users_admin,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(public_contact.router)
api_router.include_router(users_admin.router)
api_router.include_router(reports.router)
api_router.include_router(dashboard.router)
api_router.include_router(pipelines.router)
api_router.include_router(stages.router)
api_router.include_router(companies.router)
api_router.include_router(contacts.router)
api_router.include_router(leads.router)
api_router.include_router(opportunities.router)
api_router.include_router(loss_reasons.router)
api_router.include_router(search.router)
api_router.include_router(tags.router)
api_router.include_router(tasks.router)
api_router.include_router(activities.router)
