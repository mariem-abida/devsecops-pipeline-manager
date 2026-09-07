"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Eye,
  GitBranch,
  Loader2,
  Play,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react"
import {
  getHealth,
  getLatestPipelineStatus,
  getPipelines,
  getProjects,
  type HealthStatus,
  type Pipeline,
  type PipelineStatus,
  type Project,
} from "@/services/api"


interface Props {
  onNavigate?: (section: string, pipelineId?: number, buildNumber?: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-white",
  FAILED: "bg-red-500",
  FAILURE: "bg-red-500",
  RUNNING: "bg-orange-500",
  UNSTABLE: "bg-neutral-500",
  BLOCKED: "bg-red-700",
  ABORTED: "bg-neutral-600",
  UNKNOWN: "bg-neutral-600",
}

function formatBuildNumber(buildNumber?: string): string {
  if (!buildNumber) return "N/A"
  return buildNumber.startsWith("#") ? buildNumber : `#${buildNumber}`
}

function formatLastAnalysis(pipelines: Pipeline[]): { value: string; trend: string } {
  if (pipelines.length === 0) return { value: "N/A", trend: "no pipelines yet" }

  const latest = pipelines.reduce((newest, p) =>
    new Date(p.created_at) > new Date(newest.created_at) ? p : newest
  )

  const date = new Date(latest.created_at)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  if (diffDays === 0) return { value: "Today", trend: `at ${timeStr}` }
  if (diffDays === 1) return { value: "Yesterday", trend: `at ${timeStr}` }
  return { value: `${diffDays}d ago`, trend: date.toLocaleDateString("en-GB") }
}

function formatRunDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
}

function getStatusIcon(status: string) {
  switch (status?.toUpperCase()) {
    case "SUCCESS": return <CheckCircle className="w-4 h-4 text-white" />
    case "FAILURE":
    case "FAILED": return <XCircle className="w-4 h-4 text-red-500" />
    case "RUNNING": return <Clock className="w-4 h-4 text-white animate-spin" />
    case "UNSTABLE": return <AlertCircle className="w-4 h-4 text-orange-500" />
    default: return <AlertCircle className="w-4 h-4 text-neutral-500" />
  }
}

function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case "SUCCESS": return "text-white"
    case "FAILURE":
    case "FAILED": return "text-red-500"
    case "RUNNING": return "text-white"
    case "UNSTABLE": return "text-orange-500"
    default: return "text-neutral-400"
  }
}

export function CommandCenterView({ onNavigate }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [latestStatus, setLatestStatus] = useState<PipelineStatus | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchDashboardData() }, [])

  async function fetchDashboardData() {
    setLoading(true)
    setError(null)
    try {
      const [projectsData, pipelinesData, healthData, latestData] = await Promise.all([
        getProjects(),
        getPipelines(),
        getHealth().catch(() => null),
        getLatestPipelineStatus().catch(() => null),
      ])
      setProjects(projectsData)
      setPipelines(pipelinesData)
      setHealth(healthData)
      setLatestStatus(latestData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data."
      setError(msg)
      toast.error("Dashboard failed to load", { description: msg })
    } finally {
      setLoading(false)
    }
  }

  const totalProjects = projects.length
  const totalPipelines = pipelines.length
  const successCount = pipelines.filter(p => p.status?.toUpperCase() === "SUCCESS").length
  const failedCount = pipelines.filter(p => ["FAILED", "FAILURE"].includes(p.status?.toUpperCase())).length
  const runningCount = pipelines.filter(p => p.status?.toUpperCase() === "RUNNING").length
  const lastAnalysis = formatLastAnalysis(pipelines)

  const kpis = [
    { label: "Total Projects", value: String(totalProjects), trend: `${totalProjects} registered`, trendPositive: true, Icon: GitBranch },
    { label: "Pipelines Run", value: String(totalPipelines), trend: `${totalPipelines} total runs`, trendPositive: true, Icon: Activity },
    { label: "Latest Status", value: latestStatus?.status ?? "N/A", trend: latestStatus ? formatBuildNumber(latestStatus.build_number) : "no pipeline yet", trendPositive: latestStatus?.status === "SUCCESS", Icon: Clock },
    { label: "Successful", value: String(successCount), trend: `${successCount} SUCCESS`, trendPositive: true, Icon: CheckCircle },
    { label: "Failed", value: String(failedCount), trend: `${failedCount} FAILED`, trendPositive: failedCount === 0, Icon: XCircle },
    { label: "Running", value: String(runningCount), trend: `${runningCount} RUNNING`, trendPositive: true, Icon: Play },
  ]

  const statusGroups = pipelines.reduce<Record<string, number>>((acc, pipeline) => {
    const key = pipeline.status?.toUpperCase() || "UNKNOWN"
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const pipelineStatusBars = Object.entries(Object.keys(statusGroups).length === 0 ? { UNKNOWN: 0 } : statusGroups)
    .map(([key, value]) => ({ label: key, value, color: STATUS_COLORS[key] ?? STATUS_COLORS.UNKNOWN }))
    .filter(item => totalPipelines > 0 || item.label === "UNKNOWN")

  const projectMap = new Map(projects.map(project => [project.id, project]))
  const recentRuns = [...pipelines]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(pipeline => {
      const project = projectMap.get(pipeline.project_id)
      return {
        id: pipeline.id,
        buildNumber: pipeline.build_number,
        project: project?.name ?? `Project #${pipeline.project_id}`,
        branch: project?.branch ?? "N/A",
        language: project?.language ?? "N/A",
        status: pipeline.status ?? "UNKNOWN",
        duration: pipeline.duration ?? "N/A",
        environment: pipeline.environment ?? "N/A",
        date: formatRunDate(pipeline.created_at),
      }
    })

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DASHBOARD OVERVIEW</h1>
          <p className="text-sm text-neutral-400 mt-1">Monitor projects, Jenkins pipelines, code quality, and security status from one place.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  <div className="text-sm text-neutral-400">Loading...</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DASHBOARD OVERVIEW</h1>
          <p className="text-sm text-neutral-400 mt-1">Monitor projects, Jenkins pipelines, code quality, and security status from one place.</p>
        </div>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Unable to connect to backend</p>
              <p className="text-xs text-red-500/80 mt-1">{error}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2" onClick={fetchDashboardData}>
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wider">DASHBOARD OVERVIEW</h1>
        <p className="text-sm text-neutral-400 mt-1">Monitor projects, Jenkins pipelines, code quality, and security status from one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(({ Icon, ...kpi }) => (
          <Card key={kpi.label} className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Icon className="w-6 h-6 text-orange-500" />
                {kpi.trendPositive ? <TrendingUp className="w-4 h-4 text-white" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
              </div>
              <div className="text-xs text-neutral-400 tracking-wider mb-1">{kpi.label}</div>
              <div className="text-3xl font-bold text-white font-mono mb-2">{kpi.value}</div>
              <div className="text-xs text-neutral-500">{kpi.trend}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PIPELINE STATUS OVERVIEW</CardTitle>
          </CardHeader>
          <CardContent>
            {totalPipelines === 0 ? (
              <p className="text-sm text-neutral-500">No pipelines run yet.</p>
            ) : (
              <div className="space-y-4">
                {pipelineStatusBars.map(item => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-300">{item.label}</span>
                      <span className="text-white font-mono font-bold">{item.value}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full transition-all duration-300`} style={{ width: `${(item.value / totalPipelines) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-700">Total: {totalPipelines} pipelines</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">LATEST PIPELINE STATUS</CardTitle>
          </CardHeader>
          <CardContent>
            {latestStatus ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">PIPELINE ID</p>
                  <p className="text-white font-mono">{latestStatus.pipeline_id}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">BUILD NUMBER</p>
                  <p className="text-white font-mono">{formatBuildNumber(latestStatus.build_number)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">STATUS</p>
                  <div className="flex items-center gap-2">{getStatusIcon(latestStatus.status)}<span className={getStatusColor(latestStatus.status)}>{latestStatus.status}</span></div>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">PROGRESS</p>
                  <p className="text-white font-mono">{latestStatus.progress}%</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">CURRENT STAGE</p>
                  <p className="text-white font-mono">{latestStatus.current_stage || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">DURATION</p>
                  <p className="text-white font-mono">{latestStatus.duration || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No latest pipeline status available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">RECENT PIPELINE RUNS</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500">No pipeline runs yet.</p>
              <p className="text-xs text-neutral-600 mt-1">Run a pipeline from the Run Pipeline section.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">PIPELINE ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">BUILD</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">PROJECT</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">BRANCH</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">LANGUAGE</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ENVIRONMENT</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">DURATION</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">DATE</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run, index) => (
                    <tr key={run.id} className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"}`}>
                      <td className="py-3 px-4 text-white font-mono">{run.id}</td>
                      <td className="py-3 px-4 text-white font-mono">{formatBuildNumber(run.buildNumber)}</td>
                      <td className="py-3 px-4 text-white font-mono">{run.project}</td>
                      <td className="py-3 px-4 text-neutral-300"><div className="flex items-center gap-1"><GitBranch className="w-3 h-3 text-neutral-500" />{run.branch}</div></td>
                      <td className="py-3 px-4 text-neutral-300"><div className="flex items-center gap-1"><Code className="w-3 h-3 text-neutral-500" />{run.language}</div></td>
                      <td className="py-3 px-4"><div className="flex items-center gap-2">{getStatusIcon(run.status)}<span className={`text-xs font-mono tracking-wider ${getStatusColor(run.status)}`}>{run.status}</span></div></td>
                      <td className="py-3 px-4 text-neutral-300 text-xs">{run.environment}</td>
                      <td className="py-3 px-4 text-neutral-300 text-xs">{run.duration}</td>
                      <td className="py-3 px-4 text-neutral-400 text-xs">{run.date}</td>
                      <td className="py-3 px-4"><Button variant="ghost" size="sm" className="text-neutral-400 hover:text-orange-500 p-0 h-auto"><Eye className="w-4 h-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-neutral-300 tracking-wider mb-4">QUICK ACTIONS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Add GitLab Project", description: "Connect a new GitLab repository.", Icon: GitBranch, section: "projects" },
            { title: "Run New Pipeline", description: "Launch a Jenkins pipeline manually.", Icon: Play, section: "run-pipeline" },
            { title: "View Security Reports", description: "Review available security results.", Icon: Shield, section: "security-results" },
            { title: "Open Pipeline Monitor", description: "Track pipeline execution.", Icon: Activity, section: "pipeline-monitor" },
          ].map(action => (
            <Card key={action.title} onClick={() => onNavigate?.(action.section)} className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors cursor-pointer group">
              <CardContent className="p-4">
                <action.Icon className="w-8 h-8 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-medium text-white mb-1 group-hover:text-orange-500 transition-colors">{action.title}</h3>
                <p className="text-xs text-neutral-400">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">BACKEND DATA SOURCES</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "FastAPI", status: health?.backend === "ok" ? "Connected" : "Unknown", online: health?.backend === "ok" },
              { name: "PostgreSQL", status: health?.database ?? "Unknown", online: health?.database === "connected" },
              { name: "Projects API", status: `${projects.length} loaded`, online: true },
              { name: "Pipelines API", status: `${pipelines.length} loaded`, online: true },
            ].map(source => (
              <div key={source.name} className="flex items-center gap-3 p-3 bg-neutral-800 rounded">
                <div className={`w-2 h-2 rounded-full ${source.online ? "bg-white animate-pulse" : "bg-red-500"}`} />
                <div>
                  <div className="text-sm text-white font-medium">{source.name}</div>
                  <div className="text-xs text-neutral-500">{source.status}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-neutral-500 pt-4 border-t border-neutral-700 mt-4">
            Last analysis: {lastAnalysis.value} {lastAnalysis.trend}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
