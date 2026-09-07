package devsecops

# ─────────────────────────────────────────────────────────────────────────────
# DevSecOps Pipeline — Security Policy v1.0
# Source of truth for all Quality Gate thresholds.
# Edit this file to change security rules. Every change is tracked in Git.
#
# Usage:
#   opa eval --data policy/devsecops.rego \
#            --input reports/security-policy-input.json \
#            'data.devsecops.deny'
# ─────────────────────────────────────────────────────────────────────────────

default allow := false

# ── Allow only if there are zero denial reasons ───────────────────────────
allow if {
    count(deny) == 0
}

# ─────────────────────────────────────────────────────────────────────────────
# UNIT TESTS
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.tests.enabled == true
    to_number(input.tests.failures) > 0
    msg := sprintf(
        "Unit tests failed: %v failure(s) detected",
        [input.tests.failures]
    )
}

# ─────────────────────────────────────────────────────────────────────────────
# CODE QUALITY
# Threshold: max 10 bugs tolerated
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.quality.enabled == true
    to_number(input.quality.bugs) > 10
    msg := sprintf(
        "Code quality threshold exceeded: %v bugs (max allowed: 10)",
        [input.quality.bugs]
    )
}

# ─────────────────────────────────────────────────────────────────────────────
# SAST (Static Application Security Testing)
# Any blocking finding (HIGH/CRITICAL) → deny
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.sast.enabled == true
    to_number(input.sast.blocking_findings) > 0
    msg := sprintf(
        "SAST detected %v blocking finding(s) (HIGH/CRITICAL severity)",
        [input.sast.blocking_findings]
    )
}

# ─────────────────────────────────────────────────────────────────────────────
# DEPENDENCY SCAN (SCA)
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.dependencies.enabled == true
    input.dependencies.status == "FAILED"
    msg := sprintf(
        "Dependency scan failed: %v vulnerable package(s) detected",
        [input.dependencies.vulnerabilities]
    )
}

deny contains msg if {
    input.dependencies.enabled == true
    input.dependencies.status == "ERROR"
    msg := "Dependency scan could not complete (tool error) — deployment blocked for safety"
}

# ─────────────────────────────────────────────────────────────────────────────
# SECRET SCAN
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.secrets.enabled == true
    to_number(input.secrets.count) > 0
    msg := sprintf(
        "Secret scan detected %v secret(s) in Git history",
        [input.secrets.count]
    )
}

deny contains msg if {
    input.secrets.enabled == true
    input.secrets.status == "ERROR"
    msg := "Secret scan could not complete (tool error) — deployment blocked for safety"
}

# ─────────────────────────────────────────────────────────────────────────────
# DOCKER BUILD
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.docker.enabled == true
    input.docker.status != "PASSED"
    msg := sprintf(
        "Docker image build failed (status: %v)",
        [input.docker.status]
    )
}

# ─────────────────────────────────────────────────────────────────────────────
# CONTAINER SCAN (Trivy)
# Thresholds: CRITICAL > 0 → deny | HIGH >= 5 → deny
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.container.enabled == true
    to_number(input.container.critical) > 0
    msg := sprintf(
        "Container image contains %v CRITICAL vulnerability(ies) — zero tolerance",
        [input.container.critical]
    )
}

deny contains msg if {
    input.container.enabled == true
    to_number(input.container.high) >= 5
    msg := sprintf(
        "Container image contains %v HIGH vulnerabilities (max allowed: 4)",
        [input.container.high]
    )
}

deny contains msg if {
    input.container.enabled == true
    input.container.status == "ERROR"
    msg := "Container security scan could not complete (Trivy error) — deployment blocked for safety"
}

# ─────────────────────────────────────────────────────────────────────────────
# SBOM — traceability required for all deployments
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.sbom.enabled == true
    input.sbom.status != "PASSED"
    msg := sprintf(
        "SBOM generation failed (status: %v) — supply chain traceability required",
        [input.sbom.status]
    )
}

# ─────────────────────────────────────────────────────────────────────────────
# COSIGN SIGNATURE — supply-chain security
# ─────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.signature.sign_status != "PASSED"
    input.signature.sign_status != "SKIPPED"
    msg := sprintf(
        "Container image signing failed (status: %v)",
        [input.signature.sign_status]
    )
}

deny contains msg if {
    input.signature.verify_status != "PASSED"
    input.signature.verify_status != "SKIPPED"
    msg := sprintf(
        "Container image signature verification failed (status: %v)",
        [input.signature.verify_status]
    )
}
