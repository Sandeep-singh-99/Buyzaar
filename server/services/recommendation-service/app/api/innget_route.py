from fastapi import APIRouter
from app.core.inngest import inngest_client
import inngest.fast_api

router = APIRouter()

inngest.fast_api.serve(
    app=router,
    client=inngest_client,
    functions=[

    ],
    serve_path="/api/inngest",
)