"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  AlertCircle,
  Download,
  ExternalLink,
  Zap,
  Brain,
  Loader2,
  RotateCw,
} from "lucide-react"
import {
  getAIRecommendations,
  type AIRecommendationsReport,
  type Recommendation,
  type ActionStep,
  type DeploymentAssistant,
  type AnalysisContext,
} from "@/services/api"

// ─── Real API Integration ───────────────────────────────────────────────────────
// Uses getAIRecommendations(buildNumber) from the backend platform.
// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Jenkins build number used to load the AI report. */
  buildNumber?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "Critical": return "bg-red-500/20 text-red-500"
    case "High":     return "bg-orange-500/20 text-orange-500"
    case "Medium":   return "bg-yellow-500/20 text-yellow-500"
    case "Low":      return "bg-neutral-500/20 text-neutral-400"
    default:         return "bg-neutral-500/20 text-neutral-400"
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "Security":     return "bg-red-500/10 text-red-400"
    case "Tests":        return "bg-blue-500/10 text-blue-400"
    case "Code Quality": return "bg-purple-500/10 text-purple-400"
    case "Dependencies": return "bg-green-500/10 text-green-400"
    default:             return "bg-neutral-500/10 text-neutral-400"
  }
}

function getDeploymentImpactColor(impact: string): string {
  if (impact.includes("Blocks"))          return "bg-red-500/20 text-red-500"
  if (impact.includes("Should be fixed")) return "bg-orange-500/20 text-orange-500"
  if (impact.includes("May block"))       return "bg-yellow-500/20 text-yellow-500"
  return "bg-neutral-500/20 text-neutral-400"
}

// Compute priority bar width as % of total recommendations
function priorityBarWidth(count: number, total: number): string {
  if (total === 0) return "0%"
  return `${Math.round((count / total) * 100)}%`
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function KpiCards({ report }: { report: AIRecommendationsReport }) {
  const assistantDecision = report.deployment_assistant?.decision ?? "N/A"
  const isBlocked         = report.deployment_assistant?.deployment_blocked ?? false

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {/* Total */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {report.total_recommendations}
            </div>
            <div className="text-xs text-neutral-400">Total Recommendations</div>
          </div>
        </CardContent>
      </Card>

      {/* Critical */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30">
                {report.critical_count}
              </Badge>
            </div>
            <div className="text-xs text-neutral-400">Critical Priority</div>
          </div>
        </CardContent>
      </Card>

      {/* High */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                {report.high_count}
              </Badge>
            </div>
            <div className="text-xs text-neutral-400">High Priority</div>
          </div>
        </CardContent>
      </Card>

      {/* Medium */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                {report.medium_count}
              </Badge>
            </div>
            <div className="text-xs text-neutral-400">Medium Priority</div>
          </div>
        </CardContent>
      </Card>

      {/* Low */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Badge variant="secondary" className="bg-neutral-500/20 text-neutral-400 border-neutral-500/30">
                {report.low_count}
              </Badge>
            </div>
            <div className="text-xs text-neutral-400">Low Priority</div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Badge
                variant="destructive"
                className={
                  isBlocked
                    ? "bg-red-500/20 text-red-500 border-red-500/30"
                    : "bg-white/20 text-white border-white/30"
                }
              >
                {isBlocked ? "Blocked" : "Allowed"}
              </Badge>
            </div>
            <div className="text-xs text-neutral-400">Deployment Impact</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalysisContextCard({ context }: { context: AnalysisContext }) {
  return (
    <Card className="bg-neutral-900 border-neutral-800 mb-8">
      <CardHeader>
        <CardTitle className="text-white">Analysis Context</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-neutral-400 mb-1">Project</div>
            <div className="text-sm text-white font-mono">{context.project || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">Branch</div>
            <div className="text-sm text-white font-mono">{context.branch || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">Language</div>
            <div className="text-sm text-white font-mono">{context.language || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">Jenkins Build</div>
            <div className="text-sm text-white font-mono">{context.build_number || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">AI Mode</div>
            <div className="text-sm text-white font-mono">{context.ai_mode || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">Generated At</div>
            <div className="text-sm text-white font-mono">{context.generated_at || "N/A"}</div>
          </div>
        </div>

        {context.reports_analyzed && context.reports_analyzed.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="text-xs text-neutral-400 mb-2">Reports Analyzed:</div>
            <div className="flex flex-wrap gap-2">
              {context.reports_analyzed.map((rep) => (
                <Badge key={rep} variant="secondary" className="bg-neutral-800 text-neutral-300 border-neutral-700">
                  {rep}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-400">
            <span className="text-blue-400">ℹ</span>{" "}
            The AI module interprets DevSecOps reports and suggests improvements. Final validation remains based on Jenkins, SonarQube, and security scan results.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function PriorityOverview({ report }: { report: AIRecommendationsReport }) {
  const total = report.total_recommendations || 1

  const bars = [
    { label: "Critical", count: report.critical_count, color: "bg-red-500" },
    { label: "High",     count: report.high_count,     color: "bg-orange-500" },
    { label: "Medium",   count: report.medium_count,   color: "bg-yellow-500" },
    { label: "Low",      count: report.low_count,      color: "bg-neutral-600" },
  ]

  return (
    <Card className="bg-neutral-900 border-neutral-800 mb-8">
      <CardHeader>
        <CardTitle className="text-white">Recommendation Priority Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bars.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-neutral-300">{item.label}</span>
                <span className="text-sm font-mono text-neutral-400">{item.count}</span>
              </div>
              <div className="w-full bg-neutral-800 rounded h-2">
                <div
                  className={`${item.color} h-2 rounded transition-all duration-500`}
                  style={{ width: priorityBarWidth(item.count, total) }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecommendedImprovements({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Recommended Improvements</h2>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-10 text-center">
            <Brain className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
            <p className="text-sm text-neutral-400">No recommendations generated for this pipeline.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Recommended Improvements</h2>
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="bg-neutral-900 border-neutral-800">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex gap-3 flex-1">
                  <div className={`px-3 py-2 rounded text-sm font-semibold ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(rec.category)}`}>
                        {rec.category}
                      </span>
                      <span className="text-xs text-neutral-500">{rec.relatedTool}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-2">{rec.problem}</h3>
                    <p className="text-sm text-neutral-400 mb-3">{rec.explanation}</p>
                    <div className="bg-neutral-800/50 p-3 rounded mb-3 border border-neutral-700">
                      <p className="text-xs text-neutral-300">
                        <span className="font-semibold text-orange-500">Suggested: </span>
                        {rec.suggestion}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-medium inline-block ${getDeploymentImpactColor(rec.deploymentImpact)}`}>
                      {rec.deploymentImpact}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ActionPlan({ steps }: { steps: ActionStep[] }) {
  if (steps.length === 0) return null

  return (
    <Card className="bg-neutral-900 border-neutral-800 mb-8">
      <CardHeader>
        <CardTitle className="text-white">Suggested Action Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 font-semibold text-sm">
                  {step.step}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">{step.title}</h4>
                <ul className="space-y-1">
                  {step.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-neutral-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DeploymentDecisionCard({ assistant }: { assistant: DeploymentAssistant }) {
  const isBlocked = assistant.deployment_blocked

  return (
    <Card className={`bg-neutral-900 border-neutral-800 mb-8 ${isBlocked ? "border-red-500/30" : "border-white/20"}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            {isBlocked
              ? <AlertTriangle className="w-5 h-5 text-red-500" />
              : <AlertCircle className="w-5 h-5 text-white" />
            }
            Deployment Decision Assistant
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-neutral-400 mb-1">Current Decision</div>
            <div className="flex items-center gap-2">
              <Badge
                variant="destructive"
                className={
                  isBlocked
                    ? "bg-red-500/20 text-red-500 border-red-500/30"
                    : "bg-white/20 text-white border-white/30"
                }
              >
                {assistant.decision || "N/A"}
              </Badge>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-4">
            <div className="text-xs text-neutral-400 mb-2">Main Reason</div>
            <p className="text-sm text-white">{assistant.main_reason || "N/A"}</p>
          </div>

          {assistant.requirements && assistant.requirements.length > 0 && (
            <div className="border-t border-neutral-800 pt-4">
              <div className="text-xs text-neutral-400 mb-3">Required Before Deployment</div>
              <ul className="space-y-2">
                {assistant.requirements.map((item, idx) => (
                  <li key={idx} className="text-sm text-neutral-300 flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-full ${isBlocked ? "bg-red-500" : "bg-white"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-neutral-800 pt-4">
            <div className="text-xs text-neutral-400 mb-1">Recommended Next Action</div>
            <p className="text-sm text-orange-400">{assistant.next_action || "N/A"}</p>
          </div>

          <p className="text-xs text-neutral-500 pt-4 border-t border-neutral-800">
            <span className="text-blue-400">ℹ</span>{" "}
            The AI assistant does not override DevSecOps rules. It only explains and suggests improvements.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export function AIRecommendationsView({ buildNumber }: Props) {
  type DataSource = "backend" | "fallback" | "unavailable"

  const [report,     setReport]     = useState<AIRecommendationsReport | null>(null)
  const [dataSource, setDataSource] = useState<DataSource>("unavailable")
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    if (!buildNumber) {
      setReport(null)
      setDataSource("unavailable")
      return
    }

    loadRecommendations(buildNumber)
  }, [buildNumber])

  async function loadRecommendations(build: string | number) {
    setLoading(true)
    setError(null)
    try {
      const data = await getAIRecommendations(build)
      setReport(data)
      setDataSource("backend")
    } catch (err: unknown) {
      setError("AI recommendations are not available yet for this pipeline. Ensure the AI Advisor stage completed successfully.")
      setReport(null)
      setDataSource("unavailable")
    } finally {
      setLoading(false)
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold">AI-Assisted Recommendations</h1>
            </div>
            <p className="text-neutral-400 text-lg">
              Understand pipeline reports and get improvement suggestions for code quality, security, tests, and dependencies.
            </p>
          </div>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-12 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm text-neutral-400">
                Loading AI recommendations for build #{buildNumber}...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error && !report) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold">AI-Assisted Recommendations</h1>
            </div>
            <p className="text-neutral-400 text-lg">
              Understand pipeline reports and get improvement suggestions for code quality, security, tests, and dependencies.
            </p>
          </div>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-10 text-center space-y-4">
              <Brain className="w-10 h-10 text-neutral-500 mx-auto" />
              <p className="text-sm text-neutral-300 font-medium">
                AI recommendations are not available yet for this pipeline.
              </p>
              <p className="text-xs text-neutral-500">
                Run the pipeline first or wait until all analysis stages have completed.
              </p>
              {buildNumber && (
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent mt-4"
                  onClick={() => loadRecommendations(buildNumber)}
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!report) return null

  // ─── Full page ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold">AI-Assisted Recommendations</h1>
          </div>
          <p className="text-neutral-400 text-lg">
            Understand pipeline reports and get improvement suggestions for code quality, security, tests, and dependencies.
          </p>
        </div>

        {/* ── KPI Cards ── */}
        <KpiCards report={report} />

        {/* ── Analysis Context ── */}
        <AnalysisContextCard context={report.context} />

        {/* ── Priority Overview ── */}
        <PriorityOverview report={report} />

        {/* ── Recommended Improvements ── */}
        <RecommendedImprovements recommendations={report.recommendations} />

        {/* ── Action Plan ── */}
        <ActionPlan steps={report.action_steps} />

        {/* ── Deployment Decision Assistant ── */}
        <DeploymentDecisionCard assistant={report.deployment_assistant} />

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download AI Summary
          </Button>
          <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Security Results
          </Button>
          <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Code Quality
          </Button>
          <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Test Results
          </Button>
          <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <Zap className="w-4 h-4 mr-2" />
            Re-run Pipeline
          </Button>
        </div>

        {/* ── AI Disclaimer ── */}
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
          <p className="text-xs text-neutral-400">
            <span className="text-blue-400 font-semibold">AI Disclaimer:</span>{" "}
            AI recommendations are generated from pipeline reports to help interpretation and prioritization.
            They should be reviewed by developers and security engineers before applying changes.
          </p>
        </div>

      </div>
    </div>
  )
}
