import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.route.payment_route import router as payment_router, webhook_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Payment Service API",
    description="Microservice managing Cashfree payments, webhooks, and status queries",
    version="1.0.0",
    docs_url="/payments/docs",
    redoc_url="/payments/redoc",
    openapi_url="/payments/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payment_router)
app.include_router(webhook_router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "payment-service"}


@app.get("/")
def root():
    return {"service": "Payment Service API", "status": "running"}
