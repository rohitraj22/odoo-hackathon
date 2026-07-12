from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, JSON
from database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    parent_id = Column(String, nullable=True)
    head_id = Column(String, nullable=True) # Employee ID
    head_name = Column(String, nullable=True)
    status = Column(String, default="Active")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    role = Column(String, default="Employee")
    status = Column(String, default="Active")

class AssetCategory(Base):
    __tablename__ = "asset_categories"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    custom_fields = Column(JSON, default=list) # e.g., [{"name": "Warranty", "type": "number"}]

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True) # e.g., AF-0114
    name = Column(String, index=True)
    category_id = Column(String, ForeignKey("asset_categories.id"))
    serial_number = Column(String, unique=True, index=True)
    acquisition_date = Column(String)
    acquisition_cost = Column(Integer, default=0)
    condition = Column(String, default="Good")
    location = Column(String)
    is_shared = Column(Boolean, default=False)
    bookable = Column(Boolean, default=False)
    
    # State tracking
    status = Column(String, default="Available") # Available, Allocated, Under Maintenance, Lost
    current_holder_id = Column(String, ForeignKey("employees.id"), nullable=True)
    current_holder_name = Column(String, nullable=True)
    expected_return_date = Column(String, nullable=True)
    
    # Flexible metadata based on category
    custom_data = Column(JSON, default=dict) 
    history = Column(JSON, default=list)

class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(String, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"))
    employee_id = Column(String, ForeignKey("employees.id"))
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    
    allocation_date = Column(String)
    expected_return_date = Column(String, nullable=True)
    actual_return_date = Column(String, nullable=True)
    
    condition_on_allocation = Column(String, default="Good")
    return_notes = Column(String, nullable=True)
    status = Column(String, default="Active") # Active, Returned, Transferred, Revoked


class TransferRequest(Base):
    __tablename__ = "transfers"

    id = Column(String, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"))
    asset_name = Column(String)
    from_id = Column(String, ForeignKey("employees.id"), nullable=True)
    from_name = Column(String, nullable=True)
    to_id = Column(String, ForeignKey("employees.id"), nullable=True)
    to_name = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    date = Column(String, nullable=True)
    status = Column(String, default="Pending")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, index=True)
    resource_id = Column(String, ForeignKey("assets.id"))
    asset_name = Column(String)
    employee_id = Column(String, ForeignKey("employees.id"))
    booked_by_name = Column(String)
    date = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    notes = Column(String, nullable=True)
    status = Column(String, default="Upcoming")


class MaintenanceTicket(Base):
    __tablename__ = "maintenance"

    id = Column(String, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"))
    asset_name = Column(String)
    issue_description = Column(String)
    priority = Column(String, default="Medium")
    employee_id = Column(String, ForeignKey("employees.id"), nullable=True)
    reported_by_name = Column(String, nullable=True)
    reported_date = Column(String, nullable=True)
    status = Column(String, default="Pending")
    technician_id = Column(String, ForeignKey("employees.id"), nullable=True)
    technician_name = Column(String, nullable=True)
    notes = Column(JSON, default=list)
    resolved_date = Column(String, nullable=True)


class AuditCycle(Base):
    __tablename__ = "audits"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    scope_type = Column(String)
    scope_value = Column(String)
    auditor_ids = Column(JSON, default=list)
    status = Column(String, default="Open")
    created_at = Column(String, nullable=True)
    items = Column(JSON, default=list)


class LogEntry(Base):
    __tablename__ = "logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(String)
    user = Column(String)
    action = Column(String)
    details = Column(String)
    type = Column(String, default="info")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    message = Column(String)
    type = Column(String, default="info")
    read = Column(Boolean, default=False)
    user_id = Column(String, ForeignKey("employees.id"), nullable=True)
    created_at = Column(String, nullable=True)