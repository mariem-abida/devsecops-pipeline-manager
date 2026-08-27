package devsecops_test

import data.devsecops

# ─────────────────────────────────────────────────────────────────────────────
# Helpers — reusable clean / failing input templates
# ─────────────────────────────────────────────────────────────────────────────

clean_input := {
    "tests":        {"enabled": true,  "failures": 0},
    "quality":      {"enabled": true,  "bugs": 2},
    "sast":         {"enabled": true,  "blocking_findings": 0},
    "dependencies": {"enabled": true,  "status": "PASSED", "vulnerabilities": 0},
    "secrets":      {"enabled": true,  "status": "PASSED", "count": 0},
    "docker":       {"enabled": true,  "status": "PASSED"},
    "container":    {"enabled": true,  "status": "PASSED", "critical": 0, "high": 1},
    "sbom":         {"enabled": true,  "status": "PASSED"},
    "signature":    {"sign_status": "PASSED", "verify_status": "PASSED"},
    "environment":  "test"
}

# ─────────────────────────────────────────────────────────────────────────────
# ✅ ALLOW — clean pipeline should be allowed
# ─────────────────────────────────────────────────────────────────────────────
test_allow_clean_pipeline if {
    devsecops.allow with input as clean_input
}

test_no_denials_on_clean_pipeline if {
    count(devsecops.deny) == 0 with input as clean_input
}

# ─────────────────────────────────────────────────────────────────────────────
# ❌ DENY — unit test failures
# ─────────────────────────────────────────────────────────────────────────────
test_deny_on_test_failures if {
    inp := object.union(clean_input, {
        "tests": {"enabled": true, "failures": 3}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_allow_with_tests_disabled if {
    inp := object.union(clean_input, {
        "tests": {"enabled": false, "failures": 99}
    })
    devsecops.allow with input as inp
}

# ─────────────────────────────────────────────────────────────────────────────
# ❌ DENY — code quality
# ─────────────────────────────────────────────────────────────────────────────
test_deny_on_quality_exceeded if {
    inp := object.union(clean_input, {
        "quality": {"enabled": true, "bugs": 11}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_allow_quality_at_threshold if {
    inp := object.union(clean_input, {
        "quality": {"enabled": true, "bugs": 10}
    })
    devsecops.allow with input as inp
}

# ─────────────────────────────────────────────────────────────────────────────
# ❌ DENY — SAST blocking findings
# ─────────────────────────────────────────────────────────────────────────────
test_deny_on_sast_findings if {
    inp := object.union(clean_input, {
        "sast": {"enabled": true, "blocking_findings": 1}
    })
    count(devsecops.deny) > 0 with input as inp
}

# ─────────────────────────────────────────────────────────────────────────────
# ❌ DENY — dependency scan
# ─────────────────────────────────────────────────────────────────────────────
test_deny_on_dependency_failed if {
    inp := object.union(clean_input, {
        "dependencies": {"enabled": true, "status": "FAILED", "vulnerabilities": 5}
    })
    count(devsecops.deny) > 0 with input as inp
}

# ─────────────────────────────────────────────────────────────────────────────
# ❌ DENY — secrets found
# ─────────────────────────────────────────────────────────────────────────────
test_deny_on_secrets_found if {
    inp := object.union(clean_input, {
        "secrets": {"enabled": true, "status": "FAILED", "count": 2}
    })
    count(devsecops.deny) > 0 with input as inp
}

# ─────────────────────────────────────────────────────────────────────────────
# ❌ DENY — container CRITICAL vulnerability
# ─────────────────────────────────────────────────────────────────────────────
test_deny_on_critical_cve if {
    inp := object.union(clean_input, {
        "container": {"enabled": true, "status": "PASSED", "critical": 1, "high": 0}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_deny_on_high_cve_threshold if {
    inp := object.union(clean_input, {
        "container": {"enabled": true, "status": "PASSED", "critical": 0, "high": 5}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_allow_high_cve_below_threshold if {
    inp := object.union(clean_input, {
        "container": {"enabled": true, "status": "PASSED", "critical": 0, "high": 4}
    })
    devsecops.allow with input as inp
}

# ─────────────────────────────────────────────────────────────────────────────
# ❌ DENY — SBOM missing
# ─────────────────────────────────────────────────────────────────────────────
test_deny_on_sbom_failed if {
    inp := object.union(clean_input, {
        "sbom": {"enabled": true, "status": "FAILED"}
    })
    count(devsecops.deny) > 0 with input as inp
}

# ─────────────────────────────────────────────────────────────────────────────
# ❌ DENY — signature failures
# ─────────────────────────────────────────────────────────────────────────────
test_deny_on_sign_failed if {
    inp := object.union(clean_input, {
        "signature": {"sign_status": "FAILED", "verify_status": "SKIPPED"}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_deny_on_verify_failed if {
    inp := object.union(clean_input, {
        "signature": {"sign_status": "PASSED", "verify_status": "FAILED"}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_allow_signature_skipped if {
    inp := object.union(clean_input, {
        "signature": {"sign_status": "SKIPPED", "verify_status": "SKIPPED"}
    })
    devsecops.allow with input as inp
}
