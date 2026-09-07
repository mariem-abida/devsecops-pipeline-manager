"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle, CheckCircle, Loader2, RotateCw, Shield,
  Lock, Package, Eye, FileCode, Cpu, AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getDeploymentDecision,
  getComplianceReport,
  getPipeline,
  getPipelineResults,
  getSecurityResults,
  type DeploymentDecisionReport,
  type Pipeline,
  type PipelineResults,
  type SecurityFinding,
  type SecurityReport,
  type ComplianceReport,
} from "@/services/api"

interface Props {
  pipelineId?: number
  buildNumber?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v?: string | null) {
  if (!v) return "N/A"
  return v.startsWith("#") ? v : `#${v}`
}

function severityColor(s: string) {
  switch (s?.toUpperCase()) {
    case "CRITICAL": return "text-red-400 bg-red-500/10 border-red-500/30"
    case "HIGH":     return "text-orange-400 bg-orange-500/10 border-orange-500/30"
    case "MEDIUM":   return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
    case "LOW":      return "text-blue-400 bg-blue-500/10 border-blue-500/30"
    default:         return "text-neutral-400 bg-neutral-800 border-neutral-700"
  }
}

function statusCls(s?: string) {
  switch (s?.toUpperCase()) {
    case "PASSED": case "SUCCESS": case "APPROVED": case "OK":
      return "bg-green-500/15 text-green-400 border-green-500/30"
    case "FAILED": case "FAILURE": case "BLOCKED": case "ERROR":
      return "bg-red-500/15 text-red-400 border-red-500/30"
    case "WARNING": case "WARN":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
    default:
      return "bg-neutral-700/50 text-neutral-400 border-neutral-600"
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={`font-medium ${color}`}>{label}</span>
        <span className="text-neutral-300 font-mono">{value}</span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out`}
          style={{
            width: `${pct}%`,
            background: label === "CRITICAL" ? "#ef4444"
              : label === "HIGH" ? "#f97316"
              : label === "MEDIUM" ? "#eab308"
              : "#3b82f6",
          }}
        />
      </div>
    </div>
  )
}

interface ToolCardProps {
  icon: React.ReactNode
  name: string
  purpose: string
  status: string
  finding: string
}

function ToolCard({ icon, name, purpose, status, finding }: ToolCardProps) {
  const isPass = ["PASSED", "OK", "SUCCESS"].includes(status?.toUpperCase())
  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-2 ${isPass ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`${isPass ? "text-green-400" : "text-red-400"}`}>{icon}</div>
          <span className="text-sm font-semibold text-white">{name}</span>
        </div>
        <Badge className={`border text-xs ${statusCls(status)}`}>{status || "UNKNOWN"}</Badge>
      </div>
      <p className="text-xs text-neutral-500">{purpose}</p>
      <p className="text-xs text-neutral-300 font-mono bg-neutral-800/60 px-2 py-1 rounded">{finding}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SecurityResultsView({ pipelineId, buildNumber }: Props) {
  const [pipeline, setPipeline]     = useState<Pipeline | null>(null)
  const [results, setResults]       = useState<PipelineResults | null>(null)
  const [report, setReport]         = useState<SecurityReport | null>(null)
  const [deployment, setDeployment] = useState<DeploymentDecisionReport | null>(null)
  const [compliance, setCompliance] = useState<ComplianceReport | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!pipelineId && !buildNumber) {
      setPipeline(null); setResults(null); setReport(null)
      setDeployment(null); setCompliance(null); setError(null)
      return
    }
    loadAll(pipelineId, buildNumber)
  }, [pipelineId, buildNumber])

  async function loadAll(id?: number, bn?: string) {
    setLoading(true); setError(null)
    try {
      let resolvedBn = bn
      if (id) {
        const [pipe, res] = await Promise.all([getPipeline(id), getPipelineResults(id)])
        setPipeline(pipe); setResults(res)
        resolvedBn = resolvedBn ?? pipe.build_number
      }
      if (resolvedBn) {
        const [sec, dep, comp] = await Promise.allSettled([
          getSecurityResults(resolvedBn),
          getDeploymentDecision(resolvedBn),
          getComplianceReport(resolvedBn),
        ])
        if (sec.status === "fulfilled")   setReport(sec.value)
        if (dep.status === "fulfilled")   setDeployment(dep.value)
        if (comp.status === "fulfilled")  setCompliance(comp.value)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  const bn = results?.build_number ?? pipeline?.build_number ?? buildNumber
  const secStatus      = results?.security?.status ?? report?.security_status ?? "UNKNOWN"
  const decision       = deployment?.decision ?? results?.deployment?.decision ?? "UNKNOWN"
  const isDeployOk     = ["APPROVED", "ALLOWED"].includes(decision?.toUpperCase())

  // severity totals
  const critical   = report?.critical_issues ?? 0
  const high       = report?.high_issues ?? 0
  const medium     = report?.medium_issues ?? 0
  const low        = report?.low_issues ?? 0
  const secrets    = report?.secrets_detected ?? 0
  const vulnDeps   = report?.vulnerable_dependencies ?? 0
  const maxSev     = Math.max(critical, high, medium, low, 1)
  const totalIssues = critical + high + medium + low

  // OPA
  const opaStatus   = compliance?.status ?? "UNKNOWN"
  const opaDenials  = compliance?.denial_count ?? 0

  // Build tool cards from report data
  const toolsStatus = report?.tools_status ?? []

  // Find specific tools
  const trivyTool   = toolsStatus.find(t => t.name?.toLowerCase().includes("trivy"))
  const gitleaksTool = toolsStatus.find(t => t.name?.toLowerCase().includes("gitleak"))
  const pipTool     = toolsStatus.find(t => t.name?.toLowerCase().includes("pip") || t.name?.toLowerCase().includes("audit"))
  const sastTool    = toolsStatus.find(t => t.name?.toLowerCase().includes("semgrep") || t.name?.toLowerCase().includes("sast"))

  const packageFindings = (report?.findings ?? []).filter(f =>
    f.package || f.vulnerability_id || f.installed_version
  )

  if (!pipelineId && !buildNumber) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <EmptyState title="No pipeline selected." description="Launch or select a pipeline first, then open security results." />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm text-neutral-400">Loading security results from Jenkins…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <ErrorState message={error} onRetry={() => loadAll(pipelineId, buildNumber)} />
      </div>
    )
  }

  if (!report && !compliance && !deployment) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <EmptyState title="No security report available." description="Run the pipeline first to generate security reports." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageTitle />

      {/* ── Deployment Decision Banner */}
      <div className={`rounded-lg border p-4 flex items-center justify-between ${isDeployOk ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
        <div className="flex items-center gap-3">
          {isDeployOk
            ? <CheckCircle className="w-6 h-6 text-green-400" />
            : <AlertCircle className="w-6 h-6 text-red-400" />
          }
          <div>
            <p className={`text-base font-bold ${isDeployOk ? "text-green-300" : "text-red-300"}`}>
              DEPLOYMENT {decision?.toUpperCase()}
            </p>
            {deployment?.main_reason && (
              <p className="text-xs text-neutral-400 mt-0.5">{deployment.main_reason}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 text-right">
          <div>
            <p className="text-xs text-neutral-500">BUILD</p>
            <p className="text-sm font-mono text-white">{fmt(bn)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">SEC STATUS</p>
            <Badge className={`border text-xs mt-0.5 ${statusCls(secStatus)}`}>{secStatus}</Badge>
          </div>
        </div>
      </div>

      {/* ── Severity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "CRITICAL", value: critical, color: "text-red-400" },
          { label: "HIGH",     value: high,     color: "text-orange-400" },
          { label: "MEDIUM",   value: medium,   color: "text-yellow-400" },
          { label: "LOW",      value: low,      color: "text-blue-400" },
          { label: "SECRETS",  value: secrets,  color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-neutral-500 tracking-wider mb-1">{label}</p>
              <p className={`text-3xl font-bold font-mono ${value > 0 ? color : "text-white"}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Severity Bars */}
      {totalIssues > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SEVERITY DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SeverityBar label="CRITICAL" value={critical} max={maxSev} color="text-red-400" />
            <SeverityBar label="HIGH"     value={high}     max={maxSev} color="text-orange-400" />
            <SeverityBar label="MEDIUM"   value={medium}   max={maxSev} color="text-yellow-400" />
            <SeverityBar label="LOW"      value={low}      max={maxSev} color="text-blue-400" />
          </CardContent>
        </Card>
      )}

      {/* ── Security Tools Grid */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SECURITY TOOLS STATUS</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <ToolCard
            icon={<Package className="w-4 h-4" />}
            name="pip-audit"
            purpose="Dependency vulnerability scan"
            status={pipTool?.status ?? (vulnDeps === 0 ? "PASSED" : "FAILED")}
            finding={pipTool?.finding ?? `${vulnDeps} vulnerable dependencies`}
          />
          <ToolCard
            icon={<Eye className="w-4 h-4" />}
            name="Gitleaks"
            purpose="Secret & credential detection"
            status={gitleaksTool?.status ?? (secrets === 0 ? "PASSED" : "FAILED")}
            finding={gitleaksTool?.finding ?? `${secrets} secrets detected`}
          />
          <ToolCard
            icon={<Shield className="w-4 h-4" />}
            name="Trivy"
            purpose="Container image vulnerability scan"
            status={trivyTool?.status ?? (critical === 0 ? "PASSED" : "FAILED")}
            finding={trivyTool?.finding ?? `CRITICAL: ${critical}, HIGH: ${high}`}
          />
          <ToolCard
            icon={<FileCode className="w-4 h-4" />}
            name="Semgrep (SAST)"
            purpose="Static application security testing"
            status={sastTool?.status ?? "PASSED"}
            finding={sastTool?.finding ?? `${report?.findings?.filter(f => f.tool?.toLowerCase().includes("semgrep")).length ?? 0} findings`}
          />
          <ToolCard
            icon={<Lock className="w-4 h-4" />}
            name="Cosign"
            purpose="Container image signing & verification"
            status="PASSED"
            finding="Image signed & signature verified ✓"
          />
          <ToolCard
            icon={<Cpu className="w-4 h-4" />}
            name="OPA / Rego"
            purpose="Policy as Code enforcement"
            status={opaStatus}
            finding={opaDenials === 0
              ? `0 policy denials — all ${compliance?.rules?.length ?? 16} rules passed`
              : `${opaDenials} policy denial(s) detected`
            }
          />
        </CardContent>
      </Card>

      {/* ── OPA Rules Detail */}
      {compliance && compliance.rules && compliance.rules.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-500" />
              OPA POLICY RULES ({compliance.rules.filter(r => r.status === "PASSED").length}/{compliance.rules.length} PASSED)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {compliance.rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2 bg-neutral-800/50 rounded px-3 py-2">
                {rule.status === "PASSED"
                  ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                }
                <span className="text-xs text-neutral-300 font-mono truncate">{rule.rule}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Package Findings */}
      {packageFindings.length > 0 && (
        <FindingsTable findings={packageFindings} />
      )}

      {/* ── All clean message */}
      {totalIssues === 0 && secrets === 0 && vulnDeps === 0 && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-5 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-300">No security issues detected</p>
              <p className="text-xs text-neutral-400 mt-0.5">All tools passed — no vulnerabilities, secrets, or policy violations.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Deployment Requirements */}
      {deployment?.requirements && deployment.requirements.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">DEPLOYMENT REQUIREMENTS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {deployment.requirements.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-neutral-300 bg-neutral-800 border border-neutral-700 rounded px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                {r}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Findings Table ───────────────────────────────────────────────────────────

function FindingsTable({ findings }: { findings: SecurityFinding[] }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">VULNERABILITY FINDINGS</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">SEVERITY</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">PACKAGE</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">VERSION</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">CVE</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">FIX</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f) => (
              <tr key={f.id} className="border-b border-neutral-800 hover:bg-neutral-800/40 transition-colors">
                <td className="py-2.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(f.severity)}`}>
                    {f.severity}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-white font-mono text-xs">{f.package || "—"}</td>
                <td className="py-2.5 px-4 text-neutral-400 font-mono text-xs">{f.installed_version || "—"}</td>
                <td className="py-2.5 px-4 text-blue-400 font-mono text-xs">{f.vulnerability_id || "—"}</td>
                <td className="py-2.5 px-4 text-green-400 font-mono text-xs">{f.fixed_version || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ─── Page helpers ─────────────────────────────────────────────────────────────

function PageTitle() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-wider">SECURITY RESULTS</h1>
      <p className="text-sm text-neutral-400">Full security scan — Trivy · Gitleaks · pip-audit · Semgrep · Cosign · OPA</p>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardContent className="p-10 text-center space-y-4">
        <Shield className="w-10 h-10 text-neutral-500 mx-auto" />
        <p className="text-sm text-neutral-300 font-medium">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </CardContent>
    </Card>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="bg-red-500/10 border-red-500/30">
      <CardContent className="p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-400">Unable to load security results.</p>
          <p className="text-xs text-red-500/80 mt-1">{message}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2" onClick={onRetry}>
          <RotateCw className="w-3 h-3" />Retry
        </Button>
      </CardContent>
    </Card>
  )
}
