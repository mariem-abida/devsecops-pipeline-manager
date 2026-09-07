"use client"

import { useEffect, useState, useMemo } from "react"
import {
  AlertCircle, CheckCircle, XCircle,
  Loader2, RotateCw, PackageSearch,
  Shield, Search, ChevronDown, ChevronUp,
  Download, Box,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getSBOMReport,
  getPipeline,
  type SBOMReport,
  type SBOMComponent,
} from "@/services/api"

interface Props {
  pipelineId?: number
  buildNumber?: string
}

// ─── Color palette ────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; fill: string; badge: string }> = {
  library:          { bg: "bg-blue-500/20",   fill: "#3b82f6", badge: "bg-blue-500/20 text-blue-400" },
  framework:        { bg: "bg-purple-500/20", fill: "#a855f7", badge: "bg-purple-500/20 text-purple-400" },
  "operating-system": { bg: "bg-orange-500/20", fill: "#f97316", badge: "bg-orange-500/20 text-orange-400" },
  container:        { bg: "bg-cyan-500/20",   fill: "#06b6d4", badge: "bg-cyan-500/20 text-cyan-400" },
  application:      { bg: "bg-green-500/20",  fill: "#22c55e", badge: "bg-green-500/20 text-green-400" },
  device:           { bg: "bg-yellow-500/20", fill: "#eab308", badge: "bg-yellow-500/20 text-yellow-400" },
}

const FALLBACK_FILLS = ["#f97316","#3b82f6","#a855f7","#22c55e","#06b6d4","#eab308","#ec4899","#14b8a6"]

function typeStyle(type: string) {
  return TYPE_COLORS[type] ?? {
    bg: "bg-neutral-700",
    fill: "#71717a",
    badge: "bg-neutral-700 text-neutral-400",
  }
}

// ─── Donut Chart (pure SVG) ───────────────────────────────────────────────────

function DonutChart({
  data,
  total,
}: {
  data: { label: string; count: number; fill: string }[]
  total: number
}) {
  const SIZE = 160
  const STROKE = 28
  const R = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * R
  const CX = SIZE / 2

  let offset = 0
  const slices = data.map((d, i) => {
    const pct = total > 0 ? d.count / total : 0
    const dash = pct * CIRC
    const slice = { ...d, dash, offset, index: i }
    offset += dash
    return slice
  })

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={CX} cy={CX} r={R}
          fill="none"
          stroke="#262626"
          strokeWidth={STROKE}
        />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={CX} cy={CX} r={R}
            fill="none"
            stroke={s.fill}
            strokeWidth={STROKE}
            strokeDasharray={`${s.dash} ${CIRC - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        ))}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white font-mono">{total}</span>
        <span className="text-xs text-neutral-500">components</span>
      </div>
    </div>
  )
}

// ─── License Horizontal Bar ───────────────────────────────────────────────────

function LicenseBar({ license, count, max, index }: { license: string; count: number; max: number; index: number }) {
  const colors = ["#f97316","#3b82f6","#a855f7","#22c55e","#06b6d4","#eab308","#ec4899","#14b8a6"]
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-400 font-mono w-28 flex-shrink-0 truncate" title={license}>{license}</span>
      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: colors[index % colors.length] }}
        />
      </div>
      <span className="text-xs text-neutral-300 font-mono w-6 text-right flex-shrink-0">{count}</span>
    </div>
  )
}

// ─── Component Row ────────────────────────────────────────────────────────────

function ComponentRow({ comp, idx }: { comp: SBOMComponent; idx: number }) {
  const [open, setOpen] = useState(false)
  const style = typeStyle(comp.type)
  return (
    <>
      <tr
        className={`border-b border-neutral-800 hover:bg-neutral-800/40 cursor-pointer transition-colors ${idx % 2 === 0 ? "" : "bg-neutral-900/30"}`}
        onClick={() => setOpen(!open)}
      >
        <td className="py-2.5 px-4 text-white font-mono text-xs">{comp.name}</td>
        <td className="py-2.5 px-4 text-neutral-400 font-mono text-xs">{comp.version || "—"}</td>
        <td className="py-2.5 px-4">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.badge}`}>{comp.type}</span>
        </td>
        <td className="py-2.5 px-4 text-neutral-400 text-xs">
          {comp.licenses.length > 0 ? comp.licenses.join(", ") : "—"}
        </td>
        <td className="py-2.5 px-4 text-neutral-600">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </td>
      </tr>
      {open && comp.purl && (
        <tr className="bg-neutral-800/60 border-b border-neutral-800">
          <td colSpan={5} className="px-4 py-2">
            <p className="text-xs text-neutral-500 font-mono break-all">
              <span className="text-neutral-400 mr-2">PURL:</span>{comp.purl}
            </p>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function SBOMView({ pipelineId, buildNumber }: Props) {
  const [report, setReport]   = useState<SBOMReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState("")
  const [activeType, setActiveType] = useState<string | null>(null)

  useEffect(() => {
    if (!pipelineId && !buildNumber) return
    load()
  }, [pipelineId, buildNumber])

  async function load() {
    setLoading(true); setError(null)
    try {
      let bn = buildNumber
      if (!bn && pipelineId) {
        const pipe = await getPipeline(pipelineId)
        bn = pipe.build_number ?? undefined
      }
      if (!bn) throw new Error("No build number available.")
      const data = await getSBOMReport(bn)
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load SBOM report")
    } finally {
      setLoading(false)
    }
  }

  // Donut data
  const donutData = useMemo(() => {
    if (!report) return []
    return report.type_distribution.map((t, i) => ({
      label: t.label,
      count: t.count,
      fill: TYPE_COLORS[t.label]?.fill ?? FALLBACK_FILLS[i % FALLBACK_FILLS.length],
    }))
  }, [report])

  // Filtered components
  const filtered = useMemo(() => {
    if (!report) return []
    return report.components.filter(c => {
      const matchType = !activeType || c.type === activeType
      const matchSearch = !search || (
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.version.toLowerCase().includes(search.toLowerCase()) ||
        c.type.toLowerCase().includes(search.toLowerCase())
      )
      return matchType && matchSearch
    })
  }, [report, search, activeType])

  const maxLicense = report ? Math.max(...(report.licenses.map(l => l.count)), 1) : 1

  if (!pipelineId && !buildNumber) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle />
        <EmptyState title="No pipeline selected." description="Launch or select a pipeline first, then open the SBOM viewer." />
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
            <p className="text-sm text-neutral-400">Loading SBOM from Jenkins artifact…</p>
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

  return (
    <div className="p-6 space-y-6">
      <PageTitle />

      {/* ── Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-500 tracking-wider mb-1">STATUS</p>
            <Badge className={`border text-xs ${report.status === "PASSED" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}>
              {report.status}
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-500 tracking-wider mb-1">COMPONENTS</p>
            <p className="text-2xl font-bold text-white font-mono">{report.component_count}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-500 tracking-wider mb-1">FORMAT</p>
            <p className="text-sm font-semibold text-white">{report.format}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-500 tracking-wider mb-1">TOOL</p>
            <p className="text-sm font-semibold text-white">{report.tool}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Scanned image */}
      {report.image && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Box className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">SCANNED IMAGE</p>
              <p className="text-sm font-mono text-white break-all">{report.image}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Donut + legend */}
        {donutData.length > 0 && (
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">COMPONENT TYPES</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <DonutChart data={donutData} total={report.component_count} />
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {donutData.map((d) => {
                  const pct = report.component_count > 0 ? Math.round((d.count / report.component_count) * 100) : 0
                  const isActive = activeType === d.label
                  return (
                    <button
                      key={d.label}
                      onClick={() => setActiveType(isActive ? null : d.label)}
                      className={`flex items-center gap-2 w-full text-left rounded px-2 py-1 transition-colors ${isActive ? "bg-neutral-800" : "hover:bg-neutral-800/50"}`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                      <span className="text-xs text-neutral-300 capitalize flex-1">{d.label}</span>
                      <span className="text-xs text-neutral-500 font-mono">{d.count}</span>
                      <span className="text-xs text-neutral-600 font-mono w-8 text-right">{pct}%</span>
                    </button>
                  )
                })}
                {activeType && (
                  <button
                    onClick={() => setActiveType(null)}
                    className="text-xs text-orange-400 hover:text-orange-300 text-left mt-1 underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* License bars */}
        {report.licenses.length > 0 && (
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                LICENSE DISTRIBUTION <span className="text-neutral-500 font-normal">({report.licenses.length} unique)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {report.licenses.slice(0, 12).map((l, i) => (
                <LicenseBar key={l.license} license={l.license} count={l.count} max={maxLicense} index={i} />
              ))}
              {report.licenses.length > 12 && (
                <p className="text-xs text-neutral-500 text-center pt-1">+ {report.licenses.length - 12} more licenses</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Component Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              ALL COMPONENTS
              <span className="text-neutral-500 font-normal ml-2">({filtered.length}{activeType ? ` · ${activeType}` : ""})</span>
            </CardTitle>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search name, version, type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-orange-500 w-52"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">NAME</th>
                <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">VERSION</th>
                <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">TYPE</th>
                <th className="text-left py-3 px-4 text-xs text-neutral-400 tracking-wider">LICENSES</th>
                <th className="py-3 px-4 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 text-sm">
                    {search || activeType ? "No components match your filter." : "No components found in SBOM."}
                  </td>
                </tr>
              ) : (
                filtered.map((comp, idx) => (
                  <ComponentRow key={`${comp.name}-${comp.version}-${idx}`} comp={comp} idx={idx} />
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page helpers ─────────────────────────────────────────────────────────────

function PageTitle() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-wider">SBOM VIEWER</h1>
      <p className="text-sm text-neutral-400">Software Bill of Materials — CycloneDX format generated by Trivy.</p>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardContent className="p-10 text-center space-y-4">
        <PackageSearch className="w-10 h-10 text-neutral-500 mx-auto" />
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
          <p className="text-sm font-medium text-red-400">Unable to load SBOM report.</p>
          <p className="text-xs text-red-500/80 mt-1">{message}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2" onClick={onRetry}>
          <RotateCw className="w-3 h-3" />Retry
        </Button>
      </CardContent>
    </Card>
  )
}
