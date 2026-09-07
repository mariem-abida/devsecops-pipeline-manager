"use client"

import { useState } from "react"
import { ChevronRight, Monitor, Settings, Shield, Target, Users, Bell, RefreshCw, GitBranch, Zap, Activity, CheckCircle, Brain, Code, PackageSearch, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommandCenterView } from "./command-center/view"
import GitLabProjectsPage from "./projects/page"
import { RunPipelineView } from "./run-pipeline/view"
import { PipelineMonitorView } from "./pipeline-monitor/view"
import { TestResultsView } from "./test-results/view"
import { CodeQualityView } from "./code-quality/view"
import { SecurityResultsView } from "./security-results/view"
import { AIRecommendationsView } from "./ai-recommendations/view"
import { SBOMView } from "./sbom/view"
import { ComplianceView } from "./compliance/view"
import SettingsPage from "./settings/page"

export default function TacticalDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePipelineId, setActivePipelineId] = useState<number | null>(null)
  const [activeBuildNumber, setActiveBuildNumber] = useState<string | null>(null)

  function handleNavigate(section: string, pipelineId?: number, buildNumber?: string) {
    if (pipelineId !== undefined) setActivePipelineId(pipelineId)
    if (buildNumber !== undefined) setActiveBuildNumber(buildNumber)
    setActiveSection(section)
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">DEVSECOPS</h1>
              <p className="text-neutral-500 text-xs">v1.0.0 PIPELINE MANAGER</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "overview", icon: Monitor, label: "PIPELINE DASHBOARD" },
              { id: "projects", icon: GitBranch, label: "GITLAB PROJECTS" },
              { id: "run-pipeline", icon: Zap, label: "RUN PIPELINE" },
              { id: "pipeline-monitor", icon: Activity, label: "PIPELINE MONITOR" },
              { id: "test-results", icon: CheckCircle, label: "TEST RESULTS" },
              { id: "code-quality", icon: Code, label: "CODE QUALITY" },
              { id: "security-results", icon: Shield, label: "SECURITY RESULTS" },
              { id: "compliance", icon: Scale, label: "COMPLIANCE & POLICY" },
              { id: "sbom", icon: PackageSearch, label: "SBOM VIEWER" },
              { id: "ai-recommendations", icon: Brain, label: "AI RECOMMENDATIONS" },
              { id: "settings", icon: Bell, label: "SETTINGS" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${activeSection === item.id
                  ? "bg-orange-500 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SYSTEM ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
                <div>DATA: BACKEND API</div>
                <div>RESULTS: JENKINS ARTIFACTS</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              PIPELINE MANAGER / <span className="text-orange-500">OVERVIEW</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">LAST UPDATE: LIVE BACKEND</div>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "overview" && <CommandCenterView onNavigate={handleNavigate} />}
          {activeSection === "projects" && <GitLabProjectsPage />}
          {activeSection === "run-pipeline" && (
            <RunPipelineView
              onNavigate={handleNavigate}
            />
          )}
          {activeSection === "pipeline-monitor" && (
            <PipelineMonitorView pipelineId={activePipelineId ?? undefined} onNavigate={handleNavigate} />
          )}
          {activeSection === "test-results" && (
            <TestResultsView pipelineId={activePipelineId ?? undefined} buildNumber={activeBuildNumber ?? undefined} />
          )}
          {activeSection === "code-quality" && (
            <CodeQualityView pipelineId={activePipelineId ?? undefined} buildNumber={activeBuildNumber ?? undefined} />
          )}
          {activeSection === "security-results" && (
            <SecurityResultsView pipelineId={activePipelineId ?? undefined} buildNumber={activeBuildNumber ?? undefined} />
          )}
          {activeSection === "compliance" && (
            <ComplianceView pipelineId={activePipelineId ?? undefined} buildNumber={activeBuildNumber ?? undefined} />
          )}
          {activeSection === "sbom" && (
            <SBOMView pipelineId={activePipelineId ?? undefined} buildNumber={activeBuildNumber ?? undefined} />
          )}
          {activeSection === "ai-recommendations" && (
            <AIRecommendationsView buildNumber={activeBuildNumber ?? undefined} />
          )}
          {activeSection === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  )
}
