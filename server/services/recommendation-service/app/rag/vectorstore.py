from langchain_postgres import PGVector
from app.rag.embeddings import get_embeddings
from app.core.config import COLLECTION_NAME, DATABASE_URI


def get_vector_store():
    return PGVector(
        embeddings=get_embeddings(),
        collection_name=COLLECTION_NAME,
        connection=DATABASE_URI,
        use_jsonb=True,
    )
