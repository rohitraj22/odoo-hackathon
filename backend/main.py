from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import time

import models, schemas, auth
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AssetFlow API")

# Allow frontend SPA to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- AUTHENTICATION ROUTES ---

@app.post("/signup", response_model=schemas.EmployeeResponse)
def create_user(user: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.Employee).filter(models.Employee.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique ID (similar to your frontend logic)
    emp_id = f"EMP-{int(time.time())}"
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.Employee(
        id=emp_id,
        name=user.name,
        email=user.email,
        hashed_password=hashed_pw,
        department_id=user.department_id,
        role="Employee" # Default role on signup
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm expects 'username', but we map it to our 'email' field
    user = db.query(models.Employee).filter(models.Employee.email == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}