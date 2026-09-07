"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  AlertCircle,
  Play,
  Save,
  Loader2,
  RefreshCw,
  Activity,
  Check,
  Ban,
  ShieldCheck,
} from "lucide-react"
import {
  getProjects,
  runPipeline,
  type Project,
  type Pipeline,
} from "@/services/api"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /** Callback to navigate to another section; optionally carries the new pipeline ID */
  onNavigate?: (section: string, pipelineId?: number, buildNumber?: string) => void
}

export interface AnalysisOptions {
  runTests: boolean
  codeQuality: boolean
  securityScan: boolean
  dependencyAudit: boolean
  secretDetection: boolean
  aiSuggestions: boolean
  deployIfValidated: boolean
}

export interface PipelineStepDefinition {
  step: number
  name: string
  description: string
  optionKey?: keyof AnalysisOptions
  mandatory?: boolean
}

// ─── 27 Real Pipeline Stages Aligned with Jenkinsfile ─────────────────────────

const pipelineSteps: PipelineStepDefinition[] = [
  { step: 1,  name: "Validate Parameters",        description: "Validate inputs, repository URL, and Git branch configuration.", mandatory: true },
  { step: 2,  name: "Checkout Repository",        description: "Clone the selected target project from GitLab SCM.", mandatory: true },
  { step: 3,  name: "Detect Language",             description: "Auto-detect project language (Python, JavaScript, or Java).", mandatory: true },
  { step: 4,  name: "Build Application",            description: "Install dependencies and compile/prepare build artifacts.", mandatory: true },
  { step: 5,  name: "Run Automated Tests",          description: "Execute unit and integration test suite (pytest / jest / maven).", optionKey: "runTests" },
  { step: 6,  name: "Code Quality Linter",         description: "Run static code linter (flake8 / eslint) for code style compliance.", optionKey: "codeQuality" },
  { step: 7,  name: "SonarQube Analysis",          description: "Perform deep static code quality scan for bugs, code smells & coverage.", optionKey: "codeQuality" },
  { step: 8,  name: "SonarQube Quality Gate",      description: "Wait for SonarQube Quality Gate result (OK / PASSED).", optionKey: "codeQuality" },
  { step: 9,  name: "SAST (Semgrep)",              description: "Run static application security testing rules with Semgrep.", optionKey: "securityScan" },
  { step: 10, name: "Dependency Scan",             description: "Audit third-party package dependencies with pip-audit / npm audit.", optionKey: "dependencyAudit" },
  { step: 11, name: "Secret Scan (Gitleaks)",      description: "Scan repository history for hardcoded tokens, passwords and secrets.", optionKey: "secretDetection" },
  { step: 12, name: "Docker Build",                description: "Build OCI Docker container image with metadata labels.", mandatory: true },
  { step: 13, name: "Container Scan (Trivy)",      description: "Scan Docker container image for OS & package vulnerabilities with Trivy.", optionKey: "securityScan" },
  { step: 14, name: "Generate SBOM",               description: "Produce CycloneDX JSON Software Bill of Materials report.", optionKey: "securityScan" },
  { step: 15, name: "AI Security Advisor",         description: "Generate AI-assisted security recommendations with Gemini.", optionKey: "aiSuggestions" },
  { step: 16, name: "Prepare Policy Input",        description: "Consolidate all scan metrics into JSON for OPA evaluation.", mandatory: true },
  { step: 17, name: "Test Security Policies",      description: "Execute unit tests on Rego policy enforcement rules.", mandatory: true },
  { step: 18, name: "Policy as Code (OPA)",        description: "Evaluate Open Policy Agent (OPA) security deployment rules.", mandatory: true },
  { step: 19, name: "Deployment Decision",          description: "Generate final automated decision (APPROVED or BLOCKED).", mandatory: true },
  { step: 20, name: "Publish Image",               description: "Push validated image to GitLab Container Registry.", optionKey: "deployIfValidated" },
  { step: 21, name: "Resolve Image Digest",        description: "Resolve canonical immutable SHA256 registry digest.", mandatory: true },
  { step: 22, name: "Sign Image (Cosign)",         description: "Sign container image digest with Cosign private key.", optionKey: "deployIfValidated" },
  { step: 23, name: "Verify Signature",            description: "Verify Cosign public key signature on registry image.", optionKey: "deployIfValidated" },
  { step: 24, name: "Production Approval",         description: "Manual gate for production environment deployments.", optionKey: "deployIfValidated" },
  { step: 25, name: "Deploy Container",            description: "Deploy application container via Docker Compose.", optionKey: "deployIfValidated" },
  { step: 26, name: "Generate Audit Trail",        description: "Record compliance audit trail JSON file.", mandatory: true },
  { step: 27, name: "Generate Pipeline Summary",   description: "Generate final build summary and notifications.", mandatory: true },
]

// ─── Analysis Options Mapping ──────────────────────────────────────────────────

const analysisOptionLabels: { key: keyof AnalysisOptions; label: string; stagesText: string }[] = [
  { key: "runTests",         label: "Run Automated Tests",          stagesText: "Stage 5 (pytest / jest / maven)" },
  { key: "codeQuality",      label: "SonarQube & Code Quality",     stagesText: "Stages 6–8 (Linter, SonarQube & Quality Gate)" },
  { key: "securityScan",     label: "SAST & Container Scan (Trivy)",stagesText: "Stages 9, 13, 14 (Semgrep, Trivy & SBOM)" },
  { key: "dependencyAudit",  label: "Dependency Audit (pip-audit)", stagesText: "Stage 10 (Vulnerable package audit)" },
  { key: "secretDetection",  label: "Secret Detection (Gitleaks)",  stagesText: "Stage 11 (Hardcoded credentials scan)" },
  { key: "aiSuggestions",    label: "Generate AI Security Advisor",  stagesText: "Stage 15 (AI recommendations with Gemini)" },
  { key: "deployIfValidated",label: "Deploy Container if Validated",stagesText: "Stages 20, 22–25 (Registry Push & Deploy)" },
]

const DEFAULT_ANALYSIS: AnalysisOptions = {
  runTests:          true,
  codeQuality:       true,
  securityScan:      true,
  dependencyAudit:   true,
  secretDetection:   true,
  aiSuggestions:     true,
  deployIfValidated: false,
}

function formatBuildNumber(buildNumber?: string): string {
  if (!buildNumber) return "N/A"
  return buildNumber.startsWith("#") ? buildNumber : `#${buildNumber}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RunPipelineView({ onNavigate }: Props) {
  // ── Projects state
  const [projects, setProjects]           = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError]   = useState<string | null>(null)

  // ── Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("")
  const [repositoryUrl, setRepositoryUrl]         = useState("")
  const [branch, setBranch]                       = useState("")
  const [language, setLanguage]                   = useState("auto")
  const [environment, setEnvironment]             = useState("test")

  // ── Analysis options
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>(DEFAULT_ANALYSIS)

  // ── Launch state
  const [launching, setLaunching]           = useState(false)
  const [launchError, setLaunchError]       = useState<string | null>(null)
  const [launchedPipeline, setLaunchedPipeline] = useState<Pipeline | null>(null)

  // ─── Fetch projects on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      const data = await getProjects()
      setProjects(data)
      if (data.length > 0) {
        applyProject(data[0])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load projects."
      setProjectsError(msg)
      toast.error("Could not load projects", { description: msg })
    } finally {
      setProjectsLoading(false)
    }
  }

  // ─── Auto-fill fields when project changes ─────────────────────────────────
  function applyProject(project: Project) {
    setSelectedProjectId(project.id)
    setRepositoryUrl(project.repository_url)
    setBranch(project.branch)
    setLanguage(project.language || "auto")
  }

  function handleProjectChange(projectId: string) {
    const id = Number(projectId)
    const project = projects.find((p) => p.id === id)
    if (project) applyProject(project)
  }

  // ─── Toggle analysis option ────────────────────────────────────────────────
  function toggleAnalysisOption(key: keyof AnalysisOptions) {
    setAnalysisOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // ─── Launch pipeline ───────────────────────────────────────────────────────
  async function handleLaunchPipeline() {
    setLaunchError(null)

    // Validation
    if (!selectedProjectId) {
      setLaunchError("Please select a project before launching the pipeline.")
      toast.error("No project selected", { description: "Select a GitLab project from the dropdown." })
      return
    }
    if (!branch.trim()) {
      setLaunchError("Branch cannot be empty.")
      toast.error("Branch required", { description: "Enter a valid branch name." })
      return
    }

    setLaunching(true)
    try {
      const pipeline = await runPipeline({
        project_id:              Number(selectedProjectId),
        branch:                  branch.trim(),
        language:                language || "auto",
        deploy_env:              environment,
        environment:             environment,
        // Stage toggles
        run_tests:               analysisOptions.runTests,
        run_quality:             analysisOptions.codeQuality,
        run_security:            analysisOptions.securityScan,
        run_ai:                  analysisOptions.aiSuggestions,
        // Granular stage params — sent directly to Jenkins
        dependency_audit:        analysisOptions.dependencyAudit,
        secret_detection:        analysisOptions.secretDetection,
        run_sast:                analysisOptions.securityScan,
        run_docker_build:        true,
        run_container_scan:      analysisOptions.securityScan,
        run_sbom:                analysisOptions.securityScan,
        generate_ai_suggestions: analysisOptions.aiSuggestions,
        deploy_if_validated:     analysisOptions.deployIfValidated,
        push_image:              analysisOptions.deployIfValidated,
        sign_image:              analysisOptions.deployIfValidated,
      })

      setLaunchedPipeline(pipeline)
      toast.success("Pipeline launched!", {
        description: `Build ${formatBuildNumber(pipeline.build_number)} started for ${projects.find(p => p.id === Number(selectedProjectId))?.name ?? "project"}.`,
      })

      if (onNavigate) {
        setTimeout(() => onNavigate("pipeline-monitor", pipeline.id, pipeline.build_number), 1500)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to launch pipeline."
      setLaunchError(msg)
      toast.error("Launch failed", { description: msg })
    } finally {
      setLaunching(false)
    }
  }

  // ─── Derived values ────────────────────────────────────────────────────────
  const selectedProject = projects.find((p) => p.id === Number(selectedProjectId)) ?? null
  const enabledOptions = Object.entries(analysisOptions)
    .filter(([, v]) => v)
    .map(([k]) => k as keyof AnalysisOptions)

  // Calculate active stages count
  const activeStagesCount = pipelineSteps.filter(s => s.mandatory || (s.optionKey && analysisOptions[s.optionKey])).length

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">RUN DEVSECOPS PIPELINE</h1>
          <p className="text-sm text-neutral-400">Configure and trigger the 27-stage DevSecOps Jenkins pipeline for GitLab projects</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main Configuration (left 2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pipeline Configuration */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PIPELINE CONFIGURATION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* SELECT PROJECT */}
              <div>
                <label className="text-xs text-neutral-400 tracking-wider mb-2 block">SELECT PROJECT</label>
                {projectsLoading ? (
                  <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-600 rounded px-3 py-2 h-10">
                    <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                    <span className="text-sm text-neutral-400">Loading projects...</span>
                  </div>
                ) : projectsError ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-3 py-2 h-10">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs text-red-400">Failed to load projects</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-neutral-400 hover:text-orange-500 h-10 w-10"
                      onClick={fetchProjects}
                      title="Retry"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-600 rounded px-3 py-2 h-10">
                    <span className="text-sm text-neutral-500">No projects found — add one first</span>
                  </div>
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* REPOSITORY URL */}
              <div>
                <label className="text-xs text-neutral-400 tracking-wider mb-2 block">REPOSITORY URL</label>
                <Input
                  type="text"
                  value={repositoryUrl}
                  readOnly
                  placeholder="Select a project to auto-fill"
                  className="bg-neutral-800 border-neutral-600 text-neutral-300 cursor-not-allowed placeholder-neutral-600 font-mono text-xs"
                />
              </div>

              {/* BRANCH / LANGUAGE / ENVIRONMENT */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">BRANCH</label>
                  <Input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g., main"
                    className="bg-neutral-800 border-neutral-600 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">LANGUAGE</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="auto">Auto (Detect)</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">ENVIRONMENT</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="test">Test</option>
                    <option value="staging">Staging</option>
                    <option value="production-simulation">Production Simulation</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Options Aligned with Stages */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SELECT ANALYSIS OPTIONS</CardTitle>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                {activeStagesCount} / 27 STAGES ACTIVE
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysisOptionLabels.map((option) => {
                  const isChecked = analysisOptions[option.key]
                  return (
                    <div
                      key={option.key}
                      onClick={() => toggleAnalysisOption(option.key)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? "bg-orange-500/10 border-orange-500/40 text-white"
                          : "bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={option.key}
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div onClick
                        className="w-4 h-4 mt-0.5 bg-neutral-800 border border-neutral-600 rounded cursor-pointer accent-orange-500"
                      />
                      <div className="space-y-0.5 flex-1">
                        <label htmlFor={option.key} className="text-xs font-semibold block cursor-pointer">
                          {option.label}
                        </label>
                        <p className="text-[11px] text-neutral-400">{option.stagesText}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Preview — 27 Real Stages Aligned */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PIPELINE PREVIEW (27 STAGES)</CardTitle>
                <p className="text-xs text-neutral-500 mt-1">Real Jenkinsfile execution sequence mapped dynamically to your options</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2">
                {pipelineSteps.map((step, index) => {
                  const isActive = step.mandatory || (step.optionKey && analysisOptions[step.optionKey])
                  return (
                    <div
                      key={step.step}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                        isActive
                          ? "bg-neutral-800/80 border-neutral-700"
                          : "bg-neutral-900/40 border-neutral-800/60 opacity-40"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5 ${
                        isActive
                          ? "bg-orange-500/20 border-orange-500 text-orange-400"
                          : "bg-neutral-800 border-neutral-700 text-neutral-500"
                      }`}>
                        {step.step}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-bold ${isActive ? "text-white" : "text-neutral-500"}`}>
                            {step.name}
                          </h4>
                          {step.mandatory ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                              Core Stage
                            </Badge>
                          ) : isActive ? (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Enabled
                            </Badge>
                          ) : (
                            <Badge className="bg-neutral-800 text-neutral-500 border-neutral-700 text-[10px] px-1.5 py-0 flex items-center gap-1">
                              <Ban className="w-2.5 h-2.5" /> Skipped
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Launch Section */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleLaunchPipeline}
                  disabled={launching || projectsLoading || projects.length === 0}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex-1 flex items-center justify-center gap-2 disabled:opacity-50 h-11"
                >
                  {launching
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching DevSecOps Pipeline...</>
                    : <><Play className="w-4 h-4" /> Launch DevSecOps Pipeline</>
                  }
                </Button>
              </div>
              <p className="text-xs text-neutral-500">
                The pipeline will be executed by Jenkins using the selected GitLab repository and analysis options.
              </p>
            </CardContent>
          </Card>

          {/* Private Repository Note */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-white font-medium mb-1">PRIVATE REPOSITORY AUTHENTICATION</p>
                  <p className="text-xs text-neutral-400">
                    For private GitLab repositories, Jenkins authenticates using the configured `gitlab-private-token` credential.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Launch error state */}
          {launchError && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400 font-medium">Pipeline launch failed</p>
                    <p className="text-xs text-red-500/80 mt-1">{launchError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success state */}
          {launchedPipeline && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-500 font-medium">Pipeline Launched Successfully</p>
                    <p className="text-xs text-green-400 mt-1">
                      Build <span className="font-mono font-bold">{formatBuildNumber(launchedPipeline.build_number)}</span> has started.
                      Redirecting to Pipeline Monitor...
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-2 flex-shrink-0"
                    onClick={() => onNavigate?.("pipeline-monitor", launchedPipeline.id, launchedPipeline.build_number)}
                  >
                    <Activity className="w-4 h-4" />
                    Monitor Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Sidebar Summary ── */}
        <div className="lg:col-span-1">
          <Card className="bg-neutral-900 border-neutral-700 sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">EXECUTION SUMMARY</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div>
                <p className="text-xs text-neutral-400 mb-1">TOTAL STAGES</p>

                <p className="text-2xl font-bold text-white font-mono">
                  {activeStagesCount} <span className="text-xs text-neutral-500 font-normal">/ 27 active</span>
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-400 mb-1">ESTIMATED DURATION</p>
                <p className="text-lg font-bold text-white font-mono">
                  {activeStagesCount > 20 ? "3–5 minutes" : activeStagesCount > 15 ? "2–3 minutes" : "1–2 minutes"}
                </p>
              </div>

              {/* Dynamic project info */}
              {selectedProject && (
                <div className="space-y-2 border-t border-neutral-700 pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Project:</span>
                    <span className="text-white font-mono truncate ml-2">{selectedProject.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Branch:</span>
                    <span className="text-white font-mono">{branch || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Language:</span>
                    <span className="text-white font-mono">{language || "auto"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Environment:</span>
                    <span className="text-white font-mono">{environment}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-neutral-700 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Triggered By:</span>
                  <span className="text-white font-mono">Current User</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Jenkins Job:</span>
                  <span className="text-white font-mono">devsecops-pipeline</span>
                </div>
              </div>

              <div className="bg-neutral-800 rounded p-3 space-y-2 border border-neutral-700">
                <p className="text-xs text-neutral-400 font-medium">DEPLOYMENT RULE</p>
                <p className="text-xs text-neutral-300">
                  {analysisOptions.deployIfValidated ? "Deploy if all security & quality checks pass" : "Do not deploy automatically (Analysis only)"}
                </p>
              </div>

              {/* Selected analysis badges */}
              <div className="space-y-2">
                <p className="text-xs text-neutral-400 font-medium">ENABLED OPTIONS</p>
                <div className="flex flex-wrap gap-1.5">
                  {enabledOptions.length === 0 ? (
                    <span className="text-xs text-neutral-500">Only Core stages enabled</span>
                  ) : (
                    enabledOptions.map((key) => (
                      <Badge
                        key={key}
                        className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px]"
                      >
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase())
                          .trim()}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Pipeline ID after launch */}
              {launchedPipeline && (
                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <p className="text-xs text-neutral-400 font-medium mb-1">PIPELINE ID</p>
                  <p className="text-sm text-green-400 font-mono font-bold">{launchedPipeline.id}</p>
                  <p className="text-xs text-neutral-500 mt-1">Build: {formatBuildNumber(launchedPipeline.build_number)}</p>
                  <p className="text-xs text-neutral-500 mt-1">Status: {launchedPipeline.status}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
