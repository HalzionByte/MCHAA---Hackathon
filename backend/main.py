from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from api.endpoints import router
from models import *  # Import all models to ensure they're registered with Base

# Create all tables
Base.metadata.create_all(bind=engine)

def seed_initial_data():
    db = SessionLocal()
    try:
        if not db.query(Farm).filter(Farm.farm_id == "farm-001").first():
            farm = Farm(
                farm_id="farm-001",
                name="Sindh Agricultural Farm",
                location="Karachi, Pakistan",
                area_hectares=200.00
            )
            db.add(farm)
            
            field1 = Field(
                field_id="field-001",
                farm_id="farm-001",
                name="Field B",
                crop_type="wheat",
                boundary_lat=31.5204,
                boundary_lng=74.3587,
                area_hectares=50.00
            )
            field2 = Field(
                field_id="field-002",
                farm_id="farm-001",
                name="Field C",
                crop_type="rice",
                boundary_lat=31.5200,
                boundary_lng=74.3600,
                area_hectares=75.00
            )
            db.add(field1)
            db.add(field2)
            db.commit()
    except Exception as e:
        print(f"Initial seeding note: {e}")
        db.rollback()
    finally:
        db.close()

seed_initial_data()


app = FastAPI(
    title="Crop Health Agent API",
    description="Multimodal crop anomaly detection and diagnosis",
    version="1.0.0"
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Invalid request parameters") if errors else "Invalid request parameters"
    if "Value error, " in msg:
        msg = msg.replace("Value error, ", "")
    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "message": msg
        }
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
