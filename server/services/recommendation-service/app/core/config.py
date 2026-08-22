from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URI = os.getenv("DATABASE_URL_RECOMMENDATION_SERVICE")

COLLECTION_NAME = "ai_recommendation_rag"