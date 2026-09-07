"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Code2, Loader2, RotateCw, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getCodeQualityResults,
  getPipeline,
  getPipelineResults,
  type CodeIssue,
  type CodeQualityReport,
  type Pipeline,
  type PipelineResults,
} from "@/services/api"

interface Props {
  pipelineId?: number
  buildNumber?: string
}

function formatBuildNumber(buildNumber?: string | null): string {
  if (!buildNumber) return "N/A"
  return buildNumber.startsWith("#") ? buildNumber : `#${buildNumber}`
}

function getStatusBadge(status?: string): string {
  switch (status?.toUpperCase()) {
    case "PASSED":
    case "SUCCESS":
      return "bg-white/20 text-white"
    case "FAILED":
    case "FAILURE":
      return "bg-red-500/20 text-red-500"
    case "WARNING":
    case "WARN":
      return "bg-yellow-500/20 text-yellow-500"
    case "UNKNOWN":
      return "bg-neutral-700 text-neutral-400"
    default:
      return "bg-neutral-700 text-neutral-400"
  }
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardContent className="p-4">
        <p className="text-xs text-neutral-400 tracking-wider mb-2">{label}</p>
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
      </CardContent>
    </Card>
  )
}

export function CodeQualityView({ pipelineId, buildNumber }: Props) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [results, setResults] = useState<PipelineResults | null>(null)
  const [report, setReport] = useState<CodeQualityReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pipelineId && !buildNumber) {
      setPipeline(null)
      setResults(null)
      setReport(null)
      setError(null)
      return
    }

    loadResults(pipelineId, buildNumber)
  }, [pipelineId, buildNumber])

  async function loadResults(id?: number, providedBuild?: string) {
    setLoading(true)
    setError(null)
    try {
      let resolvedBuildNumber = providedBuild

      if (id) {
        const [pipelineData, consolidated] = await Promise.all([
          getPipeline(id),
          getPipelineResults(id),
        ])
        setPipeline(pipelineData)
        setResults(consolidated)
        resolvedBuildNumber = resolvedBuildNumber ?? pipelineData.build_number
      }

      if (resolvedBuildNumber) {
        try {
          const detail = await getCodeQualityResults(resolvedBuildNumber)
          setReport(detail)
        } catch {
          setReport(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load code quality results.")
      setPipeline(null)
      setResults(null)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const aggregate = results?.quality
  const issueCount = aggregate?.issue_count ?? report?.code_issues?.length ?? report?.code_smells ?? report?.bugs ?? 0
  const status = aggregate?.status ?? report?.quality_gate ?? "UNKNOWN"
  const displayPipelineId = results?.pipeline_id ?? pipeline?.id ?? report?.pipeline_id ?? pipelineId
  const displayBuildNumber = results?.build_number ?? pipeline?.build_number ?? report?.build_number ?? buildNumber
  const codeIssues = report?.code_issues ?? []
  const hasQualityData = Boolean(aggregate || report)

  if (!pipelineId && !buildNumber) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <EmptyState title="No pipeline selected." description="Launch or select a pipeline first, then open code quality results." />
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
            <p className="text-sm text-neutral-400">Loading code quality results...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <ErrorState message={error} onRetry={() => loadResults(pipelineId, buildNumber)} />
      </div>
    )
  }

  if (!hasQualityData) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <EmptyState title="No code quality report available." description="Wait until Jenkins publishes the quality report, then retry." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageTitle />

      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PIPELINE RESULT CONTEXT</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Info label="PIPELINE ID" value={displayPipelineId ?? "N/A"} />
          <Info label="JENKINS BUILD" value={formatBuildNumber(displayBuildNumber)} />
          <div>
            <p className="text-xs text-neutral-400 tracking-wider mb-1">QUALITY GATE</p>
            <Badge className={getStatusBadge(status)}>{status}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="QUALITY GATE" value={status} />
        <MetricCard label="QUALITY SCORE" value={report?.quality_score != null ? `${report.quality_score}%` : "N/A"} />
        <MetricCard label="COVERAGE" value={report?.coverage != null ? `${report.coverage}%` : "N/A"} />
        <MetricCard label="DUPLICATION" value={report?.duplication != null ? `${report.duplication}%` : "N/A"} />
        <MetricCard label="TECH DEBT" value={report?.tech_debt ? `${report.tech_debt} min` : "0 min"} />
        
        <MetricCard label="MAINTAINABILITY" value={report?.maintainability_rating ?? "N/A"} />
        <MetricCard label="SECURITY RATING" value={report?.security_rating ?? "N/A"} />
        <MetricCard label="VULNERABILITIES" value={report?.vulnerabilities ?? "0"} />
        <MetricCard label="BUGS" value={report?.bugs ?? "0"} />
        <MetricCard label="CODE SMELLS" value={report?.code_smells ?? "0"} />
      </div>

      {issueCount === 0 ? (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-white" />
            <p className="text-sm text-neutral-300">No quality issues detected.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">{issueCount} quality issue{issueCount === 1 ? "" : "s"} reported by the backend summary.</p>
              {codeIssues.length === 0 && (
                <p className="text-xs text-neutral-500 mt-1">No line-level quality details were provided in the parsed report.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {codeIssues.length > 0 && <CodeIssuesTable issues={codeIssues} />}
    </div>
  )
}

function CodeIssuesTable({ issues }: { issues: CodeIssue[] }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PARSED QUALITY ISSUES</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">TYPE</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">SEVERITY</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">FILE</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">LINE</th>
              <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">MESSAGE</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-b border-neutral-800">
                <td className="py-3 px-4 text-white">{issue.type}</td>
                <td className="py-3 px-4 text-neutral-300">{issue.severity}</td>
                <td className="py-3 px-4 text-neutral-300 font-mono">{issue.file}</td>
                <td className="py-3 px-4 text-neutral-300 font-mono">{issue.line}</td>
                <td className="py-3 px-4 text-neutral-300">{issue.description || issue.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function PageTitle() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-wider">CODE QUALITY</h1>
      <p className="text-sm text-neutral-400">Real code quality result saved from Jenkins.</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-neutral-400 tracking-wider mb-1">{label}</p>
      <p className="text-sm text-white font-mono">{value}</p>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardContent className="p-10 text-center space-y-4">
        <Code2 className="w-10 h-10 text-neutral-500 mx-auto" />
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
          <p className="text-sm font-medium text-red-400">Unable to load code quality results.</p>
          <p className="text-xs text-red-500/80 mt-1">{message}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2" onClick={onRetry}>
          <RotateCw className="w-3 h-3" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}
