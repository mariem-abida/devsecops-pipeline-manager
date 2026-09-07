// services/api.ts
// Central API service for DevSecOps Pipeline Manager.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000"

export function normalizeBuildNumber(buildNumber: string | number): string {
  return String(buildNumber).trim().replace(/^#/, "")
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unable to connect to backend")
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API error ${response.status}: ${errorText || response.statusText}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export interface HealthStatus {
  backend: string
  database: string
  detail?: string
}

export interface Project {
  id: number
  name: string
  repository_url: string
  branch: string
  language: string
  visibility: string
  access_method: string
  credential_id?: string | null
  description?: string | null
  last_pipeline_status: string
  created_at: string
}

export interface CreateProjectPayload {
  name: string
  repository_url: string
  branch: string
  language: string
  visibility: string
  access_method: string
  credential_id?: string
  description?: string
}

export interface Pipeline {
  id: number
  project_id: number
  build_number: string
  status: string
  progress: number
  current_stage: string
  duration: string
  environment: string
  created_at: string
}

export interface RunPipelinePayload {
  git_url?: string
  project_id?: number
  branch: string
  language: string
  environment?: string
  deploy_env?: string
  run_tests?: boolean
  run_quality?: boolean
  run_security?: boolean
  run_ai?: boolean
  dependency_audit?: boolean
  secret_detection?: boolean
  run_sast?: boolean
  run_docker_build?: boolean
  run_container_scan?: boolean
  run_sbom?: boolean
  generate_ai_suggestions?: boolean
  deploy_if_validated?: boolean
  push_image?: boolean
  sign_image?: boolean
}

export interface PipelineStatus {
  pipeline_id: number
  build_number: string
  status: string
  progress: number
  current_stage: string
  duration: string
  url?: string | null
}

export interface PipelineLogsResponse {
  pipeline_id: number
  build_number: string
  logs: string
}

export interface PipelineResults {
  pipeline_id: number
  build_number: string
  tests: null | {
    total: number
    passed: number
    failed: number
    skipped: number
    status: string
  }
  quality: null | {
    issue_count: number
    status: string
  }
  security: null | {
    vulnerability_count: number
    status: string
  }
  deployment: null | {
    decision: string
  }
}

export interface FailedTest {
  id: number
  name: string
  file: string
  error: string
  severity: string
  duration: string
  status: string
}

export interface PassedCategory {
  name: string
  passed: number
  total: number
}

export interface TestReport {
  pipeline_id?: number | null
  project: string
  branch: string
  language: string
  build_number: string
  framework: string
  status: string
  total_tests: number
  passed: number
  failed: number
  skipped: number
  success_rate: number
  duration: string
  coverage: number
  failed_tests: FailedTest[]
  passed_categories: PassedCategory[]
}

export interface CodeIssue {
  id: number
  type: string
  severity: string
  file: string
  line: number
  description: string
  recommendation: string
}

export interface QualityMetric {
  label: string
  value: string
  icon: string
  color: string
}

export interface IssueDistribution {
  label: string
  count: number
  color: string
}

export interface CodeQualityReport {
  pipeline_id?: number | null
  project: string
  branch: string
  language: string
  build_number: string
  tool: string
  quality_gate: string
  quality_gate_reason: string
  quality_score: number
  bugs: number
  code_smells: number
  vulnerabilities: number
  coverage: number
  duplication: number
  tech_debt: string
  maintainability_rating: string
  security_rating: string
  analysis_duration: string
  last_analysis: string
  summary: string
  deployment_blocked: boolean
  metrics: QualityMetric[]
  issues_distribution: IssueDistribution[]
  code_issues: CodeIssue[]
}

export interface SecurityFinding {
  id: number
  tool: string
  package?: string
  installed_version?: string
  vulnerability_id?: string
  fixed_version?: string
  severity: string
  category: string
  file: string
  line: number
  description: string
  suggestedAction: string
  status: string
}

export interface SecurityToolStatus {
  name: string
  purpose: string
  status: string
  finding: string
  statusColor: string
}

export interface SeverityDistribution {
  label: string
  count: number
  color: string
}

export interface SecurityReport {
  pipeline_id?: number | null
  project: string
  branch: string
  language: string
  build_number: string
  security_status: string
  critical_issues: number
  high_issues: number
  medium_issues: number
  low_issues: number
  secrets_detected: number
  vulnerable_dependencies: number
  tools_used: string
  analysis_duration: string
  last_analysis: string
  summary: string
  deployment_blocked: boolean
  deployment_reason: string
  blocking_issues: string[]
  required_action: string
  tools_status: SecurityToolStatus[]
  severity_distribution: SeverityDistribution[]
  findings: SecurityFinding[]
}

export interface DeploymentDecisionReport {
  pipeline_id?: number | null
  build_number: string
  decision: string
  deployment_blocked: boolean
  main_reason: string
  requirements: string[]
  next_action: string
  raw_content: string
}



export interface Recommendation {
  id: number
  priority: string
  category: string
  problem: string
  explanation: string
  suggestion: string
  relatedTool: string
  deploymentImpact: string
}

export interface ActionStep {
  step: number
  title: string
  items: string[]
}

export interface DeploymentAssistant {
  decision: string
  deployment_blocked: boolean
  main_reason: string
  requirements: string[]
  next_action: string
}

export interface AnalysisContext {
  project: string
  branch: string
  language: string
  build_number: string
  ai_mode: string
  generated_at: string
  reports_analyzed: string[]
}

export interface AIRecommendationsReport {
  pipeline_id: number
  total_recommendations: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  context: AnalysisContext
  recommendations: Recommendation[]
  action_steps: ActionStep[]
  deployment_assistant: DeploymentAssistant
}
export interface AISecurityReport {
  build_number: string
  status: string
  model: string
  report: string
}
export interface JenkinsSettings {
  url: string
  job_name: string
  username: string
  api_token?: string
  build_timeout: string
}

export interface GitLabSettings {
  url: string
  default_branch: string
  access_method: string
  credential_id: string
}

export interface QualitySettings {
  enable_sonarqube: boolean
  sonarqube_url: string
  sonar_project_key_prefix: string
  quality_gate_policy: string
}

export interface SecuritySettings {
  enable_gitleaks: boolean
  enable_semgrep: boolean
  enable_dependency_audit: boolean
  block_critical_vulnerabilities: boolean
  block_secrets_detected: boolean
}

export interface AISettings {
  enable_ai_recommendations: boolean
  ai_provider: string
  recommendation_level: string
  send_full_code: boolean
  send_reports_only: boolean
}

export interface DeploymentRules {
  deploy_only_if_tests_pass: boolean
  deploy_only_if_quality_gate_passes: boolean
  block_critical_security_issues: boolean
  block_if_secrets_detected: boolean
  require_manual_approval: boolean
}

export interface PlatformPreferences {
  default_language: string
  default_environment: string
  report_format: string
  pipeline_refresh_interval: string
}

export interface PlatformSettings {
  jenkins: JenkinsSettings
  gitlab: GitLabSettings
  quality: QualitySettings
  security: SecuritySettings
  ai: AISettings
  deployment: DeploymentRules
  preferences: PlatformPreferences
}

export async function getHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("/health")
}

export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/projects/")
}

export async function getProject(projectId: number): Promise<Project> {
  return apiFetch<Project>(`/projects/${projectId}`)
}

export const getProjectById = getProject

export async function createProject(projectData: CreateProjectPayload): Promise<Project> {
  return apiFetch<Project>("/projects/", {
    method: "POST",
    body: JSON.stringify(projectData),
  })
}

export async function deleteProject(projectId: number): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}`, {
    method: "DELETE",
  })
}

export async function getPipelines(): Promise<Pipeline[]> {
  return apiFetch<Pipeline[]>("/pipelines/")
}

export async function getPipeline(pipelineId: number): Promise<Pipeline> {
  return apiFetch<Pipeline>(`/pipelines/${pipelineId}`)
}

export const getPipelineById = getPipeline

export async function runPipeline(pipelineData: RunPipelinePayload): Promise<Pipeline> {
  return apiFetch<Pipeline>("/pipelines/run", {
    method: "POST",
    body: JSON.stringify(pipelineData),
  })
}

export async function getPipelineStatus(pipelineId: number): Promise<PipelineStatus> {
  return apiFetch<PipelineStatus>(`/pipelines/${pipelineId}/status`)
}

export async function getPipelineLogs(pipelineId: number): Promise<PipelineLogsResponse> {
  return apiFetch<PipelineLogsResponse>(`/pipelines/${pipelineId}/logs`)
}

export async function getLatestPipelineStatus(): Promise<PipelineStatus> {
  return apiFetch<PipelineStatus>("/pipelines/latest/status")
}

export async function getPipelineResults(pipelineId: number): Promise<PipelineResults> {
  return apiFetch<PipelineResults>(`/pipelines/${pipelineId}/results`)
}

export async function getTestResults(buildNumber: string | number): Promise<TestReport> {
  return apiFetch<TestReport>(`/reports/${normalizeBuildNumber(buildNumber)}/tests`)
}

export async function getCodeQualityResults(buildNumber: string | number): Promise<CodeQualityReport> {
  return apiFetch<CodeQualityReport>(`/reports/${normalizeBuildNumber(buildNumber)}/quality`)
}

export async function getSecurityResults(buildNumber: string | number): Promise<SecurityReport> {
  return apiFetch<SecurityReport>(`/reports/${normalizeBuildNumber(buildNumber)}/security`)
}

export async function getDeploymentDecision(buildNumber: string | number): Promise<DeploymentDecisionReport> {
  return apiFetch<DeploymentDecisionReport>(`/reports/${normalizeBuildNumber(buildNumber)}/deployment`)
}

export async function getAIRecommendations(
  buildNumber: string | number
): Promise<AIRecommendationsReport> {
  const response = await apiFetch<AISecurityReport>(
    `/reports/${normalizeBuildNumber(buildNumber)}/ai`
  )

  if (response.status !== "PASSED") {
    throw new Error(`AI Advisor status: ${response.status}`)
  }

  const parsed = JSON.parse(response.report) as AIRecommendationsReport

  return parsed
}

export async function getSettings(): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>("/settings")
}

export async function updateSettings(data: Partial<PlatformSettings>): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SBOM Report
// ─────────────────────────────────────────────────────────────────────────────

export interface SBOMComponent {
  name: string
  version: string
  type: string
  purl: string
  licenses: string[]
}

export interface SBOMTypeDistribution {
  label: string
  count: number
}

export interface SBOMLicense {
  license: string
  count: number
}

export interface SBOMReport {
  pipeline_id?: number | null
  build_number: string
  status: string
  tool: string
  format: string
  image: string
  component_count: number
  components: SBOMComponent[]
  type_distribution: SBOMTypeDistribution[]
  licenses: SBOMLicense[]
}

export async function getSBOMReport(buildNumber: string | number): Promise<SBOMReport> {
  return apiFetch<SBOMReport>(`/reports/${normalizeBuildNumber(buildNumber)}/sbom`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Compliance (OPA) Report
// ─────────────────────────────────────────────────────────────────────────────

export interface PolicyRule {
  rule: string
  description: string
  status: "PASSED" | "FAILED" | "SKIPPED" | string
  details: string
}

export interface ComplianceReport {
  pipeline_id?: number | null
  build_number: string
  status: string
  tool: string
  policy_file: string
  denial_count: number
  denials: string[]
  rules: PolicyRule[]
  policy_input: Record<string, unknown>
  deployment_allowed: boolean
}

export async function getComplianceReport(buildNumber: string | number): Promise<ComplianceReport> {
  return apiFetch<ComplianceReport>(`/reports/${normalizeBuildNumber(buildNumber)}/compliance`)
}
