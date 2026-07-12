from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, JSON
from database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    parent_id = Column(String, nullable=True)
    head_id = Column(String, nullable=True) # Employee ID
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
    
    # State tracking
    status = Column(String, default="Available") # Available, Allocated, Under Maintenance, Lost
    current_holder_id = Column(String, ForeignKey("employees.id"), nullable=True)
    
    # Flexible metadata based on category
    custom_data = Column(JSON, default=dict) 

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