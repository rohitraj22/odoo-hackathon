import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import SessionLocal, engine, get_db


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AssetFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def now_iso() -> str:
    return datetime.now().isoformat()


def ensure_list(value: Optional[Any]) -> List[Any]:
    return value if isinstance(value, list) else []


def serialize_department(item: models.Department) -> Dict[str, Any]:
    return {"id": item.id, "name": item.name, "parent_id": item.parent_id, "head_id": item.head_id, "head_name": item.head_name, "status": item.status}


def serialize_employee(item: models.Employee) -> Dict[str, Any]:
    return {"id": item.id, "name": item.name, "email": item.email, "role": item.role, "department_id": item.department_id, "status": item.status}


def serialize_category(item: models.AssetCategory) -> Dict[str, Any]:
    return {"id": item.id, "name": item.name, "custom_fields": ensure_list(item.custom_fields)}


def serialize_asset(item: models.Asset) -> Dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "category_id": item.category_id,
        "serial_number": item.serial_number,
        "acquisition_date": item.acquisition_date,
        "acquisition_cost": item.acquisition_cost,
        "condition": item.condition,
        "location": item.location,
        "is_shared": item.is_shared,
        "bookable": item.bookable,
        "status": item.status,
        "current_holder_id": item.current_holder_id,
        "current_holder_name": item.current_holder_name,
        "expected_return_date": item.expected_return_date,
        "custom_data": item.custom_data or {},
        "history": ensure_list(item.history),
    }


def serialize_allocation(item: models.Allocation) -> Dict[str, Any]:
    asset = getattr(item, "asset", None)
    employee = getattr(item, "employee", None)
    department = getattr(item, "department", None)
    return {
        "id": item.id,
        "asset_id": item.asset_id,
        "asset_name": getattr(asset, "name", None),
        "employee_id": item.employee_id,
        "holder_name": getattr(employee, "name", None),
        "department_id": item.department_id,
        "department": getattr(department, "name", None),
        "allocation_date": item.allocation_date,
        "expected_return_date": item.expected_return_date,
        "actual_return_date": item.actual_return_date,
        "condition_on_allocation": item.condition_on_allocation,
        "return_notes": item.return_notes,
        "status": item.status,
    }


def serialize_transfer(item: models.TransferRequest) -> Dict[str, Any]:
    return {"id": item.id, "asset_id": item.asset_id, "asset_name": item.asset_name, "from_id": item.from_id, "from_name": item.from_name, "to_id": item.to_id, "to_name": item.to_name, "reason": item.reason, "date": item.date, "status": item.status}


def serialize_booking(item: models.Booking) -> Dict[str, Any]:
    return {"id": item.id, "resource_id": item.resource_id, "asset_name": item.asset_name, "employee_id": item.employee_id, "booked_by_name": item.booked_by_name, "date": item.date, "start_time": item.start_time, "end_time": item.end_time, "notes": item.notes, "status": item.status}


def serialize_maintenance(item: models.MaintenanceTicket) -> Dict[str, Any]:
    return {"id": item.id, "asset_id": item.asset_id, "asset_name": item.asset_name, "issue_description": item.issue_description, "priority": item.priority, "employee_id": item.employee_id, "reported_by_name": item.reported_by_name, "reported_date": item.reported_date, "status": item.status, "technician_id": item.technician_id, "technician_name": item.technician_name, "notes": ensure_list(item.notes), "resolved_date": item.resolved_date}


def serialize_audit(item: models.AuditCycle) -> Dict[str, Any]:
    return {"id": item.id, "name": item.name, "scope_type": item.scope_type, "scope_value": item.scope_value, "auditor_ids": ensure_list(item.auditor_ids), "status": item.status, "created_at": item.created_at, "items": ensure_list(item.items)}


def serialize_log(item: models.LogEntry) -> Dict[str, Any]:
    return {"id": item.id, "timestamp": item.timestamp, "user": item.user, "action": item.action, "details": item.details, "type": item.type}


def serialize_notification(item: models.Notification) -> Dict[str, Any]:
    return {"id": item.id, "title": item.title, "message": item.message, "type": item.type, "read": item.read, "user_id": item.user_id, "created_at": item.created_at}


def seed_data(db: Session) -> None:
    if db.query(models.Department).first() is None:
        db.add_all([
            models.Department(id="dept-admin", name="Administration", parent_id=None, head_id="emp-admin", head_name="System Admin", status="Active"),
            models.Department(id="dept-it", name="IT Services", parent_id="dept-admin", head_id="emp-head", head_name="Raj Patel", status="Active"),
            models.Department(id="dept-ops", name="Operations", parent_id=None, head_id="emp-manager", head_name="Priya Sharma", status="Active"),
            models.Department(id="dept-hr", name="People & Culture", parent_id=None, head_id=None, head_name=None, status="Active"),
        ])
    if db.query(models.Employee).first() is None:
        db.add_all([
            models.Employee(id="emp-admin", name="System Admin", email="admin@assetflow.com", hashed_password=auth.get_password_hash("password"), department_id="dept-admin", role="Admin", status="Active"),
            models.Employee(id="emp-manager", name="Priya Sharma", email="manager@assetflow.com", hashed_password=auth.get_password_hash("password"), department_id="dept-ops", role="Asset Manager", status="Active"),
            models.Employee(id="emp-head", name="Raj Patel", email="head@assetflow.com", hashed_password=auth.get_password_hash("password"), department_id="dept-hr", role="Department Head", status="Active"),
            models.Employee(id="emp-employee", name="John Doe", email="employee@assetflow.com", hashed_password=auth.get_password_hash("password"), department_id="dept-it", role="Employee", status="Active"),
        ])
    if db.query(models.AssetCategory).first() is None:
        db.add_all([
            models.AssetCategory(id="cat-it", name="IT Equipment", custom_fields=[{"name": "Warranty", "type": "number"}]),
            models.AssetCategory(id="cat-furniture", name="Furniture", custom_fields=[{"name": "Material", "type": "text"}]),
            models.AssetCategory(id="cat-facility", name="Facility", custom_fields=[]),
        ])
    if db.query(models.Asset).first() is None:
        db.add_all([
            models.Asset(id="AF-1001", name="MacBook Pro 14", category_id="cat-it", serial_number="MBP-001", acquisition_date="2026-01-12", acquisition_cost=2400, condition="Good", location="HQ - IT Storage", is_shared=False, bookable=False, status="Available", current_holder_id=None, current_holder_name=None, expected_return_date=None, custom_data={}, history=[]),
            models.Asset(id="AF-1002", name="Conference Room Projector", category_id="cat-it", serial_number="PRJ-010", acquisition_date="2026-02-08", acquisition_cost=1200, condition="Good", location="HQ - Meeting Room 2", is_shared=True, bookable=True, status="Available", current_holder_id=None, current_holder_name=None, expected_return_date=None, custom_data={}, history=[]),
            models.Asset(id="AF-1003", name="Ergonomic Desk Chair", category_id="cat-furniture", serial_number="CHR-205", acquisition_date="2025-11-21", acquisition_cost=180, condition="Good", location="HQ - Floor 3", is_shared=False, bookable=False, status="Allocated", current_holder_id="emp-employee", current_holder_name="John Doe", expected_return_date=None, custom_data={}, history=[]),
            models.Asset(id="AF-1004", name="Main Lobby AC Unit", category_id="cat-facility", serial_number="FAC-044", acquisition_date="2025-09-10", acquisition_cost=3200, condition="Needs Service", location="HQ - Lobby", is_shared=False, bookable=False, status="Under Maintenance", current_holder_id=None, current_holder_name=None, expected_return_date=None, custom_data={}, history=[]),
        ])
    if db.query(models.Allocation).first() is None:
        db.add(models.Allocation(id="AL-1001", asset_id="AF-1003", employee_id="emp-employee", department_id="dept-it", allocation_date="2026-06-28", expected_return_date=None, actual_return_date=None, condition_on_allocation="Good", return_notes=None, status="Active"))
    if db.query(models.TransferRequest).first() is None:
        db.add(models.TransferRequest(id="TR-1001", asset_id="AF-1003", asset_name="Ergonomic Desk Chair", from_id="emp-employee", from_name="John Doe", to_id="emp-manager", to_name="Priya Sharma", reason="Temporary reassignment", date="2026-07-08", status="Pending"))
    if db.query(models.Booking).first() is None:
        db.add(models.Booking(id="BK-1001", resource_id="AF-1002", asset_name="Conference Room Projector", employee_id="emp-employee", booked_by_name="John Doe", date="2026-07-18", start_time="10:00", end_time="11:00", notes="Team meeting", status="Upcoming"))
    if db.query(models.MaintenanceTicket).first() is None:
        db.add(models.MaintenanceTicket(id="MT-1001", asset_id="AF-1004", asset_name="Main Lobby AC Unit", issue_description="Cooling output is unstable after routine inspection.", priority="High", employee_id="emp-manager", reported_by_name="Priya Sharma", reported_date="2026-07-10", status="Pending", technician_id=None, technician_name=None, notes=[], resolved_date=None))
    if db.query(models.AuditCycle).first() is None:
        db.add(models.AuditCycle(id="AU-1001", name="Q3 Asset Verification", scope_type="Department", scope_value="dept-it", auditor_ids=["emp-head"], status="Open", created_at="2026-07-01", items=[]))
    if db.query(models.LogEntry).first() is None:
        db.add(models.LogEntry(id="LG-1001", timestamp="2026-07-11T09:00:00.000Z", user="System Admin", action="Seeded workspace", details="Backend seed data initialized.", type="info"))
    if db.query(models.Notification).first() is None:
        db.add(models.Notification(id="NT-1001", title="Welcome", message="Your local AssetFlow workspace is ready.", type="info", read=False, user_id=None, created_at="2026-07-11T09:00:00.000Z"))
    db.commit()


