import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from database.db import check_database_connection, init_db
from routes.project_routes import router as project_router
from routes.pipeline_routes import router as pipeline_router
from routes.report_routes import router as report_router
from routes.recommendation_routes import router as recommendation_router
from routes.sbom_compliance_routes import router as sbom_compliance_router

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting DevSecOps Pipeline Manager API.")
    init_db()
    yield


app = FastAPI(
    title="DevSecOps Pipeline Manager API",
    description="Backend API for managing GitLab projects and Jenkins DevSecOps pipelines",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(project_router, prefix="/projects", tags=["Projects"])
app.include_router(pipeline_router, prefix="/pipelines", tags=["Pipelines"])
app.include_router(report_router, prefix="/reports", tags=["Reports"])
app.include_router(recommendation_router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(sbom_compliance_router, prefix="/reports", tags=["SBOM & Compliance"])


@app.get("/")
def root():
    return {
        "message": "DevSecOps Pipeline Manager API is running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health(response: Response):
    database_connected, database_error = check_database_connection()

    if database_connected:
        return {
            "backend": "ok",
            "database": "connected",
        }

    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "backend": "ok",
        "database": "error",
        "detail": f"Database health check failed: {database_error}",
    }