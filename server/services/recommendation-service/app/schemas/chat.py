from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., description="User question or recommendation prompt")


class RecommendedProduct(BaseModel):
    product_id: str
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    sales_price: Optional[float] = None
    image_url: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    products: List[RecommendedProduct] = []
    is_out_of_scope: bool = False