seed_db = SessionLocal()
try:
    seed_data(seed_db)
finally:
    seed_db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/login", response_model=schemas.LoginResponse)
def login_json(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Employee).filter(models.Employee.email == req.email).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    token = auth.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": token, "token_type": "bearer", "user": serialize_employee(user)}


@app.post("/login", response_model=schemas.LoginResponse)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return login_json(schemas.LoginRequest(email=form_data.username, password=form_data.password), db)


@app.post("/api/signup", response_model=schemas.EmployeeResponse)
def signup_json(user: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(models.Employee).filter(models.Employee.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    emp_id = f"EMP-{int(time.time())}"
    new_user = models.Employee(id=emp_id, name=user.name, email=user.email, hashed_password=auth.get_password_hash(user.password), department_id=user.department_id, role="Employee", status="Active")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return serialize_employee(new_user)


@app.post("/signup", response_model=schemas.EmployeeResponse)
def signup_alias(user: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    return signup_json(user, db)


@app.post("/api/reset-password")
def reset_password(payload: Dict[str, str], db: Session = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    new_password = payload.get("password", "")
    if not email or not new_password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    user = db.query(models.Employee).filter(models.Employee.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = auth.get_password_hash(new_password)
    db.commit()
    return {"success": True}


@app.get("/api/departments")
def get_departments(db: Session = Depends(get_db)):
    return [serialize_department(item) for item in db.query(models.Department).all()]


@app.put("/api/departments")
def save_departments(items: List[schemas.DepartmentUpsert], db: Session = Depends(get_db)):
    db.query(models.Department).delete()
    db.flush()
    for item in items:
        db.add(models.Department(**item.model_dump()))
    db.commit()
    return {"success": True}


@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    return [serialize_category(item) for item in db.query(models.AssetCategory).all()]


@app.put("/api/categories")
def save_categories(items: List[schemas.AssetCategoryUpsert], db: Session = Depends(get_db)):
    db.query(models.AssetCategory).delete()
    db.flush()
    for item in items:
        db.add(models.AssetCategory(**item.model_dump()))
    db.commit()
    return {"success": True}


@app.get("/api/employees")
def get_employees(db: Session = Depends(get_db)):
    return [serialize_employee(item) for item in db.query(models.Employee).all()]


@app.put("/api/employees")
def save_employees(items: List[schemas.EmployeeUpsert], db: Session = Depends(get_db)):
    db.query(models.Employee).delete()
    db.flush()
    for item in items:
        data = item.model_dump()
        password = data.pop("password", None) or "password"
        db.add(models.Employee(**data, hashed_password=auth.get_password_hash(password)))
    db.commit()
    return {"success": True}


@app.get("/api/assets")
def get_assets(db: Session = Depends(get_db)):
    return [serialize_asset(item) for item in db.query(models.Asset).all()]


@app.post("/api/assets", response_model=schemas.AssetResponse)
def create_asset(req: schemas.AssetCreate, db: Session = Depends(get_db)):
    asset_id = f"AF-{int(time.time())}"
    asset = models.Asset(id=asset_id, name=req.name, category_id=req.category_id, serial_number=req.serial_number, acquisition_date=req.acquisition_date, acquisition_cost=req.acquisition_cost or 0, condition="Good", location=req.location, is_shared=bool(req.is_shared), bookable=bool(req.bookable), status="Available", custom_data=req.custom_data or {}, history=[])
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return serialize_asset(asset)


@app.put("/api/assets")
def save_assets(items: List[schemas.AssetUpsert], db: Session = Depends(get_db)):
    db.query(models.Asset).delete()
    db.flush()
    for item in items:
        db.add(models.Asset(**item.model_dump()))
    db.commit()
    return {"success": True}


@app.get("/api/allocations")
def get_allocations(db: Session = Depends(get_db)):
    return [serialize_allocation(item) for item in db.query(models.Allocation).all()]


@app.put("/api/allocations")
def save_allocations(items: List[schemas.AllocationUpsert], db: Session = Depends(get_db)):
    db.query(models.Allocation).delete()
    db.flush()
    for item in items:
        db.add(models.Allocation(**item.model_dump(exclude_none=True)))
    db.commit()
    return {"success": True}


@app.post("/api/allocations/allocate")
def allocate_asset(req: schemas.AllocationCreate, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.status != "Available":
        holder_name = asset.current_holder_name or "another employee"
        if asset.current_holder_id and not asset.current_holder_name:
            holder = db.query(models.Employee).filter(models.Employee.id == asset.current_holder_id).first()
            if holder:
                holder_name = holder.name
        raise HTTPException(status_code=409, detail=f"Already Allocated to {holder_name}.")
    employee = db.query(models.Employee).filter(models.Employee.id == req.employee_id).first()
    alloc_id = f"AL-{int(time.time())}"
    db.add(models.Allocation(id=alloc_id, asset_id=req.asset_id, employee_id=req.employee_id, department_id=req.department_id, allocation_date=today(), expected_return_date=req.expected_return_date, condition_on_allocation=req.condition, status="Active"))
    asset.status = "Allocated"
    asset.current_holder_id = req.employee_id
    asset.current_holder_name = employee.name if employee else req.employee_id
    asset.expected_return_date = req.expected_return_date
    asset.history = ensure_list(asset.history) + [{"date": today(), "action": "Allocation", "user": employee.name if employee else req.employee_id, "details": f"Allocated to {asset.current_holder_name}"}]
    db.commit()
    return {"success": True, "message": "Asset allocated successfully", "allocation_id": alloc_id}


@app.post("/api/allocations/return")
def return_asset(payload: Dict[str, Any], db: Session = Depends(get_db)):
    asset_id = payload.get("asset_id")
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    active = db.query(models.Allocation).filter(models.Allocation.asset_id == asset_id, models.Allocation.status == "Active").first()
    if not active:
        raise HTTPException(status_code=404, detail="Active allocation not found")
    asset.status = "Available"
    asset.current_holder_id = None
    asset.current_holder_name = None
    asset.expected_return_date = None
    asset.history = ensure_list(asset.history) + [{"date": today(), "action": "Return", "user": payload.get("action_user", "System"), "details": payload.get("notes", "Returned")}]
    active.status = "Returned"
    active.actual_return_date = today()
    active.return_notes = payload.get("notes")
    db.commit()
    return {"success": True}


@app.get("/api/transfers")
def get_transfers(db: Session = Depends(get_db)):
    return [serialize_transfer(item) for item in db.query(models.TransferRequest).all()]


@app.put("/api/transfers")
def save_transfers(items: List[schemas.TransferUpsert], db: Session = Depends(get_db)):
    db.query(models.TransferRequest).delete()
    db.flush()
    for item in items:
        db.add(models.TransferRequest(**item.model_dump(exclude_none=True)))
    db.commit()
    return {"success": True}


@app.post("/api/transfers/request")
def request_transfer(payload: Dict[str, Any], db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == payload.get("asset_id")).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    target = db.query(models.Employee).filter(models.Employee.id == payload.get("target_employee_id")).first()
    current_holder = db.query(models.Employee).filter(models.Employee.id == asset.current_holder_id).first() if asset.current_holder_id else None
    tr_id = f"TR-{int(time.time())}"
    db.add(models.TransferRequest(id=tr_id, asset_id=asset.id, asset_name=asset.name, from_id=asset.current_holder_id, from_name=current_holder.name if current_holder else asset.current_holder_name, to_id=target.id if target else payload.get("target_employee_id"), to_name=target.name if target else payload.get("target_employee_id"), reason=payload.get("reason") or payload.get("notes"), date=today(), status="Pending"))
    db.commit()
    return {"success": True, "transfer_id": tr_id}


@app.post("/api/transfers/{transfer_id}/approve")
def approve_transfer(transfer_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    transfer = db.query(models.TransferRequest).filter(models.TransferRequest.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    asset = db.query(models.Asset).filter(models.Asset.id == transfer.asset_id).first()
    target = db.query(models.Employee).filter(models.Employee.id == transfer.to_id).first()
    if asset:
        asset.current_holder_id = transfer.to_id
        asset.current_holder_name = target.name if target else transfer.to_name
        asset.status = "Allocated"
        asset.history = ensure_list(asset.history) + [{"date": today(), "action": "Transfer Approved", "user": payload.get("action_user", "System"), "details": f"Transferred to {asset.current_holder_name}"}]
    transfer.status = "Approved"
    db.commit()
    return {"success": True}


@app.post("/api/transfers/{transfer_id}/reject")
def reject_transfer(transfer_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    transfer = db.query(models.TransferRequest).filter(models.TransferRequest.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    transfer.status = "Rejected"
    db.commit()
    return {"success": True}


@app.get("/api/bookings")
def get_bookings(db: Session = Depends(get_db)):
    return [serialize_booking(item) for item in db.query(models.Booking).all()]


@app.put("/api/bookings")
def save_bookings(items: List[schemas.BookingUpsert], db: Session = Depends(get_db)):
    db.query(models.Booking).delete()
    db.flush()
    for item in items:
        db.add(models.Booking(**item.model_dump(exclude_none=True)))
    db.commit()
    return {"success": True}


@app.post("/api/bookings")
def create_booking(payload: Dict[str, Any], db: Session = Depends(get_db)):
    resource_id = payload.get("resource_id")
    date = payload.get("date")
    start_time = payload.get("start_time")
    end_time = payload.get("end_time")
    conflicts = db.query(models.Booking).filter(models.Booking.resource_id == resource_id, models.Booking.date == date, models.Booking.status != "Cancelled").all()
    for booking in conflicts:
        if start_time < booking.end_time and end_time > booking.start_time:
            raise HTTPException(status_code=409, detail="Time slot overlaps with an existing booking")
    asset = db.query(models.Asset).filter(models.Asset.id == resource_id).first()
    employee = db.query(models.Employee).filter(models.Employee.id == payload.get("employee_id")).first()
    bk_id = f"BK-{int(time.time())}"
    db.add(models.Booking(id=bk_id, resource_id=resource_id, asset_name=asset.name if asset else resource_id, employee_id=payload.get("employee_id"), booked_by_name=employee.name if employee else payload.get("employee_id"), date=date, start_time=start_time, end_time=end_time, notes=payload.get("notes"), status="Upcoming"))
    db.commit()
    return {"success": True, "booking_id": bk_id}


@app.post("/api/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "Cancelled"
    db.commit()
    return {"success": True}


@app.get("/api/maintenance")
def get_maintenance(db: Session = Depends(get_db)):
    return [serialize_maintenance(item) for item in db.query(models.MaintenanceTicket).all()]


@app.put("/api/maintenance")
def save_maintenance(items: List[schemas.MaintenanceUpsert], db: Session = Depends(get_db)):
    db.query(models.MaintenanceTicket).delete()
    db.flush()
    for item in items:
        db.add(models.MaintenanceTicket(**item.model_dump(exclude_none=True)))
    db.commit()
    return {"success": True}


@app.post("/api/maintenance")
def create_maintenance(payload: Dict[str, Any], db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == payload.get("asset_id")).first()
    employee = db.query(models.Employee).filter(models.Employee.id == payload.get("employee_id")).first()
    mt_id = f"MT-{int(time.time())}"
    db.add(models.MaintenanceTicket(id=mt_id, asset_id=payload.get("asset_id"), asset_name=asset.name if asset else payload.get("asset_id"), issue_description=payload.get("issue_description", ""), priority=payload.get("priority", "Medium"), employee_id=payload.get("employee_id"), reported_by_name=employee.name if employee else payload.get("employee_id"), reported_date=today(), status="Pending", technician_id=None, technician_name=None, notes=[], resolved_date=None))
    if asset:
        asset.history = ensure_list(asset.history) + [{"date": today(), "action": "Maintenance Requested", "user": employee.name if employee else payload.get("employee_id"), "details": payload.get("issue_description", "")}]
    db.commit()
    return {"success": True, "maintenance_id": mt_id}


@app.put("/api/maintenance/{maintenance_id}")
def update_maintenance(maintenance_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    ticket = db.query(models.MaintenanceTicket).filter(models.MaintenanceTicket.id == maintenance_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Maintenance ticket not found")
    new_status = payload.get("status", ticket.status)
    ticket.status = new_status
    ticket.technician_name = payload.get("technician", ticket.technician_name)
    if payload.get("notes"):
        ticket.notes = ensure_list(ticket.notes) + [{"date": today(), "user": payload.get("action_user", "System"), "text": payload.get("notes")}]
    asset = db.query(models.Asset).filter(models.Asset.id == ticket.asset_id).first()
    if asset and new_status == "Approved":
        asset.status = "Under Maintenance"
        asset.history = ensure_list(asset.history) + [{"date": today(), "action": "Maintenance Approved", "user": payload.get("action_user", "System"), "details": payload.get("notes", "Approved for repair")}]
    if ticket.status == "Resolved":
        ticket.resolved_date = today()
        if asset:
            asset.status = "Available"
            asset.history = ensure_list(asset.history) + [{"date": today(), "action": "Maintenance Resolved", "user": payload.get("action_user", "System"), "details": payload.get("notes", "Resolved")}]
    db.commit()
    return {"success": True}


@app.get("/api/audits")
def get_audits(db: Session = Depends(get_db)):
    return [serialize_audit(item) for item in db.query(models.AuditCycle).all()]


@app.put("/api/audits")
def save_audits(items: List[schemas.AuditUpsert], db: Session = Depends(get_db)):
    db.query(models.AuditCycle).delete()
    db.flush()
    for item in items:
        db.add(models.AuditCycle(**item.model_dump(exclude_none=True)))
    db.commit()
    return {"success": True}


@app.post("/api/audits")
def create_audit(payload: Dict[str, Any], db: Session = Depends(get_db)):
    audit_id = f"AU-{int(time.time())}"
    db.add(models.AuditCycle(id=audit_id, name=payload.get("name", "Audit Cycle"), scope_type=payload.get("scope_type", "All"), scope_value=payload.get("scope_value", ""), auditor_ids=ensure_list(payload.get("auditor_ids")), status="Open", created_at=today(), items=[]))
    db.commit()
    return {"success": True, "audit_id": audit_id}


@app.put("/api/audits/{audit_id}/items/{asset_id}")
def update_audit_item(audit_id: str, asset_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    audit = db.query(models.AuditCycle).filter(models.AuditCycle.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    items = ensure_list(audit.items)
    existing = next((item for item in items if item.get("assetId") == asset_id), None)
    if existing:
        existing["status"] = payload.get("status", existing.get("status"))
        existing["notes"] = payload.get("notes", existing.get("notes"))
    else:
        items.append({"assetId": asset_id, "status": payload.get("status", "Open"), "notes": payload.get("notes")})
    audit.items = items
    db.commit()
    return {"success": True}


@app.post("/api/audits/{audit_id}/close")
def close_audit(audit_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    audit = db.query(models.AuditCycle).filter(models.AuditCycle.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    audit.status = "Closed"
    db.commit()
    return {"success": True}


@app.get("/api/logs")
def get_logs(db: Session = Depends(get_db)):
    return [serialize_log(item) for item in db.query(models.LogEntry).all()]


@app.post("/api/logs")
def create_log(payload: Dict[str, Any], db: Session = Depends(get_db)):
    log_id = f"LG-{int(time.time())}"
    db.add(models.LogEntry(id=log_id, timestamp=now_iso(), user=payload.get("user", "System"), action=payload.get("action", ""), details=payload.get("details", ""), type=payload.get("type", "info")))
    db.commit()
    return {"success": True, "log_id": log_id}


@app.put("/api/logs")
def save_logs(items: List[schemas.LogUpsert], db: Session = Depends(get_db)):
    db.query(models.LogEntry).delete()
    db.flush()
    for item in items:
        db.add(models.LogEntry(**item.model_dump()))
    db.commit()
    return {"success": True}


@app.get("/api/notifications")
def get_notifications(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    items = [serialize_notification(item) for item in db.query(models.Notification).all()]
    if user_id:
        items = [item for item in items if item["user_id"] in (None, user_id)]
    return items


@app.post("/api/notifications")
def create_notification(payload: Dict[str, Any], db: Session = Depends(get_db)):
    notification_id = f"NT-{int(time.time())}"
    db.add(models.Notification(id=notification_id, title=payload.get("title", "Notification"), message=payload.get("message", ""), type=payload.get("type", "info"), read=bool(payload.get("read", False)), user_id=payload.get("user_id"), created_at=now_iso()))
    db.commit()
    return {"success": True, "notification_id": notification_id}


@app.put("/api/notifications")
def save_notifications(items: List[schemas.NotificationUpsert], db: Session = Depends(get_db)):
    db.query(models.Notification).delete()
    db.flush()
    for item in items:
        db.add(models.Notification(**item.model_dump()))
    db.commit()
    return {"success": True}