import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.rag import RAGSearchRequest, RAGSearchResponse, SyncResponse
from app.services.rag_service import search_products
from app.services.product_service import product_service_client
from app.services.embedding_service import upsert_product_embeddings_batch
from shared.dependencies import get_current_user, TokenData

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/search", response_model=RAGSearchResponse)
async def search_rag_products(
    request: RAGSearchRequest,
    db: Session = Depends(get_db)
):
    """Execute vector similarity search across product embeddings."""
    try:
        results = search_products(db=db, query=request.query, top_k=request.top_k)
        return {
            "query": request.query,
            "results": results
        }
    except Exception as e:
        logger.error(f"Error executing RAG product search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform RAG search: {str(e)}"
        )


@router.post("/sync", response_model=SyncResponse)
async def sync_all_products_endpoint(
    request: Request,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """Synchronize all product embeddings from Product Service (triggered by Admin button)."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required to trigger full RAG synchronization"
        )

    try:
        logger.info(f"Received admin sync request from {current_user.email} (user_id: {current_user.user_id})")
        auth_header = request.headers.get("Authorization")
        products = await product_service_client.sync_all_products(auth_header=auth_header)

        synced_count = upsert_product_embeddings_batch(db, products)

        return {
            "message": "Product embeddings synchronized successfully",
            "total_synced": synced_count
        }
    except Exception as e:
        logger.error(f"Error during RAG product sync: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to synchronize products: {str(e)}"
        )