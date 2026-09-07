#!/usr/bin/env python3
"""
AI Security Advisor — DevSecOps Pipeline
=========================================
Reads security scan reports from the pipeline and uses Google Gemini
to generate a professional security analysis with recommendations.

Usage:
    python ai_security_advisor.py \
        --sast       reports/sast-report.json \
        --dependency reports/dependency-report.json \
        --container  reports/container-scan-report.json \
        --sbom       reports/sbom.cdx.json \
        --output     reports/ai-security-report.md \
        --project    sample-python-app \
        --build      80

Environment variables:
    GEMINI_API_KEY  — Google Gemini API key (from Jenkins Credentials)
"""

import argparse
import json
import os
import re
import sys
import textwrap
from datetime import datetime, timezone
from pathlib import Path


AI_REPORT_REQUIRED_FIELDS = [
    "total_recommendations",
    "critical_count",
    "high_count",
    "medium_count",
    "low_count",
    "recommendations",
    "action_steps",
    "deployment_assistant",
]

AI_RECOMMENDATION_REQUIRED_FIELDS = [
    "id",
    "priority",
    "category",
    "problem",
    "explanation",
    "suggestion",
    "relatedTool",
    "deploymentImpact",
]

AI_ACTION_STEP_REQUIRED_FIELDS = ["step", "title", "items"]

AI_DEPLOYMENT_ASSISTANT_REQUIRED_FIELDS = [
    "decision",
    "deployment_blocked",
    "main_reason",
    "requirements",
    "next_action",
]

AI_RECOMMENDATIONS_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "propertyOrdering": AI_REPORT_REQUIRED_FIELDS,
    "properties": {
        "total_recommendations": {"type": "integer"},
        "critical_count": {"type": "integer"},
        "high_count": {"type": "integer"},
        "medium_count": {"type": "integer"},
        "low_count": {"type": "integer"},
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "propertyOrdering": AI_RECOMMENDATION_REQUIRED_FIELDS,
                "properties": {
                    "id": {"type": "integer"},
                    "priority": {"type": "string"},
                    "category": {"type": "string"},
                    "problem": {"type": "string"},
                    "explanation": {"type": "string"},
                    "suggestion": {"type": "string"},
                    "relatedTool": {"type": "string"},
                    "deploymentImpact": {"type": "string"},
                },
                "required": AI_RECOMMENDATION_REQUIRED_FIELDS,
            },
        },
        "action_steps": {
            "type": "array",
            "items": {
                "type": "object",
                "propertyOrdering": AI_ACTION_STEP_REQUIRED_FIELDS,
                "properties": {
                    "step": {"type": "integer"},
                    "title": {"type": "string"},
                    "items": {"type": "array", "items": {"type": "string"}},
                },
                "required": AI_ACTION_STEP_REQUIRED_FIELDS,
            },
        },
        "deployment_assistant": {
            "type": "object",
            "propertyOrdering": AI_DEPLOYMENT_ASSISTANT_REQUIRED_FIELDS,
            "properties": {
                "decision": {"type": "string"},
                "deployment_blocked": {"type": "boolean"},
                "main_reason": {"type": "string"},
                "requirements": {"type": "array", "items": {"type": "string"}},
                "next_action": {"type": "string"},
            },
            "required": AI_DEPLOYMENT_ASSISTANT_REQUIRED_FIELDS,
        },
    },
    "required": AI_REPORT_REQUIRED_FIELDS,
}


GEMINI_REQUEST_TIMEOUT_MS = 60_000
FALLBACK_RETRY_DELAY_SECONDS = 5
GEMINI_MODEL_PLAN = [
    ("gemini-3.7-flash", 1),
    ("gemini-3.6-flash", 1),
    ("gemini-3.5-flash", 1),
    ("gemini-3.1-flash-lite", 1),
]


# ─────────────────────────────────────────────────────────────────────────────
# Argument parsing
# ─────────────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(description="AI Security Advisor powered by Google Gemini")
    parser.add_argument("--sast",       default="reports/sast-report.json")
    parser.add_argument("--dependency", default="reports/dependency-report.json")
    parser.add_argument("--container",  default="reports/container-scan-report.json")
    parser.add_argument("--sbom",       default="reports/sbom.cdx.json")
    parser.add_argument("--output",     default="reports/ai-security-report.md")
    parser.add_argument("--project",    default="unknown-project")
    parser.add_argument("--build",      default="0")
    parser.add_argument("--env",        default="test")
    return parser.parse_args()


# ─────────────────────────────────────────────────────────────────────────────
# Report loaders
# ─────────────────────────────────────────────────────────────────────────────

def load_json(path: str) -> dict | list | None:
    """Safely load a JSON file, return None if missing or invalid."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"  [WARN] Report not found: {path}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"  [WARN] Invalid JSON in {path}: {e}", file=sys.stderr)
        return None


def summarize_sast(data) -> dict:
    """Extract key metrics from Semgrep JSON report."""
    if not data or not isinstance(data, dict):
        return {"total": 0, "high": 0, "medium": 0, "low": 0, "findings": []}

    results = data.get("results", [])
    findings = []
    counts = {"ERROR": 0, "WARNING": 0, "INFO": 0}

    for r in results:
        severity = r.get("extra", {}).get("severity", "INFO").upper()
        counts[severity] = counts.get(severity, 0) + 1
        findings.append({
            "rule":     r.get("check_id", "unknown"),
            "severity": severity,
            "message":  r.get("extra", {}).get("message", "")[:200],
            "file":     r.get("path", ""),
            "line":     r.get("start", {}).get("line", 0),
        })

    return {
        "total":    len(results),
        "high":     counts.get("ERROR", 0),
        "medium":   counts.get("WARNING", 0),
        "low":      counts.get("INFO", 0),
        "findings": findings[:10],
    }


def summarize_dependency(data) -> dict:
    """Extract key metrics from pip-audit JSON report."""
    if not data or not isinstance(data, list):
        return {"total_packages": 0, "vulnerable": 0, "vulns": []}

    vulnerable = []
    for pkg in data:
        vulns = pkg.get("vulns", [])
        if vulns:
            for v in vulns:
                vulnerable.append({
                    "package": pkg.get("name", ""),
                    "version": pkg.get("version", ""),
                    "cve":     v.get("id", ""),
                    "fix":     v.get("fix_versions", []),
                    "desc":    v.get("description", "")[:150],
                })

    return {
        "total_packages": len(data),
        "vulnerable":     len(vulnerable),
        "vulns":          vulnerable[:10],
    }


def summarize_container(data) -> dict:
    """Extract key metrics from Trivy JSON report."""
    if not data or not isinstance(data, dict):
        return {"critical": 0, "high": 0, "medium": 0, "total": 0, "vulns": []}

    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    vulns_list = []

    for result in data.get("Results", []):
        for v in result.get("Vulnerabilities", []) or []:
            sev = v.get("Severity", "UNKNOWN").upper()
            counts[sev] = counts.get(sev, 0) + 1
            if sev in ("CRITICAL", "HIGH"):
                vulns_list.append({
                    "id":       v.get("VulnerabilityID", ""),
                    "pkg":      v.get("PkgName", ""),
                    "version":  v.get("InstalledVersion", ""),
                    "fix":      v.get("FixedVersion", "none"),
                    "severity": sev,
                    "title":    v.get("Title", "")[:120],
                })

    return {
        "critical": counts["CRITICAL"],
        "high":     counts["HIGH"],
        "medium":   counts["MEDIUM"],
        "total":    sum(counts.values()),
        "vulns":    vulns_list[:10],
    }


def summarize_sbom(data) -> dict:
    """Extract key metrics from CycloneDX SBOM."""
    if not data or not isinstance(data, dict):
        return {"components": 0, "languages": []}

    components = data.get("components", [])
    langs = set()
    for c in components:
        for prop in c.get("properties", []):
            if "language" in prop.get("name", "").lower():
                langs.add(prop.get("value", ""))

    return {
        "components": len(components),
        "languages":  list(langs) or ["python"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Prompt builder
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt(project: str, build: str, env: str,
                 sast: dict, dep: dict, container: dict, sbom: dict) -> str:
    """Build a structured prompt for the Gemini model."""

    sast_detail = "\n".join(
        f"  - [{f['severity']}] {f['rule']} in {f['file']}:{f['line']} — {f['message']}"
        for f in sast["findings"]
    ) or "  No findings."

    dep_detail = "\n".join(
        f"  - {v['package']}=={v['version']} | {v['cve']} | Fix: {v['fix']} | {v['desc']}"
        for v in dep["vulns"]
    ) or "  No vulnerable packages."

    container_detail = "\n".join(
        f"  - [{v['severity']}] {v['id']} in {v['pkg']}@{v['version']} → fix: {v['fix']} | {v['title']}"
        for v in container["vulns"]
    ) or "  No critical/high vulnerabilities."

    json_output_example = textwrap.dedent("""
    {
      "total_recommendations": 8,
      "critical_count": 2,
      "high_count": 3,
      "medium_count": 2,
      "low_count": 1,
      "recommendations": [
        {
          "id": 1,
          "priority": "Critical",
          "category": "Security",
          "problem": "Short description of the problem",
          "explanation": "Detailed explanation",
          "suggestion": "Actionable suggestion to fix",
          "relatedTool": "Semgrep",
          "deploymentImpact": "Blocks deployment"
        }
      ],
      "action_steps": [
        {
          "step": 1,
          "title": "Fix blocking security issues",
          "items": ["Remove exposed token"]
        }
      ],
      "deployment_assistant": {
        "decision": "Deployment Blocked",
        "deployment_blocked": true,
        "main_reason": "Critical security findings detected",
        "requirements": ["No critical vulnerabilities"],
        "next_action": "Fix critical security issues"
      }
    }
    """).strip()

    return textwrap.dedent(f"""
    You are a senior DevSecOps security engineer analyzing the results of an automated CI/CD security pipeline.

    ## Context
    - Project   : {project}
    - Build     : #{build}
    - Environment: {env}
    - SBOM      : {sbom['components']} components detected
    - Timestamp : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}

    ## Security Scan Results

    ### 1. SAST (Semgrep Static Analysis)
    - Total findings : {sast['total']}
    - High (ERROR)   : {sast['high']}
    - Medium (WARN)  : {sast['medium']}
    - Low (INFO)     : {sast['low']}
    Top findings:
    {sast_detail}

    ### 2. Dependency Scan (pip-audit)
    - Total packages : {dep['total_packages']}
    - Vulnerable     : {dep['vulnerable']}
    Vulnerabilities:
    {dep_detail}

    ### 3. Container Scan (Trivy)
    - CRITICAL : {container['critical']}
    - HIGH     : {container['high']}
    - MEDIUM   : {container['medium']}
    - TOTAL    : {container['total']}
    Critical/High vulnerabilities:
    {container_detail}

    ## Your Task
    Write a professional security analysis report in strict JSON format. Do not use Markdown wrapping (like ```json).
    The JSON must match exactly this structure:
    {json_output_example}

    Be concise, actionable, and professional. Output ONLY valid JSON.
    """).strip()


# ─────────────────────────────────────────────────────────────────────────────
# Gemini API call
# ─────────────────────────────────────────────────────────────────────────────

def build_gemini_generate_config(types):
    return types.GenerateContentConfig(
        max_output_tokens=2048,
        response_mime_type="application/json",
        response_json_schema=AI_RECOMMENDATIONS_RESPONSE_SCHEMA,
    )


def _gemini_error_code(exc):
    code = getattr(exc, "code", None)
    if code is None:
        response = getattr(exc, "response", None)
        code = getattr(response, "status_code", None)
    try:
        return int(code) if code is not None else None
    except (TypeError, ValueError):
        return None


def _is_request_timeout(exc) -> bool:
    if isinstance(exc, TimeoutError):
        return True
    error_name = type(exc).__name__.lower()
    message = str(exc).lower()
    return (
        "timeout" in error_name
        or "timed out" in message
        or "request timeout" in message
    )


def _is_retryable_gemini_error(exc) -> bool:
    if _is_request_timeout(exc):
        return True
    return _gemini_error_code(exc) in {429, 500, 502, 503, 504}


def _format_gemini_error(exc) -> str:
    code = _gemini_error_code(exc)
    code_part = f" HTTP {code}" if code is not None else ""
    message = redact_sensitive_diagnostic_text(str(exc)).strip()
    message_part = f": {message}" if message else ""
    return f"{type(exc).__name__}{code_part}{message_part}"


def call_gemini(prompt: str, api_key: str) -> tuple[str, str]:
    """
    Call Gemini with bounded retries and model fallback.

    A response is accepted only if it is non-empty, valid JSON,
    and compatible with the expected AI recommendations payload.
    Invalid/truncated JSON triggers the next fallback model.
    """

    import time

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print(
            "[ERROR] google-genai is not installed. "
            "Run: pip install google-genai",
            file=sys.stderr,
        )
        sys.exit(1)

    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=GEMINI_REQUEST_TIMEOUT_MS),
    )
    last_error = None

    for model_index, (model_name, max_attempts) in enumerate(GEMINI_MODEL_PLAN):
        if model_index > 0:
            print(f"  Switching to fallback model {model_name}", file=sys.stderr)

        for attempt in range(1, max_attempts + 1):
            try:
                print(
                    f"  Calling {model_name} (attempt {attempt}/{max_attempts})...",
                    file=sys.stderr,
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=build_gemini_generate_config(types),
                )

                if not response.text or not response.text.strip():
                    last_error = ValueError(f"{model_name} returned an empty response.")
                    print(
                        f"  [WARN] {model_name} returned an empty response. "
                        "Trying next fallback model.",
                        file=sys.stderr,
                    )
                    break

                response_text = response.text.strip()

                try:
                    parse_gemini_json_response(response_text)
                except ValueError as validation_error:
                    last_error = validation_error
                    print(
                        f"  [WARN] {model_name} returned invalid, truncated, "
                        f"or malformed JSON: {validation_error}",
                        file=sys.stderr,
                    )
                    print(
                        "  Trying next fallback model.",
                        file=sys.stderr,
                    )
                    break

                print(
                    f"  Gemini response received from {model_name}.",
                    file=sys.stderr,
                )
                print(
                    f"  Gemini JSON validated successfully from {model_name}.",
                    file=sys.stderr,
                )
                return response_text, model_name

            except Exception as exc:
                last_error = exc

                if not _is_retryable_gemini_error(exc):
                    print(
                        f"  [ERROR] {model_name} non-retryable API error "
                        f"on attempt {attempt}/{max_attempts}: "
                        f"{_format_gemini_error(exc)}",
                        file=sys.stderr,
                    )
                    raise

                if _is_request_timeout(exc):
                    print(
                        f"  [WARN] {model_name} request timeout "
                        f"on attempt {attempt}/{max_attempts}.",
                        file=sys.stderr,
                    )
                else:
                    print(
                        f"  [WARN] {model_name} retryable API error "
                        f"on attempt {attempt}/{max_attempts}: "
                        f"{_format_gemini_error(exc)}",
                        file=sys.stderr,
                    )

                if attempt < max_attempts:
                    print(
                        f"  [WARN] Retrying {model_name} in "
                        f"{FALLBACK_RETRY_DELAY_SECONDS}s...",
                        file=sys.stderr,
                    )
                    time.sleep(FALLBACK_RETRY_DELAY_SECONDS)

        if model_index < len(GEMINI_MODEL_PLAN) - 1:
            continue

    if last_error is not None:
        raise RuntimeError(
            "All Gemini models failed after bounded retries/fallbacks. "
            f"Last error: {redact_sensitive_diagnostic_text(str(last_error))}"
        ) from last_error

    raise RuntimeError("No Gemini models are configured.")


# ─────────────────────────────────────────────────────────────────────────────
# Report writer
# ─────────────────────────────────────────────────────────────────────────────

def _missing_fields(data: dict, required_fields: list[str]) -> list[str]:
    return [field for field in required_fields if field not in data]


def _is_int(value) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _require_string(value, field_path: str) -> None:
    if not isinstance(value, str):
        raise ValueError(f"Invalid Gemini JSON field '{field_path}': expected string")


def _require_string_list(value, field_path: str) -> None:
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ValueError(f"Invalid Gemini JSON field '{field_path}': expected list of strings")


def validate_ai_report_payload(report_data: dict) -> dict:
    """Validate the strict JSON shape consumed by the AI recommendations UI."""
    if not isinstance(report_data, dict):
        raise ValueError("Gemini JSON response must be an object")

    missing = _missing_fields(report_data, AI_REPORT_REQUIRED_FIELDS)
    if missing:
        raise ValueError("Missing required Gemini JSON field(s): " + ", ".join(missing))

    unknown = [field for field in report_data if field not in AI_REPORT_REQUIRED_FIELDS]
    if unknown:
        raise ValueError("Unknown Gemini JSON top-level field(s): " + ", ".join(unknown))

    for field in [
        "total_recommendations",
        "critical_count",
        "high_count",
        "medium_count",
        "low_count",
    ]:
        if not _is_int(report_data[field]):
            raise ValueError(f"Invalid Gemini JSON field '{field}': expected integer")

    recommendations = report_data["recommendations"]
    if not isinstance(recommendations, list):
        raise ValueError("Invalid Gemini JSON field 'recommendations': expected list")
    for index, recommendation in enumerate(recommendations):
        if not isinstance(recommendation, dict):
            raise ValueError(f"Invalid Gemini JSON field 'recommendations[{index}]': expected object")
        missing = _missing_fields(recommendation, AI_RECOMMENDATION_REQUIRED_FIELDS)
        if missing:
            raise ValueError(
                f"Missing required Gemini JSON field(s) in recommendations[{index}]: "
                + ", ".join(missing)
            )
        if not _is_int(recommendation["id"]):
            raise ValueError(f"Invalid Gemini JSON field 'recommendations[{index}].id': expected integer")
        for field in AI_RECOMMENDATION_REQUIRED_FIELDS:
            if field != "id":
                _require_string(recommendation[field], f"recommendations[{index}].{field}")

    action_steps = report_data["action_steps"]
    if not isinstance(action_steps, list):
        raise ValueError("Invalid Gemini JSON field 'action_steps': expected list")
    for index, action_step in enumerate(action_steps):
        if not isinstance(action_step, dict):
            raise ValueError(f"Invalid Gemini JSON field 'action_steps[{index}]': expected object")
        missing = _missing_fields(action_step, AI_ACTION_STEP_REQUIRED_FIELDS)
        if missing:
            raise ValueError(
                f"Missing required Gemini JSON field(s) in action_steps[{index}]: "
                + ", ".join(missing)
            )
        if not _is_int(action_step["step"]):
            raise ValueError(f"Invalid Gemini JSON field 'action_steps[{index}].step': expected integer")
        _require_string(action_step["title"], f"action_steps[{index}].title")
        _require_string_list(action_step["items"], f"action_steps[{index}].items")

    deployment_assistant = report_data["deployment_assistant"]
    if not isinstance(deployment_assistant, dict):
        raise ValueError("Invalid Gemini JSON field 'deployment_assistant': expected object")
    missing = _missing_fields(deployment_assistant, AI_DEPLOYMENT_ASSISTANT_REQUIRED_FIELDS)
    if missing:
        raise ValueError(
            "Missing required Gemini JSON field(s) in deployment_assistant: "
            + ", ".join(missing)
        )
    _require_string(deployment_assistant["decision"], "deployment_assistant.decision")
    if not isinstance(deployment_assistant["deployment_blocked"], bool):
        raise ValueError("Invalid Gemini JSON field 'deployment_assistant.deployment_blocked': expected boolean")
    _require_string(deployment_assistant["main_reason"], "deployment_assistant.main_reason")
    _require_string_list(deployment_assistant["requirements"], "deployment_assistant.requirements")
    _require_string(deployment_assistant["next_action"], "deployment_assistant.next_action")

    return report_data


def redact_sensitive_diagnostic_text(text: str) -> str:
    """Redact obvious secret-like values from diagnostic text."""
    return re.sub(
        r"(?i)((?:api[_-]?key|token|password|secret|credential)\s*[:=]\s*)[^\s,;]+",
        r"\1[REDACTED]",
        text,
    )


def write_raw_gemini_response(output_path: str, response_text: str) -> None:
    """Persist the raw Gemini response for diagnostics without blocking failure handling."""
    try:
        raw_path = Path(output_path).with_name("ai-security-raw-response.txt")
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        raw_path.write_text(
            redact_sensitive_diagnostic_text(response_text or ""),
            encoding="utf-8",
        )
        print(f"  Raw Gemini response written -> {raw_path}", file=sys.stderr)
    except OSError as e:
        print(f"  [WARN] Failed to write raw Gemini response: {e}", file=sys.stderr)


def parse_gemini_json_response(response_text: str) -> dict:
    """Parse Gemini output as strict JSON, allowing only a clean JSON code fence."""
    if not response_text or not response_text.strip():
        raise ValueError("Empty Gemini response")

    clean_json_str = response_text.strip()
    lines = clean_json_str.splitlines()

    if lines and lines[0].strip().lower() == "```json":
        closing_index = len(lines) - 1
        while closing_index > 0 and not lines[closing_index].strip():
            closing_index -= 1
        if lines[closing_index].strip() != "```":
            raise ValueError("Invalid JSON code fence in Gemini response")
        clean_json_str = "\n".join(lines[1:closing_index]).strip()

    try:
        report_data = json.loads(clean_json_str)
        return validate_ai_report_payload(report_data)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid Gemini JSON response: {e}") from e


def write_report(output_path: str, project: str, build: str, env: str,
                 ai_model: str, ai_analysis: str,
                 sast: dict, dep: dict, container: dict):
    """Write the final JSON report compatible with frontend AIRecommendationsReport."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    try:
        report_data = parse_gemini_json_response(ai_analysis)
    except ValueError:
        write_raw_gemini_response(output_path, ai_analysis)
        raise

    report_data["context"] = {
        "project": project,
        "branch": "main",
        "language": "auto",
        "build_number": f"#{build}",
        "ai_mode": "Security Report Interpretation",
        "actual_model": ai_model,
        "generated_at": now,
        "reports_analyzed": [
            "SAST Analysis",
            "Dependency Audit",
            "Container Scan"
        ]
    }

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    print(f"  Report written → {output_path}", file=sys.stderr)


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("[ERROR] GEMINI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    print(f"\n{'='*50}", file=sys.stderr)
    print(f"  AI Security Advisor — Build #{args.build}", file=sys.stderr)
    print(f"  Project: {args.project}", file=sys.stderr)
    print(f"{'='*50}", file=sys.stderr)

    print("  Loading security reports...", file=sys.stderr)
    sast_data      = load_json(args.sast)
    dep_data       = load_json(args.dependency)
    container_data = load_json(args.container)
    sbom_data      = load_json(args.sbom)

    sast      = summarize_sast(sast_data)
    dep       = summarize_dependency(dep_data)
    container = summarize_container(container_data)
    sbom      = summarize_sbom(sbom_data)

    print(f"  SAST findings: {sast['total']}", file=sys.stderr)
    print(f"  Dependency vulns: {dep['vulnerable']}", file=sys.stderr)
    print(f"  Container vulns: {container['critical']} CRITICAL, {container['high']} HIGH", file=sys.stderr)

    prompt = build_prompt(args.project, args.build, args.env, sast, dep, container, sbom)
    try:
        ai_analysis, ai_model = call_gemini(prompt, api_key)
        write_report(
            args.output,
            args.project,
            args.build,
            args.env,
            ai_model,
            ai_analysis,
            sast,
            dep,
            container,
        )
    except Exception as e:
        print(
            f"  [ERROR] AI Security Advisor failed: "
            f"{redact_sensitive_diagnostic_text(str(e))}",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"""
===================================
  🤖  AI SECURITY ADVISOR : DONE
      Model   : {ai_model}
      Report  : {args.output}
===================================""")


if __name__ == "__main__":
    main()
