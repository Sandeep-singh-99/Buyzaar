from typing import List, Dict, Any
from pydantic import BaseModel, Field


class RAGSearchRequest(BaseModel):
    query: str = Field(..., description="Product search query string")
    top_k: int = Field(default=5, ge=1, le=50, description="Number of top matches to retrieve")


class RAGSearchResult(BaseModel):
    product_id: str
    content: str
    metadata: Dict[str, Any]
    score: float


class RAGSearchResponse(BaseModel):
    query: str
    results: List[RAGSearchResult]


class SyncResponse(BaseModel):
    message: str
    total_synced: int
