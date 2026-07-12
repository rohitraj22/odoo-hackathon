from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

# --- Auth & Employees ---
class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    department_id: str
    password: str

class EmployeeResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    department_id: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Assets ---
class AssetCreate(BaseModel):
    name: str
    category_id: str
    serial_number: str
    location: str
    acquisition_date: Optional[str] = None
    acquisition_cost: Optional[int] = 0
    is_shared: Optional[bool] = False
    custom_data: Optional[Dict[str, Any]] = {}

class AssetResponse(BaseModel):
    id: str
    name: str
    category_id: str
    serial_number: str
    location: str
    status: str
    condition: str
    is_shared: bool
    current_holder_id: Optional[str] = None
    custom_data: dict

    class Config:
        from_attributes = True

# --- Allocations ---
class AllocationCreate(BaseModel):
    asset_id: str
    employee_id: str
    department_id: Optional[str] = None
    expected_return_date: Optional[str] = None
    condition: Optional[str] = "Good"

class AllocationResponse(BaseModel):
    id: str
    asset_id: str
    employee_id: str
    allocation_date: str
    expected_return_date: Optional[str] = None
    actual_return_date: Optional[str] = None
    status: str

    class Config:
        from_attributes = True