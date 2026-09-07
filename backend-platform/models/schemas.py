from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    repository_url: str
    branch: str = "main"
    language: str
    visibility: str
    access_method: str
    credential_id: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(ProjectCreate):
    id: int
    last_pipeline_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PipelineRunRequest(BaseModel):
    git_url: Optional[str] = None
    project_id: Optional[int] = None
    branch: str = "main"
    language: str = "auto"
    environment: Optional[str] = None
    deploy_env: str = "test"
    # Granular stage toggles — mapped to Jenkins params
    run_tests: bool = True
    run_quality: bool = True
    run_security: bool = True
    run_ai: bool = True
    dependency_audit: bool = True
    secret_detection: bool = True
    run_sast: bool = True
    run_docker_build: bool = True
    run_container_scan: bool = True
    run_sbom: bool = True
    generate_ai_suggestions: bool = True
    deploy_if_validated: bool = False
    push_image: bool = True
    sign_image: bool = True


class PipelineResponse(BaseModel):
    id: int
    project_id: int
    build_number: str
    status: str
    progress: int
    current_stage: str
    duration: str
    environment: str
    created_at: datetime

    class Config:
        from_attributes = True
