from pydantic import BaseModel, EmailStr, Field


class PublicContactBody(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    company: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=64)
    message: str = Field(min_length=1, max_length=4000)
    consent: bool = Field(description="Consentimento explícito para contacto")
