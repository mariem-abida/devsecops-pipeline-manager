# Sample Python App — DevSecOps Pipeline Test Project

This is a minimal **Flask** application used to test the DevSecOps CI/CD pipeline.

## Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | Index |
| GET | `/health` | Health check (used by Docker Compose) |
| GET | `/api/users` | List users |
| GET | `/api/status` | App status |

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000/health

## Run tests

```bash
pytest -v
```

## Docker

```bash
docker build -t sample-python-app:latest .
docker run -p 5000:5000 sample-python-app:latest
```

## Pipeline stages tested

- ✅ Build (Python venv)
- ✅ Tests (pytest)
- ✅ Code Quality (flake8)
- ✅ SonarQube
- ✅ SAST (Semgrep)
- ✅ Dependency Scan (pip-audit)
- ✅ Secret Scan (Gitleaks)
- ✅ Docker Build (multi-stage)
- ✅ Container Scan (Trivy)
- ✅ SBOM (Syft/CycloneDX)
- ✅ OPA Policy Evaluation
- ✅ Image Signing (Cosign)
- ✅ Deploy (Docker Compose IaC)
