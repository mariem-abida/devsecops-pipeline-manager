"""
REST endpoints for Jenkins build reports.

Each endpoint fetches the Jenkins artifact, parses it, and upserts the parsed
summary plus the raw report into PostgreSQL for the matching pipeline.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import (
    AIResultModel,
    DeploymentResultModel,
    PipelineModel,
    QualityResultModel,
    SecurityResultModel,
    TestResultModel,
)
from models.report_schemas import (
    AISecurityReport,
    CodeQualityReport,
    DeploymentDecisionReport,
    SecurityReport,
    TestReport,
)
from services.jenkins_service import (
    JenkinsConfigError,
    JenkinsTriggerError,
    fetch_jenkins_artifact,
)
from services.report_service import (
    parse_ai_security_report,
    parse_deployment_report,
    parse_junit_xml,
    parse_quality_report,
    parse_security_report,
)

router = APIRouter()

_ARTIFACT_TESTS       = "reports/test-results.xml"
_ARTIFACT_QUALITY     = "reports/code-quality-report.txt"
_ARTIFACT_SECURITY    = "reports/security-report.txt"
_ARTIFACT_DEPLOYMENT  = "reports/deployment-decision.txt"
_ARTIFACT_AI_REPORT   = "reports/ai-security-report.json"
_ARTIFACT_AI_STATUS   = "reports/ai-security-status.txt"
# OPA policy result — written by the "Policy as Code" Jenkins stage
_ARTIFACT_OPA_RESULT  = "reports/policy-result.txt"


def _build_label(build_number: int) -> str:
    return f"#{build_number}"


def _normalize_build_number(build_number: int | str) -> int:
    raw = str(build_number).strip().lstrip("#")
    if not raw.isdigit():
        raise HTTPException(
            status_code=422,
            detail=f"Invalid Jenkins build number: {build_number}",
        )
    return int(raw)


def _build_number_keys(build_number: int) -> list[str]:
    raw = str(build_number)
    return [raw, f"#{raw}"]


def _fetch_artifact(build_number: int, artifact_path: str) -> str:
    """Fetch a Jenkins artifact or raise an appropriate HTTP exception."""
    try:
        return fetch_jenkins_artifact(build_number, artifact_path)
    except JenkinsConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except JenkinsTriggerError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


def _fetch_optional_artifact(build_number: int, artifact_path: str) -> str:
    try:
        return _fetch_artifact(build_number, artifact_path)
    except HTTPException as exc:
        if exc.status_code == 404:
            return ""
        raise


def _find_pipeline(build_number: int, db: Session) -> PipelineModel | None:
    """Find a pipeline by Jenkins build number, accepting values with or without '#'."""
    return (
        db.query(PipelineModel)
        .filter(PipelineModel.build_number.in_(_build_number_keys(build_number)))
        .order_by(PipelineModel.id.desc())
        .first()
    )


def _find_pipeline_or_404(build_number: int, db: Session) -> PipelineModel:
    pipeline = _find_pipeline(build_number, db)
    if pipeline is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No pipeline found for Jenkins build number {build_number}. "
                "Report results were not saved to avoid orphan records."
            ),
        )
    return pipeline


def _attach_pipeline(report, pipeline: PipelineModel) -> None:
    report.pipeline_id = pipeline.id


def _upsert_result(db: Session, model, pipeline: PipelineModel, values: dict):
    query = db.query(model).filter(model.pipeline_id == pipeline.id)
    has_build_number = hasattr(model, "build_number")

    if has_build_number:
        query = query.filter(model.build_number == pipeline.build_number)

    result = query.first()

    if result is None:
        create_values = {
            "pipeline_id": pipeline.id,
            **values,
        }
        if has_build_number:
            create_values["build_number"] = pipeline.build_number
        result = model(**create_values)
        db.add(result)
    else:
        for key, value in values.items():
            setattr(result, key, value)

    try:
        db.commit()
        db.refresh(result)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save {model.__tablename__}: {exc.__class__.__name__}",
        ) from exc

    return result


def _quality_issue_count(report: CodeQualityReport) -> int:
    if report.code_issues:
        return len(report.code_issues)
    return report.bugs + report.code_smells


def _security_vulnerability_count(report: SecurityReport) -> int:
    severity_total = (
        report.critical_issues
        + report.high_issues
        + report.medium_issues
        + report.low_issues
    )
    if severity_total > 0:
        return severity_total
    return report.vulnerable_dependencies


@router.get("/{build_number}/tests", response_model=TestReport)
def get_test_results(build_number: int, db: Session = Depends(get_db)):
    raw = _fetch_artifact(build_number, _ARTIFACT_TESTS)

    try:
        report = parse_junit_xml(raw, _build_label(build_number))
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse test report: {exc}",
        ) from exc

    pipeline = _find_pipeline_or_404(build_number, db)
    _attach_pipeline(report, pipeline)
    _upsert_result(
        db,
        TestResultModel,
        pipeline,
        {
            "total": report.total_tests,
            "passed": report.passed,
            "failed": report.failed,
            "skipped": report.skipped,
            "status": report.status,
            "raw_report": raw,
        },
    )
    return report


@router.get("/{build_number}/quality", response_model=CodeQualityReport)
def get_quality_results(build_number: int, db: Session = Depends(get_db)):
    raw = _fetch_artifact(build_number, _ARTIFACT_QUALITY)

    report = parse_quality_report(raw, _build_label(build_number))
    pipeline = _find_pipeline_or_404(build_number, db)
    _attach_pipeline(report, pipeline)
    _upsert_result(
        db,
        QualityResultModel,
        pipeline,
        {
            "status": report.quality_gate,
            "issue_count": _quality_issue_count(report),
            "raw_report": raw,
        },
    )
    return report


@router.get("/{build_number}/security", response_model=SecurityReport)
def get_security_results(build_number: int, db: Session = Depends(get_db)):
    raw = _fetch_artifact(build_number, _ARTIFACT_SECURITY)

    report = parse_security_report(raw, _build_label(build_number))
    pipeline = _find_pipeline_or_404(build_number, db)
    _attach_pipeline(report, pipeline)
    _upsert_result(
        db,
        SecurityResultModel,
        pipeline,
        {
            "status": report.security_status,
            "vulnerability_count": _security_vulnerability_count(report),
            "raw_report": raw,
        },
    )
    return report


@router.get("/{build_number}/deployment", response_model=DeploymentDecisionReport)
def get_deployment_decision(build_number: int, db: Session = Depends(get_db)):
    raw = _fetch_artifact(build_number, _ARTIFACT_DEPLOYMENT)

    report = parse_deployment_report(raw, _build_label(build_number))
    pipeline = _find_pipeline_or_404(build_number, db)
    _attach_pipeline(report, pipeline)
    _upsert_result(
        db,
        DeploymentResultModel,
        pipeline,
        {
            "decision": report.decision,
            "raw_report": raw,
        },
    )
    return report


@router.get("/{build_number}/ai", response_model=AISecurityReport)
def get_ai_security_results(build_number: str, db: Session = Depends(get_db)):
    """
    Fetch the AI Security Advisor report for a Jenkins build.

    Jenkins generates reports/ai-security-report.json (CycloneDX-style JSON).
    We read it, validate it, then return it so the frontend can consume it
    directly via JSON.parse(response.report).
    """
    import json as _json

    normalized_build_number = _normalize_build_number(build_number)
    raw_json = _fetch_artifact(normalized_build_number, _ARTIFACT_AI_REPORT)
    status_raw = _fetch_optional_artifact(normalized_build_number, _ARTIFACT_AI_STATUS)

    # Parse the JSON to validate it and extract metadata
    try:
        data = _json.loads(raw_json)
    except _json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI report is not valid JSON: {exc}",
        ) from exc

    # Determine status from the JSON itself or from the status file
    deployment_info = data.get("deployment_assistant", {})
    deployment_blocked = deployment_info.get("deployment_blocked", False)

    if status_raw.strip().upper() in ("PASSED", "FAILED", "SKIPPED"):
        status = status_raw.strip().upper()
    elif deployment_blocked:
        status = "PASSED"   # AI ran successfully; deployment blocked is a result, not an error
    elif data.get("total_recommendations", 0) >= 0:
        status = "PASSED"
    else:
        status = "UNKNOWN"

    model_name = data.get("context", {}).get("actual_model", "")

    report = AISecurityReport(
        build_number=f"#{normalized_build_number}",
        status=status,
        model=model_name,
        # The frontend does JSON.parse(response.report), so we pass the raw JSON string
        report=raw_json,
    )

    pipeline = _find_pipeline(normalized_build_number, db)
    if pipeline:
        _upsert_result(
            db,
            AIResultModel,
            pipeline,
            {
                "status": report.status,
                "model": report.model,
                "report": report.report,
                "raw_report": raw_json,
            },
        )

    return report
