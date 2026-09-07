"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  RotateCw,
  Scale,
  ShieldCheck,
  ShieldAlert,
  FileCode2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getComplianceReport,
  getPipeline,
  type ComplianceReport,
  type PolicyRule,
} from "@/services/api"

interface Props {
  pipelineId?: number
  buildNumber?: string
}

function RuleIcon({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case "PASSED": return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
    case "FAILED": return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
    default: return <MinusCircle className="w-4 h-4 text-neutral-500 flex-shrink-0" />
  }
}

function RuleBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    PASSED: "bg-green-500/20 text-green-400 border-green-500/30",
    FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
    SKIPPED: "bg-neutral-700 text-neutral-400 border-neutral-600",
  }
  const cls = colorMap[status?.toUpperCase()] ?? "bg-neutral-700 text-neutral-400"
  return <Badge className={`${cls} border text-xs font-mono`}>{status}</Badge>
}

function PolicyRuleRow({ rule }: { rule: PolicyRule }) {
  const bgMap: Record<string, string> = {
    PASSED: "border-l-2 border-green-500/50",
    FAILED: "border-l-2 border-red-500/60 bg-red-500/5",
    SKIPPED: "border-l-2 border-neutral-700",
  }
  const cls = bgMap[rule.status?.toUpperCase()] ?? ""

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg bg-neutral-800/40 ${cls}`}>
      <RuleIcon status={rule.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-white">{rule.rule}</p>
          <RuleBadge status={rule.status} />
        </div>
        <p className="text-xs text-neutral-400">{rule.description}</p>
        {rule.details && rule.details !== "OK" && (
          <p className="text-xs text-neutral-500 mt-1 font-mono bg-neutral-900 rounded px-2 py-1 break-all">
            {rule.details}
          </p>
        )}
      </div>
    </div>
  )
}

export function ComplianceView({ pipelineId, buildNumber }: Props) {
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRawInput, setShowRawInput] = useState(false)

  useEffect(() => {
    if (!pipelineId && !buildNumber) return
    load()
  }, [pipelineId, buildNumber])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      let bn = buildNumber
      if (!bn && pipelineId) {
        const pipe = await getPipeline(pipelineId)
        bn = pipe.build_number ?? undefined
      }
      if (!bn) throw new Error("No build number available.")
      const data = await getComplianceReport(bn)
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load compliance report")
    } finally {
      setLoading(false)
    }
  }

  if (!pipelineId && !buildNumber) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <EmptyState title="No pipeline selected." description="Launch or select a pipeline first, then open compliance results." />
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
            <p className="text-sm text-neutral-400">Evaluating OPA policy results…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  if (!report) return null

  const passed = report.rules.filter((r) => r.status === "PASSED").length
  const failed = report.rules.filter((r) => r.status === "FAILED").length
  const skipped = report.rules.filter((r) => r.status === "SKIPPED").length

  return (
    <div className="p-6 space-y-6">
      <PageTitle />

      {/* Overall Verdict Banner */}
      <Card className={report.deployment_allowed
        ? "bg-green-500/10 border-green-500/30"
        : "bg-red-500/10 border-red-500/30"
      }>
        <CardContent className="p-5 flex items-center gap-4">
          {report.deployment_allowed
            ? <ShieldCheck className="w-8 h-8 text-green-400 flex-shrink-0" />
            : <ShieldAlert className="w-8 h-8 text-red-400 flex-shrink-0" />
          }
          <div>
            <p className={`text-lg font-bold ${report.deployment_allowed ? "text-green-300" : "text-red-300"}`}>
              {report.deployment_allowed ? "DEPLOYMENT ALLOWED" : "DEPLOYMENT BLOCKED"}
            </p>
            <p className="text-sm text-neutral-400">
              {report.deployment_allowed
                ? "All policy rules passed. Ready to deploy."
                : `${report.denial_count} policy violation${report.denial_count !== 1 ? "s" : ""} detected by OPA.`
              }
            </p>
          </div>
          <div className="ml-auto">
            <Badge className={report.deployment_allowed
              ? "bg-green-500/30 text-green-300 border-green-500/50 border text-sm px-3 py-1"
              : "bg-red-500/30 text-red-300 border-red-500/50 border text-sm px-3 py-1"
            }>
              {report.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard label="RULES PASSED" value={passed} color="text-green-400" />
        <StatCard label="RULES FAILED" value={failed} color="text-red-400" />
        <StatCard label="SKIPPED" value={skipped} color="text-neutral-400" />
        <StatCard label="DENIALS" value={report.denial_count} color={report.denial_count > 0 ? "text-red-400" : "text-green-400"} />
        <div className="col-span-1 md:col-span-2">
          <Card className="bg-neutral-900 border-neutral-700 h-full">
            <CardContent className="p-3 h-full flex flex-col justify-center">
              <p className="text-xs text-neutral-400 tracking-wider mb-1">POLICY ENGINE</p>
              <p className="text-sm font-semibold text-white">{report.tool}</p>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">{report.policy_file}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Denial messages */}
      {report.denials.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-400 tracking-wider flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              POLICY VIOLATIONS ({report.denials.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.denials.map((d, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-red-500/10 rounded border border-red-500/20">
                <span className="text-red-500 font-bold text-xs mt-0.5">✕</span>
                <p className="text-sm text-red-300 font-mono">{d}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rules list */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            POLICY RULES EVALUATION
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.rules.map((rule, i) => (
            <PolicyRuleRow key={i} rule={rule} />
          ))}
        </CardContent>
      </Card>

      {/* Policy Input (raw) */}
      {Object.keys(report.policy_input).length > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                <FileCode2 className="w-4 h-4" />
                POLICY INPUT (security-policy-input.json)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-500 hover:text-white text-xs"
                onClick={() => setShowRawInput(!showRawInput)}
              >
                {showRawInput ? "Hide" : "Show"}
              </Button>
            </div>
          </CardHeader>
          {showRawInput && (
            <CardContent>
              <pre className="text-xs text-neutral-400 font-mono bg-neutral-950 rounded p-4 overflow-x-auto">
                {JSON.stringify(report.policy_input, null, 2)}
              </pre>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardContent className="p-3">
        <p className="text-xs text-neutral-400 tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function PageTitle() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-wider">COMPLIANCE & POLICY</h1>
      <p className="text-sm text-neutral-400">Open Policy Agent (OPA) — Policy-as-Code evaluation via Rego rules.</p>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardContent className="p-10 text-center space-y-4">
        <Scale className="w-10 h-10 text-neutral-500 mx-auto" />
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
          <p className="text-sm font-medium text-red-400">Unable to load compliance report.</p>
          <p className="text-xs text-red-500/80 mt-1">{message}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2" onClick={onRetry}>
          <RotateCw className="w-3 h-3" />Retry
        </Button>
      </CardContent>
    </Card>
  )
}
