from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database.db import SessionLocal, get_db
from models.models import (
    DeploymentResultModel,
    PipelineModel,
    ProjectModel,
    QualityResultModel,
    SecurityResultModel,
    TestResultModel,
)
from models.schemas import PipelineRunRequest, PipelineResponse
from services.jenkins_service import (
    JenkinsConfigError,
    JenkinsTriggerError,
    fetch_jenkins_console_log,
    get_jenkins_build_status,
    get_latest_build_number_from_jenkins,
    trigger_jenkins_pipeline,
)

router = APIRouter()


def _sync_pipeline_from_jenkins(pipeline: PipelineModel, db: Session) -> PipelineModel:
    try:
        jenkins_status = get_jenkins_build_status(pipeline.build_number)
    except JenkinsTriggerError:
        return pipeline

    if not jenkins_status:
        return pipeline

    pipeline.build_number = jenkins_status["build_number"]
    pipeline.status = jenkins_status["status"]
    pipeline.progress = jenkins_status["progress"]
    pipeline.current_stage = jenkins_status["current_stage"]
    pipeline.duration = jenkins_status["duration"]

    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == pipeline.project_id)
        .first()
    )
    if project is not None:
        project.last_pipeline_status = pipeline.status

    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.get("/", response_model=list[PipelineResponse])
def get_pipelines(db: Session = Depends(get_db)):
    pipelines = db.query(PipelineModel).all()
    for pipeline in pipelines:
        if pipeline.status.upper() == "RUNNING":
            _sync_pipeline_from_jenkins(pipeline, db)
    return pipelines


@router.get("/latest/status")
def get_latest_pipeline_status(db: Session = Depends(get_db)):
    """Return the live status of the most recently created pipeline."""
    pipeline = (
        db.query(PipelineModel)
        .order_by(PipelineModel.id.desc())
        .first()
    )

    if pipeline is None:
        raise HTTPException(status_code=404, detail="No pipeline found")

    pipeline = _sync_pipeline_from_jenkins(pipeline, db)

    jenkins_status = get_jenkins_build_status(pipeline.build_number)
    url = jenkins_status.get("url") if jenkins_status else None

    return {
        "pipeline_id": pipeline.id,
        "build_number": pipeline.build_number,
        "status": pipeline.status,
        "progress": pipeline.progress,
        "current_stage": pipeline.current_stage,
        "duration": pipeline.duration,
        "url": url,
    }


@router.get("/build/{jenkins_build_number}/status")
def get_pipeline_status_by_build_number(jenkins_build_number: int, db: Session = Depends(get_db)):
    """Return the live status of a pipeline identified by its Jenkins build number."""
    # Try to find it in our database first
    build_key = f"#{jenkins_build_number}"
    pipeline = (
        db.query(PipelineModel)
        .filter(PipelineModel.build_number == build_key)
        .first()
    )

    if pipeline is not None:
        pipeline = _sync_pipeline_from_jenkins(pipeline, db)

    # Always fetch the live status directly from Jenkins
    try:
        jenkins_status = get_jenkins_build_status(jenkins_build_number)
    except JenkinsTriggerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if jenkins_status is None:
        raise HTTPException(
            status_code=404,
            detail=f"Build #{jenkins_build_number} not found in Jenkins",
        )

    return {
        "pipeline_id": pipeline.id if pipeline else None,
        "build_number": jenkins_status["build_number"],
        "status": jenkins_status["status"],
        "progress": jenkins_status["progress"],
        "current_stage": jenkins_status["current_stage"],
        "duration": jenkins_status["duration"],
        "url": jenkins_status["url"],
    }


@router.get("/{pipeline_id}/logs")
def get_pipeline_logs(pipeline_id: int, db: Session = Depends(get_db)):
    """Fetch live Jenkins console output logs for a given pipeline."""
    pipeline = (
        db.query(PipelineModel)
        .filter(PipelineModel.id == pipeline_id)
        .first()
    )

    if pipeline is None:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    logs = fetch_jenkins_console_log(pipeline.build_number)
    return {
        "pipeline_id": pipeline.id,
        "build_number": pipeline.build_number,
        "logs": logs,
    }



def _get_saved_result(db: Session, model, pipeline: PipelineModel):
    return (
        db.query(model)
        .filter(
            model.pipeline_id == pipeline.id,
            model.build_number == pipeline.build_number,
        )
        .first()
    )


