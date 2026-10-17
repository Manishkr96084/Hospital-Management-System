import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Medivanta AI Hospital Management"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medivanta-super-secret-luxury-hospital-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medivanta.db")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    HOSPITAL_NAME: str = "Medivanta Luxury Medical Institute & Research Centre"
    HOSPITAL_ADDRESS: str = "108 Healthway Boulevard, Medical City, MC 94016"
    HOSPITAL_PHONE: str = "+1 (800) 555-MEDI / +1 (800) 555-8268"
    HOSPITAL_EMAIL: str = "concierge@medivanta.health"
    HOSPITAL_WEBSITE: str = "https://medivanta.health"
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
