from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from api.endpoints import router
from models import *  # Import all models to ensure they're registered with Base

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Crop Health Agent API",
    description="Multimodal crop anomaly detection and diagnosis",
    version="1.0.0"
)

# CORS middleware - allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)

@app.get("/")
async def root():
    return {
        "message": "Crop Health Agent API is running",
        "version": "1.0.0",
        "docs": "http://localhost:8000/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