@router.get("/{pipeline_id}/results")
def get_pipeline_results(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = (
        db.query(PipelineModel)
        .filter(PipelineModel.id == pipeline_id)
        .first()
    )

    if pipeline is None:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    tests = _get_saved_result(db, TestResultModel, pipeline)
    quality = _get_saved_result(db, QualityResultModel, pipeline)
    security = _get_saved_result(db, SecurityResultModel, pipeline)
    deployment = _get_saved_result(db, DeploymentResultModel, pipeline)

    return {
        "pipeline_id": pipeline.id,
        "build_number": pipeline.build_number,
        "tests": None if tests is None else {
            "total": tests.total,
            "passed": tests.passed,
            "failed": tests.failed,
            "skipped": tests.skipped,
            "status": tests.status,
        },
        "quality": None if quality is None else {
            "issue_count": quality.issue_count,
            "status": quality.status,
        },
        "security": None if security is None else {
            "vulnerability_count": security.vulnerability_count,
            "status": security.status,
        },
        "deployment": None if deployment is None else {
            "decision": deployment.decision,
        },
    }


@router.get("/{pipeline_id}", response_model=PipelineResponse)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = (
        db.query(PipelineModel)
        .filter(PipelineModel.id == pipeline_id)
        .first()
    )

    if pipeline is None:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    return _sync_pipeline_from_jenkins(pipeline, db)


def _trigger_pipeline(request: PipelineRunRequest, git_url: str) -> dict:
    try:
        return trigger_jenkins_pipeline(
            git_url=git_url,
            branch=request.branch,
            language=request.language,
            run_tests=request.run_tests,
            run_quality=request.run_quality,
            run_security=request.run_security,
            run_ai=request.run_ai or request.generate_ai_suggestions,
            deploy_env=request.deploy_env,
            dependency_audit=request.dependency_audit,
            secret_detection=request.secret_detection,
            run_sast=request.run_sast,
            run_docker_build=request.run_docker_build,
            run_container_scan=request.run_container_scan,
            run_sbom=request.run_sbom,
            push_image=request.push_image,
            sign_image=request.sign_image,
        )
    except JenkinsConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except JenkinsTriggerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/run", response_model=PipelineResponse)
def run_pipeline(request: PipelineRunRequest):
    if request.project_id is None and request.git_url is None:
        raise HTTPException(
            status_code=400,
            detail="git_url or project_id is required",
        )

    db = SessionLocal()
    try:
        project = None
        git_url = request.git_url

        if request.project_id is not None:
            project = (
                db.query(ProjectModel)
                .filter(ProjectModel.id == request.project_id)
                .first()
            )

            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            git_url = project.repository_url

        if not git_url:
            raise HTTPException(status_code=400, detail="git_url is required")

        jenkins_response = _trigger_pipeline(request, git_url)
        pipeline_count = db.query(PipelineModel).count()
        fallback_build_number = f"#local-{pipeline_count + 1}"

        new_pipeline = PipelineModel(
            project_id=request.project_id or 0,
            build_number=jenkins_response.get("build_number") or fallback_build_number,
            status="RUNNING",
            progress=10,
            current_stage="Checkout GitLab",
            duration="0m 00s",
            environment=request.environment or request.deploy_env,
            run_tests=request.run_tests,
            run_quality=request.run_quality,
            run_security=request.run_security,
            dependency_audit=request.dependency_audit,
            secret_detection=request.secret_detection,
            generate_ai_suggestions=request.generate_ai_suggestions,
            deploy_if_validated=request.deploy_if_validated,
        )

        if project is not None:
            project.last_pipeline_status = "RUNNING"

        db.add(new_pipeline)
        db.commit()
        db.refresh(new_pipeline)

        return new_pipeline
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@router.get("/{pipeline_id}/status")
def get_pipeline_status(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = (
        db.query(PipelineModel)
        .filter(PipelineModel.id == pipeline_id)
        .first()
    )

    if pipeline is None:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    pipeline = _sync_pipeline_from_jenkins(pipeline, db)

    # Pull the live Jenkins URL for the build
    jenkins_status = get_jenkins_build_status(pipeline.build_number)
    url = jenkins_status.get("url") if jenkins_status else None

    return {
        "pipeline_id": pipeline.id,
        "build_number": pipeline.build_number,
        "status": pipeline.status,
        "progress": pipeline.progress,
        "current_stage": pipeline.current_stage,
        "duration": pipeline.duration,
        "url": url,
    }