package devsecops

default allow := false

allow if {
    count(deny) == 0
}

deny contains msg if {
    input.tests.enabled == true
    to_number(input.tests.failures) > 0
    msg := sprintf("Unit tests failed: %v failure(s) detected", [input.tests.failures])
}

deny contains msg if {
    input.quality.enabled == true
    input.quality.status == "ERROR"
    msg := "Code quality analysis could not complete"
}

deny contains msg if {
    input.quality.enabled == true
    to_number(input.quality.bugs) > 10
    msg := sprintf("Code quality threshold exceeded: %v bugs (max allowed: 10)", [input.quality.bugs])
}

deny contains msg if {
    input.sonarqube.enabled == true
    input.sonarqube.status != "PASSED"
    msg := sprintf("SonarQube quality gate is not PASSED (status: %v)", [input.sonarqube.status])
}

deny contains msg if {
    input.sast.enabled == true
    input.sast.status != "PASSED"
    msg := sprintf("SAST status is not PASSED (status: %v)", [input.sast.status])
}

deny contains msg if {
    input.sast.enabled == true
    to_number(input.sast.blocking_findings) > 0
    msg := sprintf("SAST detected %v blocking finding(s)", [input.sast.blocking_findings])
}

deny contains msg if {
    input.dependencies.enabled == true
    input.dependencies.status != "PASSED"
    msg := sprintf("Dependency scan status is not PASSED (status: %v)", [input.dependencies.status])
}

deny contains msg if {
    input.dependencies.enabled == true
    to_number(input.dependencies.vulnerabilities) > 0
    msg := sprintf("Dependency scan detected %v vulnerability(ies)", [input.dependencies.vulnerabilities])
}

deny contains msg if {
    input.secrets.enabled == true
    input.secrets.status != "PASSED"
    msg := sprintf("Secret scan status is not PASSED (status: %v)", [input.secrets.status])
}

deny contains msg if {
    input.secrets.enabled == true
    to_number(input.secrets.count) > 0
    msg := sprintf("Secret scan detected %v secret(s)", [input.secrets.count])
}

deny contains msg if {
    input.docker.enabled == true
    input.docker.status != "PASSED"
    msg := sprintf("Docker build status is not PASSED (status: %v)", [input.docker.status])
}

deny contains msg if {
    input.container.enabled == true
    input.container.status == "ERROR"
    msg := "Container scan failed with a Trivy execution or report error"
}

deny contains msg if {
    input.container.enabled == true
    to_number(input.container.critical) > 0
    msg := sprintf("Container image contains %v CRITICAL vulnerability(ies)", [input.container.critical])
}

deny contains msg if {
    input.container.enabled == true
    to_number(input.container.high) >= 5
    msg := sprintf("Container image contains %v HIGH vulnerabilities (max allowed: 4)", [input.container.high])
}

deny contains msg if {
    input.sbom.enabled == true
    input.sbom.status != "PASSED"
    msg := sprintf("SBOM status is not PASSED (status: %v)", [input.sbom.status])
}
