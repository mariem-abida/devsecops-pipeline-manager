# ─────────────────────────────────────────────────────
# Dockerfile — Sample Python Flask App
# DevSecOps Pipeline Test Project
# ─────────────────────────────────────────────────────

# Stage 1: Builder
FROM python:3.13-alpine AS builder

WORKDIR /app

# Install dependencies in a virtual environment
COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip --no-cache-dir && \
    /opt/venv/bin/pip install -r requirements.txt --no-cache-dir

# Stage 2: Runtime (minimal image)
FROM python:3.13-alpine AS runtime

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application source
COPY app.py .

# Create non-root user for security
RUN adduser -D appuser
USER appuser

# Use venv python
ENV PATH="/opt/venv/bin:$PATH"

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "2", "--timeout", "30", "app:app"]