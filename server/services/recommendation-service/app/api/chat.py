import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import generate_chat_recommendation

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat_recommendations(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Generate product recommendations and natural language answer using RAG + Groq LLM."""
    try:
        res = await generate_chat_recommendation(db=db, message=request.message)
        return res
    except Exception as e:
        logger.error(f"Error handling chat recommendation request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate chat recommendation: {str(e)}"
        )
