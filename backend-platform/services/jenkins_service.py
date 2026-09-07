import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import requests
from dotenv import load_dotenv


class JenkinsConfigError(Exception):
    pass


class JenkinsTriggerError(Exception):
    pass


def _as_jenkins_bool(value: bool) -> str:
    return "true" if value else "false"


def _normalize_jenkins_choice(value: str) -> str:
    return value.strip().lower().replace("_", "-").replace(" ", "-")


def _format_duration(milliseconds: int | None) -> str:
    if not milliseconds:
        return "0m 00s"

    total_seconds = max(0, int(milliseconds / 1000))
    minutes, seconds = divmod(total_seconds, 60)
    return f"{minutes}m {seconds:02d}s"


def _extract_build_number(build_number: str | int | None) -> int | None:
    if build_number is None:
        return None

    match = re.search(r"\d+", str(build_number))
    if not match:
        return None

    return int(match.group(0))


def _load_jenkins_config() -> dict:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    load_dotenv(dotenv_path=env_path)

    config = {
        "url": os.getenv("JENKINS_URL", "").rstrip("/"),
        "user": os.getenv("JENKINS_USER", ""),
        "api_token": os.getenv("JENKINS_API_TOKEN", ""),
        "job_name": os.getenv("JENKINS_JOB_NAME", "devsecops-pipeline"),
    }

    missing_values = [
        name
        for name, value in {
            "JENKINS_URL": config["url"],
            "JENKINS_USER": config["user"],
            "JENKINS_API_TOKEN": config["api_token"],
            "JENKINS_JOB_NAME": config["job_name"],
        }.items()
        if not value
    ]

    if missing_values:
        raise JenkinsConfigError(
            "Missing Jenkins environment variables: " + ", ".join(missing_values)
        )

    return config


def _build_job_url(config: dict) -> str:
    job_path = "/job/".join(
        quote(part, safe="") for part in config["job_name"].split("/") if part
    )
    return f"{config['url']}/job/{job_path}"


def _clean_jenkins_error(response: requests.Response) -> str:
    detail = response.text.strip()
    if not detail:
        return "No error detail returned."

    content_type = response.headers.get("content-type", "").lower()
    if "html" in content_type:
        detail = re.sub(r"<script[\s\S]*?</script>", " ", detail, flags=re.IGNORECASE)
        detail = re.sub(r"<style[\s\S]*?</style>", " ", detail, flags=re.IGNORECASE)
        detail = re.sub(r"<[^>]+>", " ", detail)
        detail = re.sub(r"\s+", " ", detail).strip()

    return detail[:300] or "No error detail returned."


def _get_jenkins_crumb(config: dict) -> dict:
    try:
        response = requests.get(
            f"{config['url']}/crumbIssuer/api/json",
            auth=(config["user"], config["api_token"]),
            timeout=10,
        )
    except requests.RequestException as exc:
        raise JenkinsTriggerError(
            "Unable to request Jenkins CSRF crumb. Check Jenkins URL and status."
        ) from exc

    if response.status_code == 404:
        return {}

    if not response.ok:
        raise JenkinsTriggerError(
            "Unable to request Jenkins CSRF crumb: "
            f"status {response.status_code}: {_clean_jenkins_error(response)}"
        )

    try:
        crumb_data = response.json()
    except ValueError as exc:
        raise JenkinsTriggerError("Jenkins returned an invalid CSRF crumb response.") from exc

    crumb_field = crumb_data.get("crumbRequestField")
    crumb_value = crumb_data.get("crumb")
    if not crumb_field or not crumb_value:
        raise JenkinsTriggerError("Jenkins CSRF crumb response is missing required fields.")

    return {crumb_field: crumb_value}


def _get_job_json(config: dict, tree: str) -> dict:
    try:
        response = requests.get(
            f"{_build_job_url(config)}/api/json",
            params={"tree": tree},
            auth=(config["user"], config["api_token"]),
            timeout=10,
        )
    except requests.RequestException as exc:
        raise JenkinsTriggerError("Unable to query Jenkins job metadata.") from exc

    if not response.ok:
        raise JenkinsTriggerError(
            f"Jenkins job metadata returned status {response.status_code}: "
            f"{_clean_jenkins_error(response)}"
        )

    try:
        return response.json()
    except ValueError as exc:
        raise JenkinsTriggerError("Jenkins returned invalid job metadata JSON.") from exc


def get_next_build_number() -> int | None:
    config = _load_jenkins_config()
    data = _get_job_json(config, "nextBuildNumber")
    next_build_number = data.get("nextBuildNumber")
    return int(next_build_number) if next_build_number else None


def get_latest_build_number_from_jenkins() -> int | None:
    """Return the number of the most recent build on the Jenkins job."""
    config = _load_jenkins_config()
    data = _get_job_json(config, "lastBuild[number]")
    last_build = data.get("lastBuild") or {}
    number = last_build.get("number")
    return int(number) if number else None


def fetch_jenkins_artifact(build_number: int | str, artifact_path: str) -> str:
    """Download and return the text content of a Jenkins build artifact.

    Args:
        build_number: Jenkins build number (int or string like '#25').
        artifact_path: Relative path inside the build artifacts,
                       e.g. 'reports/test-results.xml'.

    Raises:
        JenkinsConfigError: Jenkins is not configured.
        JenkinsTriggerError: The artifact could not be fetched.
    """
    number = _extract_build_number(build_number)
    if number is None:
        raise JenkinsTriggerError(f"Invalid build number: {build_number!r}")

    config = _load_jenkins_config()
    url = f"{_build_job_url(config)}/{number}/artifact/{artifact_path}"

    try:
        response = requests.get(
            url,
            auth=(config["user"], config["api_token"]),
            timeout=15,
        )
    except requests.RequestException as exc:
        raise JenkinsTriggerError(
            f"Unable to fetch Jenkins artifact '{artifact_path}': {exc}"
        ) from exc

    if response.status_code == 404:
        raise JenkinsTriggerError(
            f"Artifact not found in build #{number}: '{artifact_path}'. "
            "Make sure the Jenkins pipeline archives this file."
        )

    if not response.ok:
        raise JenkinsTriggerError(
            f"Jenkins artifact fetch failed (status {response.status_code}): "
            f"{_clean_jenkins_error(response)}"
        )

    return response.text


def fetch_jenkins_console_log(build_number: int | str) -> str:
    """Fetch raw console output text for a Jenkins build."""
    number = _extract_build_number(build_number)
    if number is None:
        return "No build number provided."

    try:
        config = _load_jenkins_config()
    except JenkinsConfigError as exc:
        return f"Jenkins configuration error: {exc}"

    url = f"{_build_job_url(config)}/{number}/consoleText"

    try:
        response = requests.get(
            url,
            auth=(config["user"], config["api_token"]),
            timeout=10,
        )
        if response.ok:
            return response.text
        return f"Jenkins returned status {response.status_code} while fetching console logs."
    except requests.RequestException as exc:
        return f"Unable to fetch Jenkins console log: {exc}"


def trigger_jenkins_pipeline(
    git_url: str,
    branch: str,
    language: str,
    run_tests: bool,
    run_quality: bool,
    run_security: bool,
    run_ai: bool,
    deploy_env: str,
    dependency_audit: bool = True,
    secret_detection: bool = True,
    run_sast: bool = True,
    run_docker_build: bool = True,
    run_container_scan: bool = True,
    run_sbom: bool = True,
    push_image: bool = True,
    sign_image: bool = True,
) -> dict:
    config = _load_jenkins_config()
    expected_build_number = get_next_build_number()
    build_url = f"{_build_job_url(config)}/buildWithParameters"

    jenkins_parameters = {
        "GIT_URL":            git_url,
        "BRANCH":             branch,
        "LANGUAGE":           _normalize_jenkins_choice(language),
        # Top-level toggles
        "RUN_TESTS":          _as_jenkins_bool(run_tests),
        "RUN_QUALITY":        _as_jenkins_bool(run_quality),
        "RUN_SECURITY":       _as_jenkins_bool(run_security),
        "RUN_AI":             _as_jenkins_bool(run_ai),
        # Granular stage toggles
        "RUN_SONAR":          _as_jenkins_bool(run_quality),        # SonarQube follows run_quality
        "RUN_SAST":           _as_jenkins_bool(run_sast and run_security),
        "RUN_DEPENDENCY":     _as_jenkins_bool(dependency_audit),
        "RUN_SECRET":         _as_jenkins_bool(secret_detection),
        "RUN_DOCKER_BUILD":   _as_jenkins_bool(run_docker_build),
        "RUN_CONTAINER_SCAN": _as_jenkins_bool(run_container_scan and run_security),
        "RUN_SBOM":           _as_jenkins_bool(run_sbom),
        # Publish & sign
        "PUSH_IMAGE":         _as_jenkins_bool(push_image),
        "SIGN_IMAGE":         _as_jenkins_bool(sign_image and push_image),
        # Environment
        "DEPLOY_ENV":         _normalize_jenkins_choice(deploy_env),
    }

    try:
        response = requests.post(
            build_url,
            data=jenkins_parameters,
            headers=_get_jenkins_crumb(config),
            auth=(config["user"], config["api_token"]),
            timeout=15,
        )
    except requests.RequestException as exc:
        raise JenkinsTriggerError(
            "Unable to connect to Jenkins. Check JENKINS_URL and Jenkins status."
        ) from exc

    if response.status_code not in (200, 201, 202):
        raise JenkinsTriggerError(
            f"Jenkins returned status {response.status_code}: {_clean_jenkins_error(response)}"
        )

    return {
        "message": "Jenkins pipeline triggered successfully",
        "job_name": config["job_name"],
        "status": "triggered",
        "build_number": f"#{expected_build_number}" if expected_build_number else None,
        "queue_url": response.headers.get("Location"),
    }


def get_jenkins_build_status(build_number: str | int | None) -> dict | None:
    number = _extract_build_number(build_number)
    if number is None:
        return None

    config = _load_jenkins_config()
    tree = "number,url,building,result,duration,timestamp"

    try:
        response = requests.get(
            f"{_build_job_url(config)}/{number}/api/json",
            params={"tree": tree},
            auth=(config["user"], config["api_token"]),
            timeout=10,
        )
    except requests.RequestException:
        return None

    if response.status_code == 404:
        return None

    if not response.ok:
        raise JenkinsTriggerError(
            f"Jenkins build status returned status {response.status_code}: "
            f"{_clean_jenkins_error(response)}"
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise JenkinsTriggerError("Jenkins returned invalid build status JSON.") from exc

    building = bool(data.get("building"))
    result = data.get("result")
    timestamp = data.get("timestamp") or 0
    duration = data.get("duration") or 0

    if building:
        elapsed_ms = max(0, int(datetime.now(timezone.utc).timestamp() * 1000) - int(timestamp))
        progress = min(95, max(10, int((elapsed_ms / 180000) * 90)))
        status = "RUNNING"
        duration_label = _format_duration(elapsed_ms)
    else:
        progress = 100
        status = "SUCCESS" if result == "SUCCESS" else "FAILED" if result else "UNKNOWN"
        if result == "ABORTED":
            status = "ABORTED"
        duration_label = _format_duration(int(duration))

    stages = [
        "Validate Parameters",
        "Checkout",
        "Detect Language",
        "Build",
        "Run Tests",
        "Code Quality",
        "SonarQube Analysis",
        "SonarQube Quality Gate",
        "SAST",
        "Dependency Scan",
        "Secret Scan",
        "Docker Build",
        "Container Scan",
        "Generate SBOM",
        "AI Security Advisor",
        "Prepare Policy Input",
        "Test Security Policies",
        "Policy as Code",
        "Deployment Decision",
        "Publish Image",
        "Resolve Image Digest",
        "Sign Image",
        "Verify Signature",
        "Production Approval",
        "Deploy",
        "Generate Audit Trail",
        "Generate Pipeline Summary",
    ]
    stage_index = min(len(stages) - 1, max(0, int((progress / 100) * len(stages))))
    current_stage = "Deployment Decision" if progress == 100 else stages[stage_index]

    return {
        "build_number": f"#{data.get('number', number)}",
        "status": status,
        "progress": progress,
        "current_stage": current_stage,
        "duration": duration_label,
        "url": data.get("url"),
        "result": result,
    }