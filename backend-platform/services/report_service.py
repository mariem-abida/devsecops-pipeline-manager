"""
report_service.py — Fetch and parse Jenkins build artifacts.

Each parser handles one report file:
  - parse_junit_xml()         → reports/test-results.xml
  - parse_quality_report()   → reports/code-quality-report.txt
  - parse_security_report()  → reports/security-report.txt
  - parse_deployment_report() → reports/deployment-decision.txt

All parsers return the corresponding Pydantic schema defined in
models/report_schemas.py.
"""

import json
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from models.report_schemas import (
    AISecurityReport,
    CodeIssue,
    CodeQualityReport,
    DeploymentDecisionReport,
    FailedTest,
    IssueDistribution,
    PassedCategory,
    QualityMetric,
    SecurityFinding,
    SecurityReport,
    SecurityToolStatus,
    SeverityDistribution,
    TestReport,
)


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def _kv(text: str, key: str, default: str = "") -> str:
    """Extract the value for 'key: value' or 'key=value' patterns (case-insensitive)."""
    pattern = rf"^{re.escape(key)}\s*[=:]\s*(.+)$"
    match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else default


def _kv_int(text: str, key: str, default: int = 0) -> int:
    raw = _kv(text, key, str(default))
    digits = re.search(r"\d+", raw)
    return int(digits.group()) if digits else default


def _kv_float(text: str, key: str, default: float = 0.0) -> float:
    raw = _kv(text, key, str(default))
    number = re.search(r"[\d.]+", raw)
    return float(number.group()) if number else default


def _seconds_to_label(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m}m {s:02d}s"


# ─────────────────────────────────────────────────────────────────────────────
# Test Results — JUnit XML
# ─────────────────────────────────────────────────────────────────────────────

def parse_junit_xml(xml_content: str, build_number: str) -> TestReport:
    """Parse a JUnit XML report (pytest, unittest, etc.) into a TestReport."""
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as exc:
        raise ValueError(f"Invalid JUnit XML: {exc}") from exc

    # Support both <testsuites> (root) and bare <testsuite> root
    if root.tag == "testsuites":
        suites = list(root)
    else:
        suites = [root]

    total_tests = 0
    total_failures = 0
    total_errors = 0
    total_skipped = 0
    total_time = 0.0
    failed_tests: list[FailedTest] = []
    passed_categories: list[PassedCategory] = []

    for suite in suites:
        if suite.tag != "testsuite":
            continue

        s_tests = int(suite.get("tests", 0))
        s_failures = int(suite.get("failures", 0))
        s_errors = int(suite.get("errors", 0))
        s_skipped = int(suite.get("skipped", 0) or suite.get("disabled", 0))
        if s_skipped == 0:
            s_skipped = sum(1 for tc in suite.iter("testcase") if tc.find("skipped") is not None)
        s_time = float(suite.get("time", 0.0))
        s_name = suite.get("name", "Suite")

        total_tests += s_tests
        total_failures += s_failures
        total_errors += s_errors
        total_skipped += s_skipped
        total_time += s_time

        s_failed = s_failures + s_errors
        passed_categories.append(
            PassedCategory(
                name=s_name,
                passed=max(0, s_tests - s_failed - s_skipped),
                total=s_tests,
            )
        )

        for tc in suite.iter("testcase"):
            failure_el = tc.find("failure")
            error_el = tc.find("error")
            problem = failure_el if failure_el is not None else error_el
            if problem is None:
                continue  # test passed

            severity = "HIGH" if error_el is not None else "MEDIUM"
            message = (
                problem.get("message")
                or (problem.text or "").strip()[:200]
                or "No message"
            )

            failed_tests.append(
                FailedTest(
                    id=len(failed_tests) + 1,
                    name=tc.get("name", "Unknown test"),
                    file=tc.get("classname", "unknown"),
                    error=message,
                    severity=severity,
                    duration=f"{float(tc.get('time', 0)):.3f}s",
                    status="FAILED",
                )
            )

    total_failed = total_failures + total_errors
    passed = max(0, total_tests - total_failed - total_skipped)
    success_rate = round((passed / total_tests * 100), 1) if total_tests > 0 else 0.0

    # Detect framework from classnames heuristic
    all_classes = " ".join(
        tc.get("classname", "")
        for suite in suites
        for tc in suite.iter("testcase")
    )
    if "pytest" in all_classes.lower() or "test_" in all_classes.lower():
        framework = "pytest"
    elif "unittest" in all_classes.lower():
        framework = "unittest"
    else:
        framework = "JUnit"

    return TestReport(
        build_number=build_number,
        framework=framework,
        status="SUCCESS" if total_failed == 0 else "FAILED",
        total_tests=total_tests,
        passed=passed,
        failed=total_failed,
        skipped=total_skipped,
        success_rate=success_rate,
        duration=_seconds_to_label(total_time),
        failed_tests=failed_tests,
        passed_categories=passed_categories,
        last_analysis=_now_iso(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Code Quality — Text report
# ─────────────────────────────────────────────────────────────────────────────

def parse_quality_report(text: str, build_number: str) -> CodeQualityReport:
    """Parse a code-quality-report.txt file into a CodeQualityReport.

    Expected text format (KEY: VALUE pairs, one per line):
        TOOL: flake8
        QUALITY_GATE: PASSED
        QUALITY_SCORE: 87.5
        BUGS: 2
        CODE_SMELLS: 14
        COVERAGE: 78.3
        DUPLICATION: 3.2
        DEPLOYMENT_BLOCKED: false
        SUMMARY: Code quality analysis completed successfully.
        ...
        ISSUE|WARNING|function_name|app.py|12|W0611 unused import
    """
    tool = _kv(text, "TOOL") or _kv(text, "ANALYZER") or "Unknown"
    gate_raw = (_kv(text, "QUALITY_GATE") or _kv(text, "STATUS") or "UNKNOWN").upper()
    gate = gate_raw if gate_raw in ("PASSED", "FAILED", "WARN", "ERROR") else "UNKNOWN"
    quality_score = _kv_float(text, "QUALITY_SCORE") or _kv_float(text, "SCORE")
    bugs = _kv_int(text, "BUGS")
    code_smells = _kv_int(text, "CODE_SMELLS") or _kv_int(text, "SMELLS")
    vulnerabilities = _kv_int(text, "VULNERABILITIES")
    coverage = _kv_float(text, "COVERAGE")
    duplication = _kv_float(text, "DUPLICATION") or _kv_float(text, "DUPLICATIONS")
    tech_debt = _kv(text, "TECH_DEBT") or "0"
    maintainability_rating = _kv(text, "MAINTAINABILITY") or "A"
    security_rating = _kv(text, "SECURITY_RATING") or "A"
    blocked_raw = _kv(text, "DEPLOYMENT_BLOCKED").lower()
    deployment_blocked = blocked_raw in ("true", "yes", "1")
    summary = _kv(text, "SUMMARY") or _kv(text, "DESCRIPTION")
    duration = _kv(text, "DURATION") or _kv(text, "ANALYSIS_DURATION")

    # Parse inline issues: ISSUE|<type>|<file>|<line>|<description>
    code_issues: list[CodeIssue] = []
    for i, line in enumerate(text.splitlines()):
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 4 and parts[0].upper() in ("ISSUE", "WARNING", "ERROR", "BUG"):
            try:
                code_issues.append(
                    CodeIssue(
                        id=i + 1,
                        type=parts[0].upper(),
                        severity="HIGH" if parts[0].upper() in ("ERROR", "BUG") else "MEDIUM",
                        file=parts[1] if len(parts) > 1 else "unknown",
                        line=int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0,
                        description=parts[3] if len(parts) > 3 else line,
                        recommendation=parts[4] if len(parts) > 4 else "",
                    )
                )
            except (ValueError, IndexError):
                pass

    # Build summary metrics list
    metrics = [
        QualityMetric(label="Quality Score", value=f"{quality_score:.1f}%", color="green" if quality_score >= 70 else "red"),
        QualityMetric(label="Coverage", value=f"{coverage:.1f}%", color="green" if coverage >= 60 else "orange"),
        QualityMetric(label="Bugs", value=str(bugs), color="red" if bugs > 0 else "green"),
        QualityMetric(label="Code Smells", value=str(code_smells), color="orange" if code_smells > 0 else "green"),
        QualityMetric(label="Duplication", value=f"{duplication:.1f}%", color="orange" if duplication > 5 else "green"),
    ]

    # Issue distribution for charts
    type_counts: dict[str, int] = {}
    for issue in code_issues:
        type_counts[issue.type] = type_counts.get(issue.type, 0) + 1

    colour_map = {"BUG": "#ef4444", "ERROR": "#ef4444", "WARNING": "#f59e0b", "ISSUE": "#3b82f6"}
    issues_distribution = [
        IssueDistribution(label=t, count=c, color=colour_map.get(t, "#6b7280"))
        for t, c in type_counts.items()
    ]

    gate_reason = _kv(text, "GATE_REASON") or _kv(text, "REASON")
    if not gate_reason:
        if gate == "FAILED":
            parts_reason = []
            if bugs > 0:
                parts_reason.append(f"{bugs} bug(s)")
            if coverage < 60:
                parts_reason.append(f"coverage {coverage:.1f}% < 60%")
            gate_reason = "Quality gate failed: " + ", ".join(parts_reason) if parts_reason else "Quality gate failed"
        else:
            gate_reason = "All quality checks passed"

    return CodeQualityReport(
        build_number=build_number,
        tool=tool,
        quality_gate=gate,
        quality_gate_reason=gate_reason,
        quality_score=quality_score,
        bugs=bugs,
        code_smells=code_smells,
        vulnerabilities=vulnerabilities,
        coverage=coverage,
        duplication=duplication,
        tech_debt=tech_debt,
        maintainability_rating=maintainability_rating,
        security_rating=security_rating,
        analysis_duration=duration,
        last_analysis=_now_iso(),
        summary=summary or f"Code quality analysis by {tool} completed.",
        deployment_blocked=deployment_blocked,
        metrics=metrics,
        issues_distribution=issues_distribution,
        code_issues=code_issues,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Security Results — Text report
# ─────────────────────────────────────────────────────────────────────────────

def parse_security_report(text: str, build_number: str) -> SecurityReport:
    """Parse a security-report.txt file into a SecurityReport.

    Expected text format (KEY: VALUE pairs, one per line):
        STATUS: PASSED
        TOOLS: Gitleaks, Semgrep, pip-audit
        CRITICAL: 0
        HIGH: 1
        MEDIUM: 3
        LOW: 5
        SECRETS: 0
        VULNERABLE_DEPS: 2
        DEPLOYMENT_BLOCKED: false
        SUMMARY: Security scan completed.
        ...
        FINDING|Semgrep|HIGH|SQL Injection|app.py|42|Use parameterized queries
        TOOL_STATUS|Gitleaks|Secret Detection|PASSED|No secrets found
    """
    status_raw = (_kv(text, "STATUS") or _kv(text, "SECURITY_STATUS") or "UNKNOWN").upper()
    critical = _kv_int(text, "CRITICAL")
    high = _kv_int(text, "HIGH")
    medium = _kv_int(text, "MEDIUM")
    low = _kv_int(text, "LOW")
    secrets = _kv_int(text, "SECRETS") or _kv_int(text, "SECRETS_DETECTED")
    vuln_deps = _kv_int(text, "VULNERABLE_DEPS") or _kv_int(text, "VULNERABLE_DEPENDENCIES")
    tools_used = _kv(text, "TOOLS") or _kv(text, "TOOLS_USED")
    duration = _kv(text, "DURATION") or _kv(text, "ANALYSIS_DURATION")
    summary = _kv(text, "SUMMARY")
    blocked_raw = _kv(text, "DEPLOYMENT_BLOCKED").lower()
    deployment_blocked = blocked_raw in ("true", "yes", "1")

    if status_raw in ("PASSED", "FAILED", "WARN"):
        status = status_raw
    elif deployment_blocked or critical > 0 or high > 0 or secrets > 0 or vuln_deps > 0:
        status = "FAILED"
    elif medium > 0 or low > 0:
        status = "WARN"
    else:
        status = "UNKNOWN"
    deployment_reason = _kv(text, "DEPLOYMENT_REASON") or _kv(text, "REASON")
    required_action = _kv(text, "REQUIRED_ACTION") or _kv(text, "ACTION")

    # Parse security findings: FINDING|<tool>|<severity>|<description>|<file>|<line>|<action>
    findings: list[SecurityFinding] = []
    tools_status: list[SecurityToolStatus] = []

    colour_map_sev = {
        "CRITICAL": "#dc2626", "HIGH": "#ea580c",
        "MEDIUM": "#d97706", "LOW": "#2563eb", "INFO": "#6b7280",
    }

    for line in text.splitlines():
        parts = [p.strip() for p in line.split("|")]

        if parts[0].upper() == "FINDING" and len(parts) >= 4:
            try:
                findings.append(
                    SecurityFinding(
                        id=len(findings) + 1,
                        tool=parts[1] if len(parts) > 1 else "Unknown",
                        severity=(parts[2] if len(parts) > 2 else "MEDIUM").upper(),
                        description=parts[3] if len(parts) > 3 else "Security issue",
                        file=parts[4] if len(parts) > 4 else "",
                        line=int(parts[5]) if len(parts) > 5 and parts[5].isdigit() else 0,
                        suggestedAction=parts[6] if len(parts) > 6 else "",
                        status="OPEN",
                    )
                )
            except (ValueError, IndexError):
                pass

        elif parts[0].upper() == "TOOL_STATUS" and len(parts) >= 3:
            sev_col = "#22c55e" if parts[3].upper() == "PASSED" else "#ef4444"
            tools_status.append(
                SecurityToolStatus(
                    name=parts[1],
                    purpose=parts[2] if len(parts) > 2 else "",
                    status=(parts[3] if len(parts) > 3 else "UNKNOWN").upper(),
                    finding=parts[4] if len(parts) > 4 else "",
                    statusColor=sev_col,
                )
            )

    # Severity distribution for charts
    sev_distribution = [
        SeverityDistribution(label="Critical", count=critical, color=colour_map_sev["CRITICAL"]),
        SeverityDistribution(label="High", count=high, color=colour_map_sev["HIGH"]),
        SeverityDistribution(label="Medium", count=medium, color=colour_map_sev["MEDIUM"]),
        SeverityDistribution(label="Low", count=low, color=colour_map_sev["LOW"]),
    ]

    # Compute blocking issues
    blocking: list[str] = []
    if critical > 0:
        blocking.append(f"{critical} critical vulnerability(ies) detected")
    if secrets > 0:
        blocking.append(f"{secrets} secret(s) detected in source code")

    if not summary:
        total = critical + high + medium + low
        summary = (
            f"Security scan found {total} issue(s): "
            f"{critical} critical, {high} high, {medium} medium, {low} low."
        )

    return SecurityReport(
        build_number=build_number,
        security_status=status,
        critical_issues=critical,
        high_issues=high,
        medium_issues=medium,
        low_issues=low,
        secrets_detected=secrets,
        vulnerable_dependencies=vuln_deps,
        tools_used=tools_used,
        analysis_duration=duration,
        last_analysis=_now_iso(),
        summary=summary,
        deployment_blocked=deployment_blocked,
        deployment_reason=deployment_reason,
        blocking_issues=blocking,
        required_action=required_action,
        tools_status=tools_status,
        severity_distribution=sev_distribution,
        findings=findings,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Deployment Decision — Text report
# ─────────────────────────────────────────────────────────────────────────────

def parse_deployment_report(text: str, build_number: str) -> DeploymentDecisionReport:
    """Parse a deployment-decision.txt file into a DeploymentDecisionReport.

    Expected text format:
        DECISION: APPROVED
        DEPLOYMENT_BLOCKED: false
        REASON: All checks passed.
        REQUIREMENT: Tests must pass
        REQUIREMENT: Quality gate must pass
        NEXT_ACTION: Deploy to staging environment
    """
    decision_raw = (
        _kv(text, "DECISION")
        or _kv(text, "DEPLOY_DECISION")
        or "UNKNOWN"
    ).upper()
    decision = decision_raw if decision_raw in ("APPROVED", "BLOCKED", "MANUAL_REVIEW") else "UNKNOWN"

    blocked_raw = _kv(text, "DEPLOYMENT_BLOCKED").lower()
    # Infer from decision if not explicitly set
    if not blocked_raw:
        deployment_blocked = decision == "BLOCKED"
    else:
        deployment_blocked = blocked_raw in ("true", "yes", "1")

    main_reason = _kv(text, "REASON") or _kv(text, "MAIN_REASON")
    next_action = _kv(text, "NEXT_ACTION") or _kv(text, "ACTION")

    # Collect all REQUIREMENT lines
    requirements = re.findall(
        r"^REQUIREMENT\s*[=:]\s*(.+)$", text, re.IGNORECASE | re.MULTILINE
    )

    return DeploymentDecisionReport(
        build_number=build_number,
        decision=decision,
        deployment_blocked=deployment_blocked,
        main_reason=main_reason,
        requirements=requirements,
        next_action=next_action,
        raw_content=text,
    )

# ─────────────────────────────────────────────────────────────────────────────
# AI Security Advisor — JSON/text report
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_ai_build_number(build_number: str | int) -> str:
    return str(build_number).strip().lstrip("#")


def _normalize_ai_model_name(value: str) -> str:
    model = value.strip().strip('"').strip("'")
    if not model:
        return ""

    gemini_words = re.match(r"(?i)^gemini\s+([0-9][\w.-]*)\s+flash$", model)
    if gemini_words:
        return f"gemini-{gemini_words.group(1).lower()}-flash"

    return model


def _extract_ai_model_from_json(text: str) -> str:
    try:
        data = json.loads(text)
    except (TypeError, json.JSONDecodeError):
        return ""

    if not isinstance(data, dict):
        return ""

    candidates = [
        data.get("model"),
        data.get("ai_model"),
        data.get("actual_model"),
    ]
    context = data.get("context")
    if isinstance(context, dict):
        candidates.extend([
            context.get("model"),
            context.get("ai_model"),
            context.get("actual_model"),
        ])

    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            return _normalize_ai_model_name(candidate)

    return ""


def _extract_ai_model(report_text: str, status_text: str | None) -> str:
    combined_texts = [status_text or "", report_text or ""]

    for text in combined_texts:
        model = _extract_ai_model_from_json(text.strip())
        if model:
            return model

    keys = ["MODEL", "AI_MODEL", "AI Model"]
    for text in combined_texts:
        for key in keys:
            model = _kv(text, key)
            if model:
                return _normalize_ai_model_name(model)

    for text in combined_texts:
        match = re.search(r"(?i)Powered by\s+([^\n]+)", text)
        if match:
            return _normalize_ai_model_name(match.group(1))

        match = re.search(r"\bgemini-[A-Za-z0-9._-]+\b", text, re.IGNORECASE)
        if match:
            return _normalize_ai_model_name(match.group(0))

    return "Unknown"


def _is_ai_error_report(report_text: str) -> bool:
    lower = (report_text or "").lower()
    return any(
        marker in lower
        for marker in [
            "ai security advisor failed",
            "invalid json response from gemini",
            "empty gemini response",
            "timeout has been exceeded",
        ]
    )


def parse_ai_security_report(
    report_text: str,
    status_text: str | None,
    build_number: str | int,
) -> AISecurityReport:
    """Parse the AI Security Advisor artifact and optional status file."""
    report = (report_text or "").strip()
    status_source = status_text or ""

    status_raw = (_kv(status_source, "STATUS") or _kv(report, "STATUS") or "UNKNOWN").upper()
    if _is_ai_error_report(report):
        status = "FAILED"
    elif status_raw in ("PASSED", "FAILED", "SKIPPED", "ERROR"):
        status = "FAILED" if status_raw == "ERROR" else status_raw
    else:
        status = "UNKNOWN"

    return AISecurityReport(
        build_number=_normalize_ai_build_number(build_number),
        status=status,
        model=_extract_ai_model(report, status_source),
        report=report,
    )
