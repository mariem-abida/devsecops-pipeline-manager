"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  AlertCircle,
  Save,
  TestTube,
  AlertTriangle,
  Loader2,
  RotateCw,
} from "lucide-react"
import {
  getSettings,
  updateSettings,
  type PlatformSettings,
} from "@/services/api"

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Replace mock settings when backend settings endpoints are ready.
// Remove MOCK_DEFAULTS and dataSource === "fallback" logic once
// GET /settings and PUT /settings are implemented in the FastAPI backend.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DEFAULTS: PlatformSettings = {
  jenkins: {
    url: "http://localhost:8080",
    job_name: "devsecops-pipeline",
    username: "admin",
    api_token: "",
    build_timeout: "15",
  },
  gitlab: {
    url: "https://gitlab.com",
    default_branch: "main",
    access_method: "Existing Jenkins Credential",
    credential_id: "gitlab-private-token",
  },
  quality: {
    enable_sonarqube: true,
    sonarqube_url: "http://localhost:9000",
    sonar_project_key_prefix: "devsecops-",
    quality_gate_policy: "Block deployment if Quality Gate fails",
  },
  security: {
    enable_gitleaks: true,
    enable_semgrep: true,
    enable_dependency_audit: true,
    block_critical_vulnerabilities: true,
    block_secrets_detected: true,
  },
  ai: {
    enable_ai_recommendations: true,
    ai_provider: "API Provider",
    recommendation_level: "Detailed recommendations",
    send_full_code: false,
    send_reports_only: true,
  },
  deployment: {
    deploy_only_if_tests_pass: true,
    deploy_only_if_quality_gate_passes: true,
    block_critical_security_issues: true,
    block_if_secrets_detected: true,
    require_manual_approval: true,
  },
  preferences: {
    default_language: "Python",
    default_environment: "Test",
    report_format: "Web Report",
    pipeline_refresh_interval: "10",
  },
}

// Static — only shown until a health endpoint is available
const SYSTEM_STATUS_STATIC = [
  { name: "Jenkins",            status: "Connected" },
  { name: "GitLab",            status: "Connected" },
  { name: "SonarQube",         status: "Connected" },
  { name: "Gitleaks",          status: "Ready" },
  { name: "Semgrep",           status: "Ready" },
  { name: "Dependency Audit",  status: "Ready" },
  { name: "AI Recommendations", status: "Enabled" },
]

const SECURITY_TOOLS_STATIC = [
  { tool: "Gitleaks",                purpose: "Secret Detection",              status: "Enabled" },
  { tool: "Semgrep",                 purpose: "Static Security Analysis",       status: "Enabled" },
  { tool: "pip-audit",               purpose: "Python Dependency Audit",        status: "Enabled" },
  { tool: "npm audit",               purpose: "JavaScript Dependency Audit",    status: "Enabled" },
  { tool: "OWASP Dependency-Check",  purpose: "Java Dependency Audit",          status: "Enabled" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  if (["Connected", "Ready", "Enabled"].includes(status)) return "bg-green-500/20 text-green-400"
  return "bg-neutral-500/20 text-neutral-300"
}

function getStatusIcon(status: string) {
  if (["Connected", "Ready", "Enabled"].includes(status))
    return <CheckCircle className="w-4 h-4" />
  return <AlertCircle className="w-4 h-4" />
}

// ─── Save helpers ─────────────────────────────────────────────────────────────

/**
 * Attempt PUT /settings. Falls back to a mock success toast when the endpoint
 * returns 404 / 501.
 * NOTE: api_token is never logged.
 */
async function trySave(
  section: string,
  payload: Partial<PlatformSettings>,
  setSaving: (v: boolean) => void,
) {
  setSaving(true)
  try {
    await updateSettings(payload)
    toast.success(`${section} saved`, { description: "Settings updated successfully." })
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message ?? ""
    const isNotReady = msg.includes("404") || msg.includes("501") || msg.includes("422")
    if (isNotReady) {
      // TODO: Replace mock settings when backend settings endpoints are ready.
      toast.success(`${section} saved (preview)`, {
        description: "Backend endpoint not yet available — changes are local only.",
      })
    } else {
      toast.error(`Failed to save ${section}`, { description: "Please try again." })
    }
  } finally {
    setSaving(false)
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  type DataSource = "backend" | "fallback"

  const [dataSource, setDataSource] = useState<DataSource>("fallback")
  const [initLoading, setInitLoading] = useState(true)

  // ── Section-level saving spinners
  const [savingJenkins,     setSavingJenkins]     = useState(false)
  const [savingGitlab,      setSavingGitlab]      = useState(false)
  const [savingQuality,     setSavingQuality]     = useState(false)
  const [savingSecurity,    setSavingSecurity]    = useState(false)
  const [savingAI,          setSavingAI]          = useState(false)
  const [savingDeployment,  setSavingDeployment]  = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)

  // ── Jenkins
  const [jenkinsUrl,      setJenkinsUrl]      = useState(MOCK_DEFAULTS.jenkins.url)
  const [jenkinsJobName,  setJenkinsJobName]  = useState(MOCK_DEFAULTS.jenkins.job_name)
  const [jenkinsUsername, setJenkinsUsername] = useState(MOCK_DEFAULTS.jenkins.username)
  const [jenkinsToken,    setJenkinsToken]    = useState("") // never pre-filled
  const [jenkinsTimeout,  setJenkinsTimeout]  = useState(MOCK_DEFAULTS.jenkins.build_timeout)

  // ── GitLab
  const [gitlabUrl,          setGitlabUrl]          = useState(MOCK_DEFAULTS.gitlab.url)
  const [defaultBranch,      setDefaultBranch]      = useState(MOCK_DEFAULTS.gitlab.default_branch)
  const [gitlabAccessMethod, setGitlabAccessMethod] = useState(MOCK_DEFAULTS.gitlab.access_method)
  const [gitlabCredentialId, setGitlabCredentialId] = useState(MOCK_DEFAULTS.gitlab.credential_id)

  // ── Quality
  const [enableSonarQube,        setEnableSonarQube]        = useState(MOCK_DEFAULTS.quality.enable_sonarqube)
  const [sonarQubeUrl,           setSonarQubeUrl]           = useState(MOCK_DEFAULTS.quality.sonarqube_url)
  const [sonarProjectKeyPrefix,  setSonarProjectKeyPrefix]  = useState(MOCK_DEFAULTS.quality.sonar_project_key_prefix)
  const [qualityGatePolicy,      setQualityGatePolicy]      = useState(MOCK_DEFAULTS.quality.quality_gate_policy)

  // ── Security
  const [enableGitleaks,              setEnableGitleaks]              = useState(MOCK_DEFAULTS.security.enable_gitleaks)
  const [enableSemgrep,               setEnableSemgrep]               = useState(MOCK_DEFAULTS.security.enable_semgrep)
  const [enableDependencyAudit,       setEnableDependencyAudit]       = useState(MOCK_DEFAULTS.security.enable_dependency_audit)
  const [blockCriticalVulnerabilities,setBlockCriticalVulnerabilities]= useState(MOCK_DEFAULTS.security.block_critical_vulnerabilities)
  const [blockSecretsDetected,        setBlockSecretsDetected]        = useState(MOCK_DEFAULTS.security.block_secrets_detected)

  // ── AI
  const [enableAIRecommendations, setEnableAIRecommendations] = useState(MOCK_DEFAULTS.ai.enable_ai_recommendations)
  const [aiProvider,               setAiProvider]               = useState(MOCK_DEFAULTS.ai.ai_provider)
  const [recommendationLevel,      setRecommendationLevel]      = useState(MOCK_DEFAULTS.ai.recommendation_level)
  const [sendFullCode,             setSendFullCode]             = useState(MOCK_DEFAULTS.ai.send_full_code)
  const [sendReportsOnly,          setSendReportsOnly]          = useState(MOCK_DEFAULTS.ai.send_reports_only)

  // ── Deployment
  const [deployOnlyIfTestsPass,        setDeployOnlyIfTestsPass]        = useState(MOCK_DEFAULTS.deployment.deploy_only_if_tests_pass)
  const [deployOnlyIfQualityGatePasses,setDeployOnlyIfQualityGatePasses]= useState(MOCK_DEFAULTS.deployment.deploy_only_if_quality_gate_passes)
  const [blockCriticalSecurityIssues,  setBlockCriticalSecurityIssues]  = useState(MOCK_DEFAULTS.deployment.block_critical_security_issues)
  const [blockIfSecretsDetected,       setBlockIfSecretsDetected]       = useState(MOCK_DEFAULTS.deployment.block_if_secrets_detected)
  const [requireManualApproval,        setRequireManualApproval]        = useState(MOCK_DEFAULTS.deployment.require_manual_approval)

  // ── Preferences
  const [defaultLanguage,         setDefaultLanguage]         = useState(MOCK_DEFAULTS.preferences.default_language)
  const [defaultEnvironment,      setDefaultEnvironment]      = useState(MOCK_DEFAULTS.preferences.default_environment)
  const [reportFormat,            setReportFormat]            = useState(MOCK_DEFAULTS.preferences.report_format)
  const [pipelineRefreshInterval, setPipelineRefreshInterval] = useState(MOCK_DEFAULTS.preferences.pipeline_refresh_interval)

  // ── Validation errors per section
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ─── Load settings from backend on mount ────────────────────────────────────
  const applySettings = useCallback((s: PlatformSettings) => {
    setJenkinsUrl(s.jenkins.url)
    setJenkinsJobName(s.jenkins.job_name)
    setJenkinsUsername(s.jenkins.username)
    // api_token intentionally NOT pre-filled for security
    setJenkinsTimeout(s.jenkins.build_timeout)

    setGitlabUrl(s.gitlab.url)
    setDefaultBranch(s.gitlab.default_branch)
    setGitlabAccessMethod(s.gitlab.access_method)
    setGitlabCredentialId(s.gitlab.credential_id)

    setEnableSonarQube(s.quality.enable_sonarqube)
    setSonarQubeUrl(s.quality.sonarqube_url)
    setSonarProjectKeyPrefix(s.quality.sonar_project_key_prefix)
    setQualityGatePolicy(s.quality.quality_gate_policy)

    setEnableGitleaks(s.security.enable_gitleaks)
    setEnableSemgrep(s.security.enable_semgrep)
    setEnableDependencyAudit(s.security.enable_dependency_audit)
    setBlockCriticalVulnerabilities(s.security.block_critical_vulnerabilities)
    setBlockSecretsDetected(s.security.block_secrets_detected)

    setEnableAIRecommendations(s.ai.enable_ai_recommendations)
    setAiProvider(s.ai.ai_provider)
    setRecommendationLevel(s.ai.recommendation_level)
    setSendFullCode(s.ai.send_full_code)
    setSendReportsOnly(s.ai.send_reports_only)

    setDeployOnlyIfTestsPass(s.deployment.deploy_only_if_tests_pass)
    setDeployOnlyIfQualityGatePasses(s.deployment.deploy_only_if_quality_gate_passes)
    setBlockCriticalSecurityIssues(s.deployment.block_critical_security_issues)
    setBlockIfSecretsDetected(s.deployment.block_if_secrets_detected)
    setRequireManualApproval(s.deployment.require_manual_approval)

    setDefaultLanguage(s.preferences.default_language)
    setDefaultEnvironment(s.preferences.default_environment)
    setReportFormat(s.preferences.report_format)
    setPipelineRefreshInterval(s.preferences.pipeline_refresh_interval)
  }, [])

  useEffect(() => {
    async function loadSettings() {
      setInitLoading(true)
      try {
        const data = await getSettings()
        applySettings(data)
        setDataSource("backend")
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? ""
        const isNotReady = msg.includes("404") || msg.includes("501") || msg.includes("422")
        if (isNotReady) {
          // TODO: Replace mock settings when backend settings endpoints are ready.
          // Silently use mock defaults — no toast needed
          setDataSource("fallback")
        } else {
          toast.error("Could not load settings", {
            description: "Using default values. Backend may be unavailable.",
          })
          setDataSource("fallback")
        }
      } finally {
        setInitLoading(false)
      }
    }
    loadSettings()
  }, [applySettings])

  // ─── Per-section field validation ─────────────────────────────────────────

  function validateJenkins(): boolean {
    if (!jenkinsUrl.trim()) {
      setErrors(e => ({ ...e, jenkinsUrl: "Jenkins URL is required." }))
      return false
    }
    setErrors(e => { const n = { ...e }; delete n.jenkinsUrl; return n })
    return true
  }

  function validateGitlab(): boolean {
    if (!gitlabUrl.trim()) {
      setErrors(e => ({ ...e, gitlabUrl: "GitLab URL is required." }))
      return false
    }
    setErrors(e => { const n = { ...e }; delete n.gitlabUrl; return n })
    return true
  }

  // ─── Save handlers ─────────────────────────────────────────────────────────

  function handleSaveJenkins() {
    if (!validateJenkins()) return
    // api_token: only include if user typed a new value — never log it
    const payload: Partial<PlatformSettings> = {
      jenkins: {
        url: jenkinsUrl,
        job_name: jenkinsJobName,
        username: jenkinsUsername,
        ...(jenkinsToken ? { api_token: jenkinsToken } : {}),
        build_timeout: jenkinsTimeout,
      },
    }
    trySave("Jenkins Settings", payload, setSavingJenkins)
  }

  function handleSaveGitlab() {
    if (!validateGitlab()) return
    trySave("GitLab Settings", {
      gitlab: {
        url: gitlabUrl,
        default_branch: defaultBranch,
        access_method: gitlabAccessMethod,
        credential_id: gitlabCredentialId,
      },
    }, setSavingGitlab)
  }

  function handleSaveQuality() {
    trySave("Quality Settings", {
      quality: {
        enable_sonarqube: enableSonarQube,
        sonarqube_url: sonarQubeUrl,
        sonar_project_key_prefix: sonarProjectKeyPrefix,
        quality_gate_policy: qualityGatePolicy,
      },
    }, setSavingQuality)
  }

  function handleSaveSecurity() {
    trySave("Security Settings", {
      security: {
        enable_gitleaks: enableGitleaks,
        enable_semgrep: enableSemgrep,
        enable_dependency_audit: enableDependencyAudit,
        block_critical_vulnerabilities: blockCriticalVulnerabilities,
        block_secrets_detected: blockSecretsDetected,
      },
    }, setSavingSecurity)
  }

  function handleSaveAI() {
    trySave("AI Settings", {
      ai: {
        enable_ai_recommendations: enableAIRecommendations,
        ai_provider: aiProvider,
        recommendation_level: recommendationLevel,
        send_full_code: sendFullCode,
        send_reports_only: sendReportsOnly,
      },
    }, setSavingAI)
  }

  function handleSaveDeployment() {
    trySave("Deployment Rules", {
      deployment: {
        deploy_only_if_tests_pass: deployOnlyIfTestsPass,
        deploy_only_if_quality_gate_passes: deployOnlyIfQualityGatePasses,
        block_critical_security_issues: blockCriticalSecurityIssues,
        block_if_secrets_detected: blockIfSecretsDetected,
        require_manual_approval: requireManualApproval,
      },
    }, setSavingDeployment)
  }

  function handleSavePreferences() {
    trySave("Preferences", {
      preferences: {
        default_language: defaultLanguage,
        default_environment: defaultEnvironment,
        report_format: reportFormat,
        pipeline_refresh_interval: pipelineRefreshInterval,
      },
    }, setSavingPreferences)
  }

  // ─── Loading spinner (initial load only) ──────────────────────────────────

  if (initLoading) {
    return (
      <div className="p-6 space-y-6 bg-neutral-950 min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SETTINGS</h1>
          <p className="text-sm text-neutral-400">Configure Jenkins, GitLab, analysis tools, deployment rules, and platform preferences</p>
        </div>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm text-neutral-400">Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Full settings page ────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 bg-neutral-950 min-h-screen">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wider">SETTINGS</h1>
        <p className="text-sm text-neutral-400">Configure Jenkins, GitLab, analysis tools, deployment rules, and platform preferences</p>
      </div>

      {/* ── Fallback indicator ── */}
      {dataSource === "fallback" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-500">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Settings endpoint not yet available — changes will be local only until the backend is ready.
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-neutral-500 hover:text-neutral-300 h-6 px-2"
            onClick={() => window.location.reload()}
          >
            <RotateCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* ── Jenkins Configuration ── */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white tracking-wider">JENKINS CONFIGURATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">JENKINS BASE URL</label>
              <input
                type="text"
                value={jenkinsUrl}
                onChange={(e) => setJenkinsUrl(e.target.value)}
                className={`w-full bg-neutral-800 border text-white px-3 py-2 rounded ${errors.jenkinsUrl ? "border-red-500" : "border-neutral-700"}`}
                placeholder="http://localhost:8080"
              />
              {errors.jenkinsUrl && <p className="text-xs text-red-500 mt-1">{errors.jenkinsUrl}</p>}
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">JENKINS JOB NAME</label>
              <input
                type="text"
                value={jenkinsJobName}
                onChange={(e) => setJenkinsJobName(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
                placeholder="devsecops-pipeline"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">JENKINS USERNAME</label>
              <input
                type="text"
                value={jenkinsUsername}
                onChange={(e) => setJenkinsUsername(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">JENKINS API TOKEN</label>
              {/* password type — never pre-filled, never logged */}
              <input
                type="password"
                value={jenkinsToken}
                onChange={(e) => setJenkinsToken(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
                placeholder="••••••••••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">DEFAULT BUILD TIMEOUT</label>
              <input
                type="text"
                value={jenkinsTimeout}
                onChange={(e) => setJenkinsTimeout(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
                placeholder="15 minutes"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-neutral-300">Jenkins Connection: <span className="text-green-400 font-semibold">Connected</span></span>
            </div>
            <div className="flex gap-2">
              <Button className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600">
                <TestTube className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSaveJenkins}
                disabled={savingJenkins}
              >
                {savingJenkins
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Save className="w-4 h-4 mr-2" />}
                Save Jenkins Settings
              </Button>
            </div>
          </div>
          <p className="text-xs text-neutral-500 pt-2">Jenkins credentials should be stored securely and never exposed in logs.</p>
        </CardContent>
      </Card>

      {/* ── GitLab Configuration ── */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white tracking-wider">GITLAB CONFIGURATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">GITLAB BASE URL</label>
              <input
                type="text"
                value={gitlabUrl}
                onChange={(e) => setGitlabUrl(e.target.value)}
                className={`w-full bg-neutral-800 border text-white px-3 py-2 rounded ${errors.gitlabUrl ? "border-red-500" : "border-neutral-700"}`}
                placeholder="https://gitlab.com"
              />
              {errors.gitlabUrl && <p className="text-xs text-red-500 mt-1">{errors.gitlabUrl}</p>}
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">DEFAULT BRANCH</label>
              <input
                type="text"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
                placeholder="main"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">PRIVATE REPOSITORY ACCESS METHOD</label>
              <select
                value={gitlabAccessMethod}
                onChange={(e) => setGitlabAccessMethod(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
              >
                <option>Existing Jenkins Credential</option>
                <option>SSH Key configured in Jenkins</option>
                <option>GitLab Deploy Token</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">DEFAULT JENKINS CREDENTIAL ID</label>
              <input
                type="text"
                value={gitlabCredentialId}
                onChange={(e) => setGitlabCredentialId(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
                placeholder="gitlab-private-token"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-neutral-300">GitLab Connection: <span className="text-green-400 font-semibold">Connected</span></span>
            </div>
            <div className="flex gap-2">
              <Button className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600">
                <TestTube className="w-4 h-4 mr-2" />
                Test GitLab Access
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSaveGitlab}
                disabled={savingGitlab}
              >
                {savingGitlab
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Save className="w-4 h-4 mr-2" />}
                Save GitLab Settings
              </Button>
            </div>
          </div>
          <p className="text-xs text-neutral-500 pt-2">For private repositories, use Jenkins Credentials or SSH keys instead of storing tokens directly in the application.</p>
        </CardContent>
      </Card>

      {/* ── Code Quality Configuration ── */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white tracking-wider">CODE QUALITY CONFIGURATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={enableSonarQube}
                onChange={(e) => setEnableSonarQube(e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm text-white">Enable SonarQube Analysis</label>
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">SONARQUBE URL</label>
              <input
                type="text"
                value={sonarQubeUrl}
                onChange={(e) => setSonarQubeUrl(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
                placeholder="http://localhost:9000"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">SONARQUBE PROJECT KEY PREFIX</label>
              <input
                type="text"
                value={sonarProjectKeyPrefix}
                onChange={(e) => setSonarProjectKeyPrefix(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
                placeholder="devsecops-"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">QUALITY GATE POLICY</label>
              <select
                value={qualityGatePolicy}
                onChange={(e) => setQualityGatePolicy(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
              >
                <option>Block deployment if Quality Gate fails</option>
                <option>Allow deployment with warning</option>
                <option>Manual approval required</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-neutral-300">SonarQube: <span className="text-green-400 font-semibold">Connected</span></span>
            </div>
            <div className="flex gap-2">
              <Button className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600">
                <TestTube className="w-4 h-4 mr-2" />
                Test SonarQube Connection
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSaveQuality}
                disabled={savingQuality}
              >
                {savingQuality
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Save className="w-4 h-4 mr-2" />}
                Save Quality Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Security Configuration ── */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white tracking-wider">SECURITY CONFIGURATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={enableGitleaks}              onChange={(e) => setEnableGitleaks(e.target.checked)}              className="w-4 h-4" />
              <label className="text-sm text-white">Enable Gitleaks Secret Detection</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={enableSemgrep}               onChange={(e) => setEnableSemgrep(e.target.checked)}               className="w-4 h-4" />
              <label className="text-sm text-white">Enable Semgrep SAST Scan</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={enableDependencyAudit}       onChange={(e) => setEnableDependencyAudit(e.target.checked)}       className="w-4 h-4" />
              <label className="text-sm text-white">Enable Dependency Audit</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={blockCriticalVulnerabilities} onChange={(e) => setBlockCriticalVulnerabilities(e.target.checked)} className="w-4 h-4" />
              <label className="text-sm text-white">Block deployment on critical vulnerabilities</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={blockSecretsDetected}        onChange={(e) => setBlockSecretsDetected(e.target.checked)}        className="w-4 h-4" />
              <label className="text-sm text-white">Block deployment if secrets are detected</label>
            </div>
          </div>

          {/* Security Tools Table */}
          <div className="pt-6 border-t border-neutral-700">
            <h3 className="text-sm font-semibold text-white mb-3">SECURITY TOOLS STATUS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left px-4 py-2 text-neutral-400 font-semibold">Tool</th>
                    <th className="text-left px-4 py-2 text-neutral-400 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-2 text-neutral-400 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SECURITY_TOOLS_STATIC.map((tool, idx) => (
                    <tr key={idx} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                      <td className="px-4 py-2 text-white">{tool.tool}</td>
                      <td className="px-4 py-2 text-neutral-300">{tool.purpose}</td>
                      <td className="px-4 py-2">
                        <Badge className={getStatusColor(tool.status)}>{tool.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4">
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSaveSecurity}
              disabled={savingSecurity}
            >
              {savingSecurity
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Save className="w-4 h-4 mr-2" />}
              Save Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── AI Recommendation Settings ── */}
      <Card className="bg-neutral-900 border-neutral-700 opacity-90">
        <CardHeader>
          <CardTitle className="text-white tracking-wider">AI RECOMMENDATION SETTINGS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={enableAIRecommendations} onChange={(e) => setEnableAIRecommendations(e.target.checked)} className="w-4 h-4" />
              <label className="text-sm text-white">Enable AI-Assisted Recommendations</label>
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">AI PROVIDER</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
              >
                <option>API Provider</option>
                <option>Open-source local model</option>
                <option>Disabled</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">RECOMMENDATION LEVEL</label>
              <select
                value={recommendationLevel}
                onChange={(e) => setRecommendationLevel(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
              >
                <option>Summary only</option>
                <option>Detailed recommendations</option>
                <option>Priority-based action plan</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={sendFullCode}    onChange={(e) => setSendFullCode(e.target.checked)}    className="w-4 h-4" />
              <label className="text-sm text-white">Send Full Code to AI</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={sendReportsOnly} onChange={(e) => setSendReportsOnly(e.target.checked)} className="w-4 h-4" />
              <label className="text-sm text-white">Send Reports Only</label>
            </div>
          </div>
          <p className="text-xs text-neutral-500 pt-2">For security reasons, the AI module should analyze reports instead of sending full source code whenever possible.</p>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSaveAI}
            disabled={savingAI}
          >
            {savingAI
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Save className="w-4 h-4 mr-2" />}
            Save AI Settings
          </Button>
        </CardContent>
      </Card>

      {/* ── Deployment Rules ── */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white tracking-wider">DEPLOYMENT RULES</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={deployOnlyIfTestsPass}         onChange={(e) => setDeployOnlyIfTestsPass(e.target.checked)}         className="w-4 h-4" />
              <label className="text-sm text-white">Deploy only if tests pass</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={deployOnlyIfQualityGatePasses} onChange={(e) => setDeployOnlyIfQualityGatePasses(e.target.checked)} className="w-4 h-4" />
              <label className="text-sm text-white">Deploy only if Quality Gate passes</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={blockCriticalSecurityIssues}   onChange={(e) => setBlockCriticalSecurityIssues(e.target.checked)}   className="w-4 h-4" />
              <label className="text-sm text-white">Block deployment on critical security issues</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={blockIfSecretsDetected}        onChange={(e) => setBlockIfSecretsDetected(e.target.checked)}        className="w-4 h-4" />
              <label className="text-sm text-white">Block deployment if secrets are detected</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={requireManualApproval}         onChange={(e) => setRequireManualApproval(e.target.checked)}         className="w-4 h-4" />
              <label className="text-sm text-white">Require manual approval for production simulation</label>
            </div>
          </div>

          <div className="bg-neutral-800 border border-neutral-700 rounded p-4 mt-4">
            <h3 className="text-sm font-semibold text-white mb-2">CURRENT DEPLOYMENT POLICY</h3>
            <p className="text-sm text-neutral-300">
              Deployment is allowed only when tests pass, the quality gate is valid, and no critical security issue is detected.
            </p>
          </div>

          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSaveDeployment}
            disabled={savingDeployment}
          >
            {savingDeployment
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Save className="w-4 h-4 mr-2" />}
            Save Deployment Rules
          </Button>
        </CardContent>
      </Card>

      {/* ── Platform Preferences ── */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white tracking-wider">PLATFORM PREFERENCES</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">DEFAULT LANGUAGE</label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
              >
                <option>Python</option>
                <option>JavaScript</option>
                <option>Java</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">DEFAULT ENVIRONMENT</label>
              <select
                value={defaultEnvironment}
                onChange={(e) => setDefaultEnvironment(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
              >
                <option>Test</option>
                <option>Staging</option>
                <option>Production Simulation</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">REPORT FORMAT</label>
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
              >
                <option>Web Report</option>
                <option>PDF Report</option>
                <option>JSON Report</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 tracking-wider block mb-2">PIPELINE REFRESH INTERVAL</label>
              <select
                value={pipelineRefreshInterval}
                onChange={(e) => setPipelineRefreshInterval(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 rounded"
              >
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="30">30 seconds</option>
              </select>
            </div>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSavePreferences}
            disabled={savingPreferences}
          >
            {savingPreferences
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Save className="w-4 h-4 mr-2" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* ── System Status (static until health endpoint available) ── */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white tracking-wider">SYSTEM STATUS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {SYSTEM_STATUS_STATIC.map((item, idx) => (
              <div key={idx} className="bg-neutral-800 border border-neutral-700 rounded p-3 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(item.status)}
                  <span className="text-xs font-semibold text-white">{item.name}</span>
                </div>
                <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="bg-neutral-900 border-red-900/50">
        <CardHeader>
          <CardTitle className="text-red-500 tracking-wider">DANGER ZONE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-900">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Clear Pipeline History
            </Button>
            <Button className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-900">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reset Platform Settings
            </Button>
            <Button className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-900">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Disable AI Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
