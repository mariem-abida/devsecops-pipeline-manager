"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, CheckCircle, FlaskConical, Loader2, RotateCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getPipeline,
  getPipelineResults,
  getTestResults,
  type Pipeline,
  type PipelineResults,
  type TestReport,
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
    case "SUCCESS":
    case "PASSED":
      return "bg-white/20 text-white"
    case "FAILED":
    case "FAILURE":
      return "bg-red-500/20 text-red-500"
    case "RUNNING":
      return "bg-orange-500/20 text-orange-400"
    case "WARNING":
    case "WARN":
      return "bg-yellow-500/20 text-yellow-500"
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

export function TestResultsView({ pipelineId, buildNumber }: Props) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [results, setResults] = useState<PipelineResults | null>(null)
  const [report, setReport] = useState<TestReport | null>(null)
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
          const detail = await getTestResults(resolvedBuildNumber)
          setReport(detail)
        } catch {
          setReport(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load test results.")
      setPipeline(null)
      setResults(null)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const aggregate = results?.tests
  const total = aggregate?.total ?? report?.total_tests ?? 0
  const passed = aggregate?.passed ?? report?.passed ?? 0
  const failed = aggregate?.failed ?? report?.failed ?? 0
  const skipped = aggregate?.skipped ?? report?.skipped ?? 0
  const status = aggregate?.status ?? report?.status ?? "UNKNOWN"
  const displayPipelineId = results?.pipeline_id ?? pipeline?.id ?? report?.pipeline_id ?? pipelineId
  const displayBuildNumber = results?.build_number ?? pipeline?.build_number ?? report?.build_number ?? buildNumber
  const hasTestData = Boolean(aggregate || report)
  const successRate = total > 0 ? Math.round((passed / total) * 100) : null

  if (!pipelineId && !buildNumber) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <EmptyState title="No pipeline selected." description="Launch or select a pipeline first, then open the test results." />
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
            <p className="text-sm text-neutral-400">Loading test results...</p>
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

  if (!hasTestData) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <EmptyState title="No test results available for this pipeline." description="Wait until Jenkins publishes the test report, then retry." />
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
            <p className="text-xs text-neutral-400 tracking-wider mb-1">STATUS</p>
            <Badge className={getStatusBadge(status)}>{status}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard label="TOTAL TESTS" value={total} />
        <MetricCard label="PASSED" value={passed} />
        <MetricCard label="FAILED" value={failed} />
        <MetricCard label="SKIPPED" value={skipped} />
        <MetricCard label="SUCCESS RATE" value={successRate === null ? "N/A" : `${successRate}%`} />
        <MetricCard label="SOURCE" value="Jenkins" />
      </div>

      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TEST SUMMARY</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-neutral-400">No test cases were reported in the Jenkins artifact.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Passed / Total</span>
                <span className="text-white font-mono">{passed} / {total}</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-3">
                <div className="bg-white h-3 rounded-full transition-all duration-500" style={{ width: `${successRate ?? 0}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {report?.failed_tests && report.failed_tests.length > 0 ? (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">FAILED TEST CASES</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">TEST</th>
                  <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">FILE</th>
                  <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">ERROR</th>
                  <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">DURATION</th>
                </tr>
              </thead>
              <tbody>
                {report.failed_tests.map((test) => (
                  <tr key={test.id} className="border-b border-neutral-800">
                    <td className="py-3 px-4 text-white font-mono">{test.name}</td>
                    <td className="py-3 px-4 text-neutral-300 font-mono">{test.file}</td>
                    <td className="py-3 px-4 text-neutral-300">{test.error}</td>
                    <td className="py-3 px-4 text-neutral-300 font-mono">{test.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-white" />
            <p className="text-sm text-neutral-300">No failed test cases reported.</p>
          </CardContent>
        </Card>
      )}

      {report?.passed_categories && report.passed_categories.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PASSED CATEGORIES FROM JUNIT</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.passed_categories.map((category) => (
              <div key={category.name} className="p-4 bg-neutral-800 rounded border border-neutral-700">
                <p className="text-sm text-white mb-2">{category.name}</p>
                <p className="text-2xl font-bold text-white font-mono">{category.passed}/{category.total}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PageTitle() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-wider">TEST RESULTS</h1>
      <p className="text-sm text-neutral-400">Real automated test results saved from Jenkins.</p>
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
        <FlaskConical className="w-10 h-10 text-neutral-500 mx-auto" />
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
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-400">Unable to load test results.</p>
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
