"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  ExternalLink,
  Copy,
  RotateCw,
  Square,
  Loader2,
  XCircle,
} from "lucide-react"
import {
  getPipelineById,
  getPipelineStatus,
  getPipelineLogs,
  getProjectById,
  type Pipeline,
  type PipelineStatus,
  type Project,
} from "@/services/api"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Pipeline stages in order — used to derive timeline status from current_stage */
const STAGE_DEFINITIONS = [
  { id: 1,  name: "Validate Parameters",        description: "Validate pipeline inputs and repository URL" },
  { id: 2,  name: "Checkout",                    description: "Clone repository from GitLab" },
  { id: 3,  name: "Detect Language",             description: "Auto-detect project language" },
  { id: 4,  name: "Build",                       description: "Compile or prepare the application" },
  { id: 5,  name: "Run Tests",                   description: "Execute unit and integration tests" },
  { id: 6,  name: "Code Quality",                description: "Run linter and static analysis" },
  { id: 7,  name: "SonarQube Analysis",          description: "Deep code quality scan with SonarQube" },
  { id: 8,  name: "SonarQube Quality Gate",      description: "Wait for SonarQube Quality Gate result" },
  { id: 9,  name: "SAST",                        description: "Static Application Security Testing" },
  { id: 10, name: "Dependency Scan",             description: "Check vulnerable dependencies" },
  { id: 11, name: "Secret Scan",                 description: "Scan for hardcoded secrets and tokens" },
  { id: 12, name: "Docker Build",                description: "Build Docker container image" },
  { id: 13, name: "Container Scan",              description: "Scan container image for vulnerabilities" },
  { id: 14, name: "Generate SBOM",               description: "Generate Software Bill of Materials" },
  { id: 15, name: "AI Security Advisor",         description: "AI-assisted security recommendations" },
  { id: 16, name: "Prepare Policy Input",        description: "Prepare OPA policy input data" },
  { id: 17, name: "Test Security Policies",      description: "Run OPA policy unit tests" },
  { id: 18, name: "Policy as Code",              description: "Enforce security policies with OPA" },
  { id: 19, name: "Deployment Decision",         description: "Approve or block deployment" },
  { id: 20, name: "Publish Image",               description: "Push image to container registry" },
  { id: 21, name: "Resolve Image Digest",        description: "Resolve image SHA256 digest" },
  { id: 22, name: "Sign Image",                  description: "Sign image with Cosign" },
  { id: 23, name: "Verify Signature",            description: "Verify image Cosign signature" },
  { id: 24, name: "Production Approval",         description: "Manual gate for production deployments" },
  { id: 25, name: "Deploy",                      description: "Deploy application to target environment" },
  { id: 26, name: "Generate Audit Trail",        description: "Create compliance audit trail" },
  { id: 27, name: "Generate Pipeline Summary",   description: "Generate final pipeline report" },
] as const

/** Status values that mean the pipeline has finished running */
const TERMINAL_STATUSES = new Set(["SUCCESS", "FAILURE", "FAILED", "BLOCKED", "ABORTED"])

/** Polling interval in milliseconds (2.5 seconds for snappy live log streaming) */
const POLL_INTERVAL_MS = 2500

// ─── TODO: Replace mock logs with Jenkins logs API later ─────────────────────
const MOCK_LOGS = [
  "[09:12:15] Started by user Admin",
  "[09:12:16] Running as SYSTEM",
  "[09:12:16] Building in workspace /var/jenkins_home/workspace/backend-api",
  "[09:12:17] Cloning GitLab repository...",
  "[09:12:19] Fetching branch main from GitLab",
  "[09:12:21] Repository cloned successfully",
  "[09:12:22] Installing dependencies...",
  "[09:12:44] Dependencies installed successfully",
  "[09:12:46] Running build...",
  "[09:13:00] Build completed successfully",
  "[09:13:01] Running automated tests...",
  "[09:14:07] All tests passed. Coverage: 72%",
  "[09:14:08] Running SonarQube analysis...",
  "[09:14:47] Quality Gate passed",
  "[09:14:49] Starting secret detection scan...",
  "[09:15:10] Secret detection still running...",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

type StageStatus = "success" | "running" | "pending" | "failed"

function formatBuildNumber(buildNumber?: string): string {
  if (!buildNumber) return "N/A"
  return buildNumber.startsWith("#") ? buildNumber : `#${buildNumber}`
}

/** Resolve each timeline stage's status from the backend current_stage + global status */
function resolveStageStatuses(
  currentStage: string,
  globalStatus: string,
  progress: number,
): StageStatus[] {
  const currentIdx = STAGE_DEFINITIONS.findIndex(
    (s) => s.name.toLowerCase() === currentStage?.toLowerCase()
  )

  return STAGE_DEFINITIONS.map((_, idx) => {
    if (currentIdx === -1) {
      // Fallback: use progress % to estimate how far we are
      const stageProgress = ((idx + 1) / STAGE_DEFINITIONS.length) * 100
      if (stageProgress < progress) return "success"
      if (Math.abs(stageProgress - progress) < 12) return "running"
      return "pending"
    }

    if (idx < currentIdx) return "success"
    if (idx === currentIdx) {
      if (globalStatus === "FAILED" || globalStatus === "FAILURE") return "failed"
      if (TERMINAL_STATUSES.has(globalStatus) && globalStatus === "SUCCESS") return "success"
      return "running"
    }
    return "pending"
  })
}

function getGlobalStatusBadge(status: string): string {
  switch (status?.toUpperCase()) {
    case "RUNNING":  return "bg-orange-500/20 text-orange-500"
    case "SUCCESS":  return "bg-white/20 text-white"
    case "FAILURE":
    case "FAILED":   return "bg-red-500/20 text-red-500"
    case "BLOCKED":  return "bg-red-500/20 text-red-400"
    case "ABORTED":  return "bg-neutral-500/20 text-neutral-400"
    default:         return "bg-neutral-800/20 text-neutral-400"
  }
}

function getStageIcon(status: StageStatus) {
  switch (status) {
    case "success": return <CheckCircle className="w-5 h-5 text-white" />
    case "running": return <Clock className="w-5 h-5 text-orange-500 animate-spin" />
    case "failed":  return <XCircle className="w-5 h-5 text-red-500" />
    case "pending": return <AlertCircle className="w-5 h-5 text-neutral-400" />
  }
}

function getStageCircleClass(status: StageStatus): string {
  switch (status) {
    case "success": return "border-white bg-transparent"
    case "running": return "border-orange-500 bg-orange-500/10"
    case "failed":  return "border-red-500 bg-red-500/10"
    case "pending": return "border-neutral-600 bg-transparent"
  }
}

function getStageBadgeClass(status: StageStatus): string {
  switch (status) {
    case "success": return "bg-white/20 text-white"
    case "running": return "bg-orange-500/20 text-orange-500"
    case "failed":  return "bg-red-500/20 text-red-500"
    case "pending": return "bg-neutral-500/20 text-neutral-400"
  }
}

function getStageLineClass(status: StageStatus): string {
  switch (status) {
    case "success": return "bg-white"
    case "running": return "bg-orange-500"
    case "failed":  return "bg-red-500"
    case "pending": return "bg-neutral-600"
  }
}

function getProgressBarClass(status: string): string {
  switch (status?.toUpperCase()) {
    case "SUCCESS": return "bg-white"
    case "FAILED":  return "bg-red-500"
    case "ABORTED":
    case "BLOCKED": return "bg-neutral-500"
    default:        return "bg-orange-500"
  }
}

/** Find the tool associated with a stage (for Current Stage Details panel) */
function getStageToolName(stageName: string): string {
  const toolMap: Record<string, string> = {
    "Checkout GitLab":      "Git / GitLab CLI",
    "Install Dependencies": "pip / npm / mvn",
    "Build":               "Compiler / Build Tool",
    "Automated Tests":     "pytest / Jest / JUnit",
    "Code Quality":        "SonarQube",
    "Secret Detection":    "Gitleaks",
    "Security Scan":       "Semgrep",
    "Dependency Audit":    "pip-audit / npm audit",
    "AI Suggestions":      "AI Engine",
    "Deployment Decision": "Jenkins Gate",
  }
  return toolMap[stageName] ?? "—"
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Pipeline ID to monitor. When undefined the page shows an empty state. */
  pipelineId?: number
  onNavigate?: (section: string, pipelineId?: number, buildNumber?: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PipelineMonitorView({ pipelineId, onNavigate }: Props) {
  // ── Auto-refresh toggle
  const [autoRefresh, setAutoRefresh] = useState(true)

  // ── Loaded data
  const [pipeline, setPipeline]   = useState<Pipeline | null>(null)
  const [status, setStatus]       = useState<PipelineStatus | null>(null)
  const [project, setProject]     = useState<Project | null>(null)
  const [liveLogs, setLiveLogs]   = useState<string>("")

  // ── UI states
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // ── Polling ref & logs container ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logsContainerRef = useRef<HTMLDivElement | null>(null)

  // ─── Fetch full pipeline data ──────────────────────────────────────────────
  const fetchPipeline = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const [pipelineData, statusData, logsData] = await Promise.all([
        getPipelineById(id),
        getPipelineStatus(id),
        getPipelineLogs(id).catch(() => null),
      ])
      setPipeline(pipelineData)
      setStatus(statusData)
      if (logsData?.logs) setLiveLogs(logsData.logs)

      // Also load the related project
      const proj = await getProjectById(pipelineData.project_id)
      setProject(proj)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load pipeline."
      setError(msg)
      toast.error("Could not load pipeline", { description: msg })
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Poll status and live logs (lightweight) ──────────────────────────────
  const pollStatus = useCallback(async (id: number) => {
    try {
      const [statusData, logsData] = await Promise.all([
        getPipelineStatus(id),
        getPipelineLogs(id).catch(() => null),
      ])
      setStatus(statusData)
      if (logsData?.logs) setLiveLogs(logsData.logs)

      // Also sync pipeline.status so the summary header stays fresh
      setPipeline((prev) =>
        prev ? { ...prev, status: statusData.status, progress: statusData.progress, current_stage: statusData.current_stage, duration: statusData.duration } : prev
      )
      // Stop polling when terminal
      if (TERMINAL_STATUSES.has(statusData.status?.toUpperCase())) {
        stopPolling()
        toast.success(`Pipeline ${statusData.status.toLowerCase()}`, {
          description: `Build finished with status: ${statusData.status}`,
        })
      }
    } catch {
      // Silent poll failure — don't disrupt the UI
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startPolling(id: number) {
    stopPolling()
    pollRef.current = setInterval(() => {
      pollStatus(id)
    }, POLL_INTERVAL_MS)
  }

  // ─── Manual refresh ────────────────────────────────────────────────────────
  async function handleManualRefresh() {
    if (!pipelineId) return
    setRefreshing(true)
    try {
      await pollStatus(pipelineId)
    } finally {
      setRefreshing(false)
    }
  }

  // ─── Effect: load on pipelineId change and start polling ──────────────────
  useEffect(() => {
    stopPolling()
    if (!pipelineId) return

    fetchPipeline(pipelineId)

    if (autoRefresh) {
      startPolling(pipelineId)
    }

    return () => stopPolling()
  }, [pipelineId, autoRefresh, fetchPipeline])

  // ─── Effect: auto scroll logs container to bottom ─────────────────────────
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [liveLogs])

  // ─── Derived values ────────────────────────────────────────────────────────
  const liveStatus    = status?.status    ?? pipeline?.status    ?? "UNKNOWN"
  const liveProgress  = status?.progress  ?? pipeline?.progress  ?? 0
  const liveStage     = status?.current_stage ?? pipeline?.current_stage ?? ""
  const liveDuration  = status?.duration  ?? pipeline?.duration  ?? "—"

  const stageStatuses = resolveStageStatuses(liveStage, liveStatus, liveProgress)
  const currentStageObj = STAGE_DEFINITIONS.find(
    (s) => s.name.toLowerCase() === liveStage?.toLowerCase()
  )
  const currentStageIdx = STAGE_DEFINITIONS.findIndex(
    (s) => s.name.toLowerCase() === liveStage?.toLowerCase()
  )
  const nextStage = currentStageIdx >= 0 && currentStageIdx < STAGE_DEFINITIONS.length - 1
    ? STAGE_DEFINITIONS[currentStageIdx + 1].name
    : "—"

  const isTerminal = TERMINAL_STATUSES.has(liveStatus?.toUpperCase())
  const activeBuildNumber = pipeline?.build_number ?? status?.build_number

  function openResults(section: string) {
    if (!pipelineId) return
    onNavigate?.(section, pipelineId, activeBuildNumber)
  }

  // ─── Render: No pipeline ID ────────────────────────────────────────────────
  if (!pipelineId) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">PIPELINE MONITOR</h1>
          <p className="text-sm text-neutral-400">Track Jenkins pipeline execution in real time</p>
        </div>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No pipeline selected</h3>
            <p className="text-sm text-neutral-400">
              Go to <span className="text-orange-500 font-medium">Run Pipeline</span> and launch a pipeline first.
              The monitor will automatically open here with live status.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render: Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">PIPELINE MONITOR</h1>
          <p className="text-sm text-neutral-400">Track Jenkins pipeline execution in real time</p>
        </div>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm text-neutral-400">Loading pipeline #{pipelineId}...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render: Error ─────────────────────────────────────────────────────────
  if (error && !pipeline) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">PIPELINE MONITOR</h1>
          <p className="text-sm text-neutral-400">Track Jenkins pipeline execution in real time</p>
        </div>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Pipeline not found</p>
              <p className="text-xs text-red-500/80 mt-1">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
              onClick={() => fetchPipeline(pipelineId)}
            >
              <RotateCw className="w-3 h-3" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render: Full monitor ──────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">PIPELINE MONITOR</h1>
          <p className="text-sm text-neutral-400">Track Jenkins pipeline execution in real time</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={`border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent ${
              autoRefresh && !isTerminal ? "border-orange-500 text-orange-500" : ""
            }`}
            onClick={() => setAutoRefresh((v) => !v)}
            disabled={isTerminal}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            {isTerminal
              ? "Pipeline Finished"
              : autoRefresh
                ? "Auto Refresh ON"
                : "Auto Refresh OFF"}
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <RotateCw className="w-4 h-4 mr-2" />}
            Refresh Status
          </Button>
        </div>
      </div>

      {/* ── Pipeline Summary ── */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PIPELINE SUMMARY</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: project info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">PIPELINE ID</p>
              <p className="text-sm text-white font-mono">{pipeline?.id ?? pipelineId}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">PROJECT</p>
              <p className="text-sm text-white font-mono">{project?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">BRANCH</p>
              <p className="text-sm text-white font-mono">{project?.branch ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">LANGUAGE</p>
              <p className="text-sm text-white font-mono">{project?.language ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">JENKINS BUILD</p>
              <p className="text-sm text-white font-mono">{formatBuildNumber(pipeline?.build_number)}</p>
            </div>
          </div>

          {/* Row 2: status / progress / current stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">GLOBAL STATUS</p>
              <div className="flex items-center gap-2">
                <Badge className={getGlobalStatusBadge(liveStatus)}>
                  {liveStatus}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">PROGRESS</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">{liveProgress}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressBarClass(liveStatus)}`}
                    style={{ width: `${liveProgress}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">CURRENT STAGE</p>
              <p className={`text-sm font-mono ${isTerminal ? "text-neutral-400" : "text-orange-500"}`}>
                {liveStage || "—"}
              </p>
            </div>
          </div>

          {/* Row 3: duration / environment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-700">
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">DURATION</p>
              <p className="text-sm text-white font-mono">{liveDuration}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 tracking-wider mb-1">ENVIRONMENT</p>
              <p className="text-sm text-white font-mono">{pipeline?.environment ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Timeline + Logs ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pipeline Execution Timeline */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PIPELINE EXECUTION</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STAGE_DEFINITIONS.map((stage, index) => {
                  const stageStatus = stageStatuses[index]
                  return (
                    <div key={stage.id} className="relative">
                      <div className="flex items-start gap-4">
                        {/* Stage Circle + Connector Line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getStageCircleClass(stageStatus)}`}>
                            {getStageIcon(stageStatus)}
                          </div>
                          {index < STAGE_DEFINITIONS.length - 1 && (
                            <div className={`w-0.5 h-12 ${getStageLineClass(stageStatus)}`} />
                          )}
                        </div>

                        {/* Stage Info */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-white">{stage.name}</h4>
                            <Badge className={getStageBadgeClass(stageStatus)}>
                              {stageStatus.charAt(0).toUpperCase() + stageStatus.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-400 mb-2">{stage.description}</p>
                          <div className="flex gap-4 text-xs text-neutral-500">
                            <span>Duration: {stageStatus === "success" ? "—" : stageStatus === "running" ? liveDuration : "-"}</span>
                            <span>
                              {stageStatus === "running"
                                ? `Active: ${liveStage}`
                                : stageStatus === "success"
                                  ? "Completed"
                                  : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Live Real-Time Jenkins Logs */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">LIVE JENKINS LOGS</CardTitle>
                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px]">
                  REAL TIME
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:text-orange-500 h-8 w-8"
                  title="Copy logs"
                  onClick={() => {
                    navigator.clipboard.writeText(liveLogs || "No logs available.")
                    toast.success("Logs copied to clipboard")
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={logsContainerRef}
                className="bg-black rounded font-mono text-xs text-neutral-300 p-4 h-80 overflow-y-auto space-y-1 border border-neutral-800"
              >
                {liveLogs ? (
                  liveLogs.split("\n").map((line, index) => (
                    <div key={index} className="text-neutral-400 whitespace-pre-wrap font-mono">
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-500 text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    Fetching live Jenkins console output...
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                {status?.url && (
                  <Button
                    variant="outline"
                    className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent text-xs"
                    onClick={() => window.open(status.url ?? "#", "_blank")}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Open Jenkins Console
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Sidebar Panels ── */}
        <div className="space-y-6">

          {/* Pipeline Details */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PIPELINE DETAILS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">STATUS</p>
                <Badge className={getGlobalStatusBadge(liveStatus)}>{liveStatus}</Badge>
              </div>
              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">PROGRESS</p>
                <p className="text-white font-mono">{liveProgress}%</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">STARTED AT</p>
                <p className="text-white font-mono">
                  {pipeline?.created_at
                    ? new Date(pipeline.created_at).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })
                    : "—"}
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-700">
                <p className="text-xs text-neutral-400 tracking-wider mb-1">JENKINS JOB</p>
                <p className="text-white font-mono">devsecops-pipeline</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">BUILD URL</p>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-orange-500 hover:bg-neutral-800 hover:text-orange-400 bg-transparent text-xs h-7 w-full justify-start"
                  onClick={() => {
                    const rawBn = pipeline?.build_number?.replace("#", "") ?? ""
                    const targetUrl = status?.url || `http://localhost:8080/job/devsecops-pipeline/${rawBn}/`
                    window.open(targetUrl, "_blank")
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Open Build {formatBuildNumber(pipeline?.build_number)}
                </Button>
              </div>
              <div className="pt-2 border-t border-neutral-700">
                <p className="text-xs text-neutral-400 tracking-wider mb-1">DURATION</p>
                <p className={`font-mono ${isTerminal ? "text-white" : "text-orange-500"}`}>
                  {liveDuration}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Stage Details */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CURRENT STAGE DETAILS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">STAGE</p>
                <p className="text-white font-mono">{currentStageObj?.name ?? liveStage ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">TOOL</p>
                <p className="text-white font-mono">{getStageToolName(liveStage)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 tracking-wider mb-1">STATUS</p>
                <Badge className={getGlobalStatusBadge(liveStatus)}>{liveStatus}</Badge>
              </div>
              {currentStageObj && (
                <div className="pt-2 border-t border-neutral-700">
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">DESCRIPTION</p>
                  <p className="text-neutral-300 text-xs leading-relaxed">{currentStageObj.description}</p>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-700">
                <p className="text-xs text-neutral-400 tracking-wider mb-1">DURATION</p>
                <p className="text-white font-mono">{liveDuration}</p>
              </div>
              <div className="pt-2 border-t border-neutral-700">
                <p className="text-xs text-neutral-400 tracking-wider mb-1">NEXT STAGE</p>
                <p className="text-neutral-400 font-mono">{isTerminal ? "—" : nextStage}</p>
              </div>
            </CardContent>
          </Card>

          {/* Deployment Rules */}
          <Card className="bg-neutral-900 border-neutral-700 border-orange-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                DEPLOYMENT RULES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Deployment will be allowed only if tests pass, the quality gate is valid, and no critical security issue is detected.
              </p>
            </CardContent>
          </Card>

          {/* Result Navigation */}
          <div className="space-y-2">
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
              onClick={() => openResults("test-results")}
              disabled={!activeBuildNumber}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              View Tests
            </Button>
            <Button
              variant="outline"
              className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent w-full"
              onClick={() => openResults("code-quality")}
              disabled={!activeBuildNumber}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Code Quality
            </Button>
            <Button
              variant="outline"
              className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent w-full"
              onClick={() => openResults("security-results")}
              disabled={!activeBuildNumber}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Security
            </Button>
            <Button
              variant="outline"
              className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent w-full"
              onClick={() => openResults("security-results")}
              disabled={!activeBuildNumber}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Deployment Result
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
