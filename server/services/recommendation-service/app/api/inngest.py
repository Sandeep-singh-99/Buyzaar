from fastapi import APIRouter
import inngest.fast_api

from app.core.inngest import inngest_client

from app.inngest.product_created import product_created_rag
from app.inngest.product_updated import product_updated_rag
from app.inngest.product_deleted import product_deleted_rag
from app.inngest.sync_products import sync_all_products

router = APIRouter()

inngest.fast_api.serve(
    app=router,
    client=inngest_client,
    functions=[
        product_created_rag,
        product_updated_rag,
        product_deleted_rag,
        sync_all_products,
    ],
    serve_path="/api/inngest",
)
