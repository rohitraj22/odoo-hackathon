from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

# --- Auth & Employees ---
class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    department_id: Optional[str] = None
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

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: EmployeeResponse

class Token(BaseModel):
    access_token: str
    token_type: str

class EmployeeUpsert(BaseModel):
    id: str
    name: str
    email: EmailStr
    password: Optional[str] = None
    department_id: Optional[str] = None
    role: str = "Employee"
    status: str = "Active"

# --- Assets ---
class AssetCreate(BaseModel):
    name: str
    category_id: str
    serial_number: str
    location: str
    acquisition_date: Optional[str] = None
    acquisition_cost: Optional[int] = 0
    is_shared: Optional[bool] = False
    bookable: Optional[bool] = False
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
    bookable: bool = False
    current_holder_id: Optional[str] = None
    current_holder_name: Optional[str] = None
    expected_return_date: Optional[str] = None
    custom_data: dict
    history: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class AssetUpsert(BaseModel):
    id: str
    name: str
    category_id: str
    serial_number: str
    acquisition_date: Optional[str] = None
    acquisition_cost: Optional[int] = 0
    condition: str = "Good"
    location: str
    is_shared: bool = False
    bookable: bool = False
    status: str = "Available"
    current_holder_id: Optional[str] = None
    current_holder_name: Optional[str] = None
    expected_return_date: Optional[str] = None
    custom_data: Optional[Dict[str, Any]] = {}
    history: Optional[List[Dict[str, Any]]] = []

class DepartmentResponse(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    head_id: Optional[str] = None
    head_name: Optional[str] = None
    status: str = "Active"

    class Config:
        from_attributes = True

class DepartmentUpsert(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    head_id: Optional[str] = None
    head_name: Optional[str] = None
    status: str = "Active"

class AssetCategoryResponse(BaseModel):
    id: str
    name: str
    custom_fields: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class AssetCategoryUpsert(BaseModel):
    id: str
    name: str
    custom_fields: Optional[List[Dict[str, Any]]] = []

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

class AllocationUpsert(BaseModel):
    id: str
    asset_id: str
    asset_name: Optional[str] = None
    employee_id: str
    holder_name: Optional[str] = None
    department_id: Optional[str] = None
    department: Optional[str] = None
    allocation_date: Optional[str] = None
    expected_return_date: Optional[str] = None
    actual_return_date: Optional[str] = None
    condition_on_allocation: Optional[str] = "Good"
    return_notes: Optional[str] = None
    status: Optional[str] = "Active"

class TransferUpsert(BaseModel):
    id: str
    asset_id: str
    asset_name: Optional[str] = None
    from_id: Optional[str] = None
    from_name: Optional[str] = None
    to_id: Optional[str] = None
    to_name: Optional[str] = None
    reason: Optional[str] = None
    date: Optional[str] = None
    status: str = "Pending"

class BookingUpsert(BaseModel):
    id: str
    resource_id: str
    asset_name: Optional[str] = None
    employee_id: str
    booked_by_name: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    notes: Optional[str] = None
    status: str = "Upcoming"

class MaintenanceUpsert(BaseModel):
    id: str
    asset_id: str
    asset_name: Optional[str] = None
    issue_description: str
    priority: str = "Medium"
    employee_id: Optional[str] = None
    reported_by_name: Optional[str] = None
    reported_date: Optional[str] = None
    status: str = "Pending"
    technician_id: Optional[str] = None
    technician_name: Optional[str] = None
    notes: Optional[List[Dict[str, Any]]] = []
    resolved_date: Optional[str] = None

class AuditItem(BaseModel):
    assetId: str
    status: str
    notes: Optional[str] = None

class AuditResponse(BaseModel):
    id: str
    name: str
    scope_type: str
    scope_value: str
    auditor_ids: List[str] = []
    status: str = "Open"
    created_at: Optional[str] = None
    items: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class AuditUpsert(BaseModel):
    id: str
    name: str
    scope_type: str
    scope_value: str
    auditor_ids: Optional[List[str]] = []
    status: str = "Open"
    created_at: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = []

class LogResponse(BaseModel):
    id: str
    timestamp: str
    user: str
    action: str
    details: str
    type: str = "info"

    class Config:
        from_attributes = True

class LogUpsert(BaseModel):
    id: str
    timestamp: str
    user: str
    action: str
    details: str
    type: str = "info"

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str = "info"
    read: bool = False
    user_id: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationUpsert(BaseModel):
    id: str
    title: str
    message: str
    type: str = "info"
    read: bool = False
    user_id: Optional[str] = None
    created_at: Optional[str] = None