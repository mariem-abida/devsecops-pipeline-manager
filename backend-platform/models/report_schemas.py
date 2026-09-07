"""
Pydantic schemas for the 4 Jenkins report types.

These mirror the TypeScript interfaces defined in frontend-platform/services/api.ts
so the frontend can consume them directly without any transformation.
"""

from typing import Optional
from pydantic import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# Test Results  (reports/test-results.xml — JUnit XML format)
# ─────────────────────────────────────────────────────────────────────────────

class FailedTest(BaseModel):
    id: int
    name: str
    file: str
    error: str
    severity: str = "MEDIUM"
    duration: str = "0.000s"
    status: str = "FAILED"


class PassedCategory(BaseModel):
    name: str
    passed: int
    total: int


class TestReport(BaseModel):
    pipeline_id: Optional[int] = None
    build_number: str
    project: str = ""
    branch: str = ""
    language: str = ""
    framework: str = ""
    status: str                  # SUCCESS | FAILED | ERROR
    total_tests: int
    passed: int
    failed: int
    skipped: int = 0
    success_rate: float
    duration: str
    coverage: float = 0.0
    failed_tests: list[FailedTest] = []
    passed_categories: list[PassedCategory] = []


# ─────────────────────────────────────────────────────────────────────────────
# Code Quality  (reports/code-quality-report.txt)
# ─────────────────────────────────────────────────────────────────────────────

class QualityMetric(BaseModel):
    label: str
    value: str
    icon: str = ""
    color: str = ""


class IssueDistribution(BaseModel):
    label: str
    count: int
    color: str = ""


class CodeIssue(BaseModel):
    id: int
    type: str
    severity: str
    file: str
    line: int = 0
    description: str
    recommendation: str = ""


class CodeQualityReport(BaseModel):
    pipeline_id: Optional[int] = None
    build_number: str
    project: str = ""
    branch: str = ""
    language: str = ""
    tool: str = ""
    quality_gate: str            # PASSED | FAILED | WARN
    quality_gate_reason: str = ""
    quality_score: float = 0.0
    bugs: int = 0
    code_smells: int = 0
    vulnerabilities: int = 0
    coverage: float = 0.0
    duplication: float = 0.0
    tech_debt: str = ""
    maintainability_rating: str = ""
    security_rating: str = ""
    analysis_duration: str = ""
    last_analysis: str = ""
    summary: str = ""
    deployment_blocked: bool = False
    metrics: list[QualityMetric] = []
    issues_distribution: list[IssueDistribution] = []
    code_issues: list[CodeIssue] = []


# ─────────────────────────────────────────────────────────────────────────────
# Security Results  (reports/security-report.txt)
# ─────────────────────────────────────────────────────────────────────────────

class SecurityFinding(BaseModel):
    id: int
    tool: str
    severity: str
    category: str = ""
    file: str = ""
    line: int = 0
    description: str
    suggestedAction: str = ""
    status: str = "OPEN"


class SecurityToolStatus(BaseModel):
    name: str
    purpose: str = ""
    status: str                  # PASSED | FAILED | WARN | SKIPPED
    finding: str = ""
    statusColor: str = ""


class SeverityDistribution(BaseModel):
    label: str
    count: int
    color: str = ""


class SecurityReport(BaseModel):
    pipeline_id: Optional[int] = None
    build_number: str
    project: str = ""
    branch: str = ""
    language: str = ""
    security_status: str         # PASSED | FAILED | WARN
    critical_issues: int = 0
    high_issues: int = 0
    medium_issues: int = 0
    low_issues: int = 0
    secrets_detected: int = 0
    vulnerable_dependencies: int = 0
    tools_used: str = ""
    analysis_duration: str = ""
    last_analysis: str = ""
    summary: str = ""
    deployment_blocked: bool = False
    deployment_reason: str = ""
    blocking_issues: list[str] = []
    required_action: str = ""
    tools_status: list[SecurityToolStatus] = []
    severity_distribution: list[SeverityDistribution] = []
    findings: list[SecurityFinding] = []


# ─────────────────────────────────────────────────────────────────────────────
# Deployment Decision  (reports/deployment-decision.txt)
# ─────────────────────────────────────────────────────────────────────────────

class DeploymentDecisionReport(BaseModel):
    pipeline_id: Optional[int] = None
    build_number: str
    decision: str                # APPROVED | BLOCKED | MANUAL_REVIEW
    deployment_blocked: bool
    main_reason: str = ""
    requirements: list[str] = []
    next_action: str = ""
    raw_content: str = ""


# ─────────────────────────────────────────────────────────────────────────────
# SBOM Report  (reports/sbom.cdx.json + reports/sbom-summary.txt)
# ─────────────────────────────────────────────────────────────────────────────

class SBOMComponent(BaseModel):
    name: str
    version: str = "N/A"
    type: str = "library"
    purl: str = ""
    licenses: list[str] = []


class SBOMTypeDistribution(BaseModel):
    label: str
    count: int


class SBOMLicense(BaseModel):
    license: str
    count: int


class SBOMReport(BaseModel):
    pipeline_id: Optional[int] = None
    build_number: str
    status: str = "UNKNOWN"
    tool: str = "Trivy"
    format: str = "CycloneDX JSON"
    image: str = ""
    component_count: int = 0
    components: list[SBOMComponent] = []
    type_distribution: list[SBOMTypeDistribution] = []
    licenses: list[SBOMLicense] = []


# ─────────────────────────────────────────────────────────────────────────────
# Compliance / OPA Report  (reports/policy-result.json + reports/policy-summary.txt)
# ─────────────────────────────────────────────────────────────────────────────

class PolicyRule(BaseModel):
    rule: str
    description: str
    status: str          # PASSED | FAILED | SKIPPED
    details: str = ""


class ComplianceReport(BaseModel):
    pipeline_id: Optional[int] = None
    build_number: str
    status: str = "UNKNOWN"         # PASSED | FAILED
    tool: str = "Open Policy Agent (OPA)"
    policy_file: str = "policy/devsecops.rego"
    denial_count: int = 0
    denials: list[str] = []
    rules: list[PolicyRule] = []
    policy_input: dict = {}
    deployment_allowed: bool = False

# ─────────────────────────────────────────────────────────────────────────────
# AI Security Advisor Report  (reports/ai-security-report.md + status)
# ─────────────────────────────────────────────────────────────────────────────

class AISecurityReport(BaseModel):
    build_number: str
    status: str
    model: str = ""
    report: str
