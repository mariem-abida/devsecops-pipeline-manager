"""
Backend routes for SBOM and Compliance (OPA Policy) reports.

Endpoints:
  GET /reports/{build_number}/sbom        → SBOM CycloneDX components list
  GET /reports/{build_number}/compliance  → OPA policy evaluation result
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import PipelineModel
from models.report_schemas import ComplianceReport, SBOMReport
from services.jenkins_service import (
    JenkinsConfigError,
    JenkinsTriggerError,
    fetch_jenkins_artifact,
)

router = APIRouter()


def _fetch(build_number: int, path: str) -> str:
    try:
        return fetch_jenkins_artifact(build_number, path)
    except JenkinsConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except JenkinsTriggerError as exc:
        raise HTTPException(status_code=404, detail=f"Artifact not found: {path}") from exc


def _build_number_keys(build_number: int) -> list[str]:
    raw = str(build_number)
    return [raw, f"#{raw}"]


def _find_pipeline_or_404(build_number: int, db: Session) -> PipelineModel:
    pipeline = (
        db.query(PipelineModel)
        .filter(PipelineModel.build_number.in_(_build_number_keys(build_number)))
        .order_by(PipelineModel.id.desc())
        .first()
    )
    if pipeline is None:
        raise HTTPException(
            status_code=404,
            detail=f"No pipeline found for Jenkins build number {build_number}.",
        )
    return pipeline


# ─────────────────────────────────────────────────────────────────────────────
# SBOM endpoint
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{build_number}/sbom", response_model=SBOMReport)
def get_sbom(build_number: int, db: Session = Depends(get_db)):
    """
    Fetch and parse the CycloneDX SBOM artifact (reports/sbom.cdx.json)
    plus the summary (reports/sbom-summary.txt).
    """
    pipeline = _find_pipeline_or_404(build_number, db)

    # Parse sbom-summary.txt for metadata
    try:
        summary_raw = _fetch(build_number, "reports/sbom-summary.txt")
    except HTTPException:
        summary_raw = ""

    def _kv(text: str, key: str) -> str:
        for line in text.splitlines():
            if line.startswith(f"{key}:"):
                return line.split(":", 1)[1].strip()
        return ""

    status = _kv(summary_raw, "STATUS") or "UNKNOWN"
    tool = _kv(summary_raw, "TOOL") or "Trivy"
    fmt = _kv(summary_raw, "FORMAT") or "CycloneDX JSON"
    image = _kv(summary_raw, "IMAGE") or ""
    comp_count_str = _kv(summary_raw, "COMPONENTS") or "0"
    component_count = int(comp_count_str) if comp_count_str.isdigit() else 0

    # Parse sbom.cdx.json for component list
    components = []
    licenses_summary: dict[str, int] = {}
    package_types: dict[str, int] = {}

    try:
        raw_json = _fetch(build_number, "reports/sbom.cdx.json")
        data = json.loads(raw_json)
        raw_components = data.get("components", [])
        component_count = len(raw_components)

        for comp in raw_components:
            name = comp.get("name", "unknown")
            version = comp.get("version", "N/A")
            comp_type = comp.get("type", "library")
            purl = comp.get("purl", "")

            # Gather licenses
            lic_list = []
            for lic in comp.get("licenses", []):
                lic_id = lic.get("license", {}).get("id") or lic.get("license", {}).get("name", "Unknown")
                lic_list.append(lic_id)
                licenses_summary[lic_id] = licenses_summary.get(lic_id, 0) + 1

            package_types[comp_type] = package_types.get(comp_type, 0) + 1

            components.append({
                "name": name,
                "version": version,
                "type": comp_type,
                "purl": purl,
                "licenses": lic_list,
            })

    except Exception:
        pass  # Fall back to summary data only

    # Build type distribution for chart
    type_distribution = [
        {"label": k, "count": v}
        for k, v in sorted(package_types.items(), key=lambda x: x[1], reverse=True)
    ]
    licenses_list = [
        {"license": k, "count": v}
        for k, v in sorted(licenses_summary.items(), key=lambda x: x[1], reverse=True)
    ]

    return SBOMReport(
        pipeline_id=pipeline.id,
        build_number=f"#{build_number}",
        status=status,
        tool=tool,
        format=fmt,
        image=image,
        component_count=component_count,
        components=components,
        type_distribution=type_distribution,
        licenses=licenses_list,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Compliance (OPA) endpoint
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{build_number}/compliance", response_model=ComplianceReport)
def get_compliance(build_number: int, db: Session = Depends(get_db)):
    """
    Fetch and parse the OPA policy evaluation result.
    Reads policy-result.json (raw OPA output) and policy-summary.txt.
    """
    pipeline = _find_pipeline_or_404(build_number, db)

    def _kv(text: str, key: str) -> str:
        for line in text.splitlines():
            if line.startswith(f"{key}:"):
                return line.split(":", 1)[1].strip()
        return ""

    # Load policy-summary.txt
    try:
        summary_raw = _fetch(build_number, "reports/policy-summary.txt")
    except HTTPException:
        summary_raw = ""

    status = _kv(summary_raw, "STATUS") or "UNKNOWN"
    tool = _kv(summary_raw, "TOOL") or "Open Policy Agent (OPA)"
    policy_file = _kv(summary_raw, "POLICY") or "policy/devsecops.rego"
    denial_count_str = _kv(summary_raw, "DENIALS") or "0"
    denial_count = int(denial_count_str) if denial_count_str.isdigit() else 0

    # Load policy-result.json (raw OPA output)
    denials: list[str] = []
    raw_input: dict = {}

    try:
        raw_json = _fetch(build_number, "reports/policy-result.json")
        data = json.loads(raw_json)
        results = data.get("result", [])
        if results:
            exprs = results[0].get("expressions", [])
            if exprs:
                deny_list = exprs[0].get("value", []) or []
                denials = [str(d) for d in deny_list]
                denial_count = len(denials)
    except Exception:
        pass

    # Load the policy input (what was evaluated)
    try:
        input_raw = _fetch(build_number, "reports/security-policy-input.json")
        raw_input = json.loads(input_raw)
    except Exception:
        raw_input = {}

    # Build policy rules status from the input context
    rules = []
    input_data = raw_input or {}

    def _rule(name: str, section: str, desc: str):
        sec = input_data.get(section, {})
        enabled = sec.get("enabled", True)
        if not enabled:
            return {"rule": name, "description": desc, "status": "SKIPPED", "details": "Stage disabled"}
        # Check if this rule triggered a denial
        triggered = any(name.lower() in d.lower() or section.lower() in d.lower() for d in denials)
        return {
            "rule": name,
            "description": desc,
            "status": "FAILED" if triggered else "PASSED",
            "details": next((d for d in denials if name.lower() in d.lower() or section.lower() in d.lower()), "OK"),
        }

    rules = [
        _rule("Tests", "tests", "Unit tests must pass"),
        _rule("SonarQube", "sonar", "SonarQube Quality Gate must be OK"),
        _rule("SAST", "sast", "No blocking SAST findings"),
        _rule("Secrets", "secrets", "No secrets exposed in code"),
        _rule("Container Scan", "container", "No critical container vulnerabilities"),
        _rule("Dependencies", "dependencies", "Dependency vulnerabilities in limit"),
        _rule("Docker Build", "docker", "Docker image must build successfully"),
        _rule("SBOM", "sbom", "SBOM must be generated"),
    ]

    return ComplianceReport(
        pipeline_id=pipeline.id,
        build_number=f"#{build_number}",
        status=status,
        tool=tool,
        policy_file=policy_file,
        denial_count=denial_count,
        denials=denials,
        rules=rules,
        policy_input=raw_input,
        deployment_allowed=(status == "PASSED" and denial_count == 0),
    )
