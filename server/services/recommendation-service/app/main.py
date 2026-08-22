import os
import sys

# Ensure server root is in sys.path so 'shared' module can be imported cleanly
app_dir = os.path.dirname(os.path.abspath(__file__))
service_dir = os.path.dirname(app_dir)
services_dir = os.path.dirname(service_dir)
server_dir = os.path.dirname(services_dir)

for path in [server_dir, services_dir, service_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.inngest import router as inngest_router
from app.api.rag import router as rag_router
from app.api.chat import router as chat_router

app = FastAPI(
    title="Buyzaar Recommendation Service API",
    docs_url="/api/recommendation/docs",
    redoc_url="/api/recommendation/redoc",
    openapi_url="/api/recommendation/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inngest_router)
app.include_router(rag_router, prefix="/api/rag", tags=["RAG"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])


@app.get("/")
async def read_root():
    return {"message": "Buyzaar Recommendation Service API"}


@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "service": "recommendation-service"
    }