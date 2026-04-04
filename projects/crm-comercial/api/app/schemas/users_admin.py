from pydantic import BaseModel, EmailStr, Field


class UserListItem(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_admin: bool

    model_config = {"from_attributes": True}


class UserCreateAdmin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    is_admin: bool = False


class UserUpdateAdmin(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None
    is_admin: bool | None = None
