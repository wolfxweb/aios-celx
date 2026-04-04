from pydantic import BaseModel, EmailStr, Field


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    rememberMe: bool | None = None


class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None = None
    is_active: bool
    is_admin: bool = False
    theme_preference: str
    sidebar_collapsed_default: bool

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    theme_preference: str | None = None
    sidebar_collapsed_default: bool | None = None


class LoginResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int
    user: UserPublic
