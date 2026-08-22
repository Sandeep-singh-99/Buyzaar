import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URI = os.getenv(
    "DATABASE_URL_RECOMMENDATION_SERVICE"
) or os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/buyzaar_recommendation_db"
)

REDIS_HOST = os.getenv("REDIS_HOST") or os.getenv("REDIS_SERVER") or "redis"
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_URL = os.getenv("REDIS_URL") or f"redis://{REDIS_HOST}:{REDIS_PORT}/0"

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8002").rstrip("/")
PRODUCT_SERVICE_INTERNAL_TOKEN = os.getenv("PRODUCT_SERVICE_INTERNAL_TOKEN", "")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "")

INNGEST_DEV = os.getenv("INNGEST_DEV", "1") == "1"
INNGEST_SIGNING_KEY = os.getenv("INNGEST_SIGNING_KEY", None)

CACHE_TTL_SHORT = 300       # 5 minutes
CACHE_TTL_LONG = 3600      # 1 hour
