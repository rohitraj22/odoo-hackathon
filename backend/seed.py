# backend/seed.py
from database import SessionLocal
import models, auth
import time

def seed_db():
    db = SessionLocal()
    
    # 1. Create Default Departments
    dept_eng = models.Department(id="D-001", name="Engineering", status="Active")
    db.add(dept_eng)
    
    # 2. Create Default Users
    admin_pw = auth.get_password_hash("password")
    admin = models.Employee(id="EMP-001", name="System Admin", email="admin@assetflow.com", hashed_password=admin_pw, role="Admin")
    
    manager_pw = auth.get_password_hash("password")
    manager = models.Employee(id="EMP-002", name="Priya Shah", email="manager@assetflow.com", department_id="D-001", hashed_password=manager_pw, role="Asset Manager")
    
    employee_pw = auth.get_password_hash("password")
    employee = models.Employee(id="EMP-005", name="John Doe", email="employee@assetflow.com", department_id="D-001", hashed_password=employee_pw, role="Employee")
    
    db.add_all([admin, manager, employee])
    
    # 3. Create Asset Categories
    cat_elec = models.AssetCategory(id="CAT-001", name="Electronics", custom_fields=[{"name": "Brand", "type": "text"}])
    db.add(cat_elec)
    
    # 4. Create Assets
    laptop = models.Asset(
        id="AF-0114", name="Dell laptop", category_id="CAT-001", serial_number="DL-0114", 
        acquisition_date="2025-01-10", condition="Good", location="Bengaluru", 
        status="Available", custom_data={"Brand": "Dell"}
    )
    room = models.Asset(
        id="AF-0003", name="Conference Room B2", category_id="CAT-001", serial_number="ROOM-B2", 
        condition="Excellent", location="Bengaluru", status="Available", is_shared=True
    )
    db.add_all([laptop, room])
    
    db.commit()
    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_db()