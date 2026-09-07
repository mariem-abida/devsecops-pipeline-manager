from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from models.schemas import ProjectCreate, ProjectResponse
from models.models import ProjectModel

router = APIRouter()


@router.get("/", response_model=list[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(ProjectModel).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    new_project = ProjectModel(
        name=project.name,
        repository_url=project.repository_url,
        branch=project.branch,
        language=project.language,
        visibility=project.visibility,
        access_method=project.access_method,
        credential_id=project.credential_id,
        description=project.description,
        last_pipeline_status="NOT_STARTED"
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }