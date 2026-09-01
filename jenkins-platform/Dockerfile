FROM jenkins/jenkins:lts

USER root

ARG DOCKER_COMPOSE_VERSION=5.5.0
ARG TRIVY_VERSION=0.74.0
ARG SYFT_VERSION=1.51.1
ARG COSIGN_VERSION=3.1.3
ARG OPA_VERSION=1.19.1
ARG GITLEAKS_VERSION=8.21.2

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        docker-cli \
        docker.io \
        git \
        gzip \
        nodejs \
        npm \
        python3 \
        python3-pip \
        python3-venv \
        tar \
        unzip \
    && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    mkdir -p /usr/local/lib/docker/cli-plugins; \
    curl -fsSL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose; \
    chmod 0755 /usr/local/lib/docker/cli-plugins/docker-compose; \
    ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

RUN python3 -m pip install --no-cache-dir --break-system-packages "semgrep==1.175.0"

RUN set -eux; \
    curl -fsSL "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" -o /tmp/trivy.tar.gz; \
    tar -xzf /tmp/trivy.tar.gz -C /tmp trivy; \
    install -m 0755 /tmp/trivy /usr/local/bin/trivy; \
    rm -f /tmp/trivy /tmp/trivy.tar.gz

RUN set -eux; \
    curl -fsSL "https://github.com/anchore/syft/releases/download/v${SYFT_VERSION}/syft_${SYFT_VERSION}_linux_amd64.tar.gz" -o /tmp/syft.tar.gz; \
    tar -xzf /tmp/syft.tar.gz -C /tmp syft; \
    install -m 0755 /tmp/syft /usr/local/bin/syft; \
    rm -f /tmp/syft /tmp/syft.tar.gz

RUN set -eux; \
    curl -fsSL "https://github.com/sigstore/cosign/releases/download/v${COSIGN_VERSION}/cosign-linux-amd64" -o /usr/local/bin/cosign; \
    chmod 0755 /usr/local/bin/cosign

RUN set -eux; \
    curl -fsSL "https://github.com/open-policy-agent/opa/releases/download/v${OPA_VERSION}/opa_linux_amd64_static" -o /usr/local/bin/opa; \
    chmod 0755 /usr/local/bin/opa

RUN set -eux; \
    curl -fsSL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" -o /tmp/gitleaks.tar.gz; \
    tar -xzf /tmp/gitleaks.tar.gz -C /tmp gitleaks; \
    install -m 0755 /tmp/gitleaks /usr/local/bin/gitleaks; \
    rm -f /tmp/gitleaks /tmp/gitleaks.tar.gz

RUN node --version \
    && npm --version \
    && python3 --version \
    && docker --version \
    && docker compose version \
    && git --version \
    && semgrep --version \
    && trivy --version \
    && syft version \
    && cosign version \
    && opa version \
    && gitleaks version