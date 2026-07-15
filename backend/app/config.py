from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    frontend_base_url: str = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./intakeforge.db")
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    stripe_pro_price_id: str = os.getenv("STRIPE_PRO_PRICE_ID", "")
    free_forms_per_month: int = int(os.getenv("FREE_FORMS_PER_MONTH", "999"))
    free_max_depth: int = 5


settings = Settings()
