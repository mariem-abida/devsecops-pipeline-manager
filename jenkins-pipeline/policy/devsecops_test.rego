package devsecops_test

import data.devsecops

clean_input := {
    "tests": {"enabled": true, "status": "PASSED", "failures": 0},
    "quality": {"enabled": true, "status": "PASSED", "bugs": 2},
    "sonarqube": {"enabled": true, "status": "PASSED", "quality_gate": "OK"},
    "sast": {"enabled": true, "status": "PASSED", "total_findings": 0, "blocking_findings": 0},
    "dependencies": {"enabled": true, "status": "PASSED", "vulnerabilities": 0},
    "secrets": {"enabled": true, "status": "PASSED", "count": 0},
    "docker": {"enabled": true, "status": "PASSED", "image": "sample-python-app:1"},
    "container": {"enabled": true, "status": "PASSED", "critical": 0, "high": 1},
    "sbom": {"enabled": true, "status": "PASSED", "components": 12},
    "environment": "test",
    "project": "sample-python-app"
}

test_healthy_project_is_allowed if {
    devsecops.allow with input as clean_input
}

test_healthy_project_has_no_denials if {
    count(devsecops.deny) == 0 with input as clean_input
}

test_tests_failed_is_denied if {
    inp := object.union(clean_input, {
        "tests": {"enabled": true, "status": "FAILED", "failures": 1}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_secret_detected_is_denied if {
    inp := object.union(clean_input, {
        "secrets": {"enabled": true, "status": "FAILED", "count": 1}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_critical_container_vulnerability_is_denied if {
    inp := object.union(clean_input, {
        "container": {"enabled": true, "status": "FAILED", "critical": 1, "high": 0}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_high_container_threshold_is_denied if {
    inp := object.union(clean_input, {
        "container": {"enabled": true, "status": "FAILED", "critical": 0, "high": 5}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_container_scan_error_is_denied if {
    inp := object.union(clean_input, {
        "container": {"enabled": true, "status": "ERROR", "critical": 0, "high": 0}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_sonarqube_not_passed_is_denied if {
    inp := object.union(clean_input, {
        "sonarqube": {"enabled": true, "status": "FAILED", "quality_gate": "ERROR"}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_dependency_vulnerability_is_denied if {
    inp := object.union(clean_input, {
        "dependencies": {"enabled": true, "status": "FAILED", "vulnerabilities": 1}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_sbom_error_is_denied if {
    inp := object.union(clean_input, {
        "sbom": {"enabled": true, "status": "ERROR", "components": 0}
    })
    count(devsecops.deny) > 0 with input as inp
}

test_disabled_scan_does_not_block if {
    inp := object.union(clean_input, {
        "container": {"enabled": false, "status": "ERROR", "critical": 99, "high": 99}
    })
    devsecops.allow with input as inp
}
