"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Play,
  ExternalLink,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react"
import {
  getProjects,
  createProject,
  deleteProject,
  type Project,
  type CreateProjectPayload,
} from "@/services/api"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return isoString
  }
}

function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case "SUCCESS":  return "bg-white/20 text-white"
    case "FAILED":   return "bg-red-500/20 text-red-500"
    case "UNSTABLE": return "bg-orange-500/20 text-orange-500"
    case "RUNNING":  return "bg-neutral-500/20 text-neutral-300"
    default:         return "bg-neutral-800 text-neutral-300"
  }
}

function getStatusIcon(status: string): string {
  switch (status?.toUpperCase()) {
    case "SUCCESS":  return "✓"
    case "FAILED":   return "✕"
    case "UNSTABLE": return "!"
    case "RUNNING":  return "⟳"
    default:         return "?"
  }
}

const EMPTY_FORM: CreateProjectPayload = {
  name: "",
  repository_url: "",
  branch: "main",
  language: "",
  visibility: "",
  access_method: "",
  credential_id: "",
  description: "",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GitLabProjectsPage() {
  // ── Filter state
  const [searchTerm, setSearchTerm]           = useState("")
  const [languageFilter, setLanguageFilter]   = useState("all")
  const [visibilityFilter, setVisibilityFilter] = useState("all")
  const [statusFilter, setStatusFilter]       = useState("all")

  // ── UI state
  const [showAddForm, setShowAddForm]         = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // ── Data state
  const [projects, setProjects]               = useState<Project[]>([])
  const [loading, setLoading]                 = useState(true)
  const [fetchError, setFetchError]           = useState<string | null>(null)

  // ── Operation state
  const [deleting, setDeleting]               = useState<number | null>(null)
  const [saving, setSaving]                   = useState(false)
  const [form, setForm]                       = useState<CreateProjectPayload>(EMPTY_FORM)
  const [formError, setFormError]             = useState<string | null>(null)

  // ─── Load projects on mount ────────────────────────────────────────────────
  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load projects."
      setFetchError(msg)
      toast.error("Could not load projects", { description: msg })
    } finally {
      setLoading(false)
    }
  }

  // ─── Delete project ────────────────────────────────────────────────────────
  async function handleDeleteProject(e: React.MouseEvent, project: Project) {
    e.stopPropagation()
    setDeleting(project.id)
    try {
      await deleteProject(project.id)
      if (selectedProject?.id === project.id) setSelectedProject(null)
      await fetchProjects()
      toast.success("Project deleted", {
        description: `"${project.name}" was removed successfully.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete project."
      toast.error("Delete failed", { description: msg })
    } finally {
      setDeleting(null)
    }
  }

  // ─── Create project ────────────────────────────────────────────────────────
  async function handleSaveProject() {
    setFormError(null)
    const { name, repository_url, branch, language, visibility, access_method } = form
    if (!name.trim() || !repository_url.trim() || !branch.trim() || !language || !visibility || !access_method) {
      setFormError("Please fill in all required fields (*)")
      return
    }
    setSaving(true)
    try {
      const created = await createProject(form)
      await fetchProjects()
      setShowAddForm(false)
      setForm(EMPTY_FORM)
      toast.success("Project added", {
        description: `"${created.name}" was connected successfully.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save project."
      setFormError(msg)
      toast.error("Save failed", { description: msg })
    } finally {
      setSaving(false)
    }
  }

  function openAddForm() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowAddForm(true)
  }

  function closeAddForm() {
    setShowAddForm(false)
    setFormError(null)
  }

  // ─── Filtered list ─────────────────────────────────────────────────────────
  const filteredProjects = projects.filter((p) => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.repository_url.toLowerCase().includes(q)
    const matchLang   = languageFilter === "all" || p.language === languageFilter
    const matchVis    = visibilityFilter === "all" || p.visibility === visibilityFilter
    const matchStatus = statusFilter === "all" || p.last_pipeline_status?.toUpperCase() === statusFilter
    return matchSearch && matchLang && matchVis && matchStatus
  })

  const hasActiveFilters =
    searchTerm !== "" ||
    languageFilter !== "all" ||
    visibilityFilter !== "all" ||
    statusFilter !== "all"

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">GITLAB PROJECTS</h1>
          <p className="text-sm text-neutral-400">Manage GitLab repositories connected to Jenkins pipelines</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openAddForm}>
          Add Project
        </Button>
      </div>

      {/* ── Search & Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Languages</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="Java">Java</option>
            </select>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Visibility</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="UNSTABLE">UNSTABLE</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm text-neutral-400">Loading projects from backend...</p>
          </CardContent>
        </Card>
      )}

      {/* ── Error state ── */}
      {!loading && fetchError && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Unable to connect to backend</p>
              <p className="text-xs text-red-500/80 mt-1">{fetchError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
              onClick={fetchProjects}
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Projects Table ── */}
      {!loading && !fetchError && filteredProjects.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              CONNECTED GITLAB PROJECTS ({filteredProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">PROJECT NAME</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">BRANCH</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">LANGUAGE</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">VISIBILITY</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ACCESS METHOD</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">PIPELINE STATUS</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CREATED AT</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, index) => (
                    <tr
                      key={project.id}
                      className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer ${
                        index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <td className="py-3 px-4 text-sm text-white font-mono">{project.name}</td>

                      <td className="py-3 px-4 text-sm text-neutral-300">{project.branch}</td>

                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300">
                          {project.language}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${
                            project.visibility === "Public"
                              ? "bg-white/20 text-white"
                              : "bg-neutral-700/50 text-neutral-300"
                          }`}
                        >
                          {project.visibility}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-sm text-neutral-300">{project.access_method}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg ${getStatusColor(project.last_pipeline_status)}`}>
                            {getStatusIcon(project.last_pipeline_status)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${getStatusColor(project.last_pipeline_status)}`}>
                            {project.last_pipeline_status || "UNKNOWN"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-sm text-neutral-300 font-mono">
                        {formatDate(project.created_at)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-neutral-400 hover:text-orange-500 h-8 w-8"
                            title="Run Pipeline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-neutral-400 hover:text-orange-500 h-8 w-8"
                            title="View Details"
                            onClick={(e) => { e.stopPropagation(); setSelectedProject(project) }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-neutral-400 hover:text-red-500 h-8 w-8 disabled:opacity-50"
                            title="Delete"
                            disabled={deleting === project.id}
                            onClick={(e) => handleDeleteProject(e, project)}
                          >
                            {deleting === project.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />
                            }
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ── */}
      {!loading && !fetchError && filteredProjects.length === 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-12 text-center">
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-bold text-white mb-2">No projects match your filters</h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Try adjusting the search term, language, visibility, or status filter.
                </p>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white bg-transparent"
                  onClick={() => {
                    setSearchTerm("")
                    setLanguageFilter("all")
                    setVisibilityFilter("all")
                    setStatusFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-2">No GitLab projects connected yet</h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Add your first GitLab repository to start running DevSecOps pipelines with Jenkins.
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openAddForm}>
                  Add Project
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Project Detail Panel ── */}
      {selectedProject && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PROJECT DETAILS</CardTitle>
            <Button
              variant="ghost"
              onClick={() => setSelectedProject(null)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">PROJECT NAME</p>
                  <p className="text-sm text-white font-mono">{selectedProject.name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">REPOSITORY URL</p>
                  <p className="text-sm text-white font-mono break-all">{selectedProject.repository_url}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">BRANCH</p>
                  <p className="text-sm text-white">{selectedProject.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">LANGUAGE</p>
                  <span className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300">
                    {selectedProject.language}
                  </span>
                </div>
                {selectedProject.description && (
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider mb-1">DESCRIPTION</p>
                    <p className="text-sm text-neutral-300">{selectedProject.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">VISIBILITY</p>
                  <span
                    className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${
                      selectedProject.visibility === "Public"
                        ? "bg-white/20 text-white"
                        : "bg-neutral-700/50 text-neutral-300"
                    }`}
                  >
                    {selectedProject.visibility}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">ACCESS METHOD</p>
                  <p className="text-sm text-white">{selectedProject.access_method}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">LAST PIPELINE STATUS</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${getStatusColor(selectedProject.last_pipeline_status)}`}>
                      {getStatusIcon(selectedProject.last_pipeline_status)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${getStatusColor(selectedProject.last_pipeline_status)}`}>
                      {selectedProject.last_pipeline_status || "UNKNOWN"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider mb-1">CREATED AT</p>
                  <p className="text-sm text-white font-mono">
                    {new Date(selectedProject.created_at).toLocaleString("en-GB")}
                  </p>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full mt-4">
                  <Play className="w-4 h-4 mr-2" />
                  Run Pipeline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Add Project Modal ── */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white tracking-wider">Add New GitLab Project</CardTitle>
              <Button
                variant="ghost"
                onClick={closeAddForm}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">

                {/* Name */}
                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">
                    PROJECT NAME <span className="text-orange-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., backend-api"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                  />
                </div>

                {/* Repository URL */}
                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">
                    GITLAB REPOSITORY URL <span className="text-orange-500">*</span>
                  </label>
                  <Input
                    placeholder="https://gitlab.com/group/project.git"
                    value={form.repository_url}
                    onChange={(e) => setForm({ ...form, repository_url: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">
                    DEFAULT BRANCH <span className="text-orange-500">*</span>
                  </label>
                  <Input
                    placeholder="main"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                  />
                </div>

                {/* Language + Visibility */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 tracking-wider mb-2 block">
                      LANGUAGE <span className="text-orange-500">*</span>
                    </label>
                    <select
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Select Language</option>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="Java">Java</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 tracking-wider mb-2 block">
                      VISIBILITY <span className="text-orange-500">*</span>
                    </label>
                    <select
                      value={form.visibility}
                      onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Select Visibility</option>
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                </div>

                {/* Access Method */}
                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">
                    ACCESS METHOD <span className="text-orange-500">*</span>
                  </label>
                  <select
                    value={form.access_method}
                    onChange={(e) => setForm({ ...form, access_method: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select Access Method</option>
                    <option value="Public repository">Public repository</option>
                    <option value="Existing Jenkins Credential">Existing Jenkins Credential</option>
                    <option value="SSH Key configured in Jenkins">SSH Key configured in Jenkins</option>
                  </select>
                </div>

                {/* Credential ID */}
                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">JENKINS CREDENTIAL ID</label>
                  <Input
                    placeholder="e.g., gitlab-private-token"
                    value={form.credential_id ?? ""}
                    onChange={(e) => setForm({ ...form, credential_id: e.target.value })}
                    className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-neutral-400 tracking-wider mb-2 block">DESCRIPTION</label>
                  <textarea
                    placeholder="Short description of the project"
                    value={form.description ?? ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-600 text-white placeholder-neutral-500 text-sm rounded px-3 py-2 focus:outline-none focus:border-orange-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Private repo note */}
                <div className="p-3 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-400">
                  <p className="font-medium mb-1 text-neutral-300">Repository Private Access Note:</p>
                  For private GitLab repositories, credentials should be configured in Jenkins Credentials. Do not store
                  sensitive tokens directly in the application.
                </div>

                {/* Form-level error */}
                {formError && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">{formError}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
                  onClick={handleSaveProject}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {saving ? "Saving..." : "Save Project"}
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent flex-1"
                  onClick={closeAddForm}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
