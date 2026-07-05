from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    anthropic_api_key: str
    frontend_url: str = "http://localhost:5173"
    api_secret_key: str = "dev-secret"

    class Config:
        env_file = ".env"

settings = Settings()
