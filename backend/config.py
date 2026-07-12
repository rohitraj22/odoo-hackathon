import os
from dotenv import load_dotenv

# This tells Python to look for the .env file and load it
load_dotenv()

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-secret-key-if-missing")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./assetflow.db")

settings = Settings()