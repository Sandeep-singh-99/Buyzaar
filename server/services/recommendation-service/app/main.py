from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Recommendation Service API",
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


@app.get("/")
async def read_root():
    return {"Hello": "world"}

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}