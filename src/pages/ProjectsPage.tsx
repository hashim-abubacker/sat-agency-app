import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Plus, Search, GripVertical } from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { ProjectStatus, PriorityLevel } from '@/types'

export function ProjectsPage() {
  const { state, store } = useAgencyStore()
  const permissions = usePermissions()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Drag & Drop State
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ProjectStatus | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState(state.clients[0]?.id || '')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<PriorityLevel>('medium')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [enableContentPlanner, setEnableContentPlanner] = useState(false)

  const accessibleProjects = state.projects.filter((p) => permissions.canAccessProject(p.id))
  const filteredProjects = accessibleProjects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !clientId) return
    store.addProject({
      name: name.trim(),
      client_id: clientId,
      description: description.trim() || null,
      priority,
      status: 'planning',
      start_date: startDate || null,
      due_date: dueDate || null,
      drive_url: driveUrl.trim() || null,
      enable_content_planner: enableContentPlanner,
    })
    setName('')
    setDescription('')
    setEnableContentPlanner(false)
    setIsCreateModalOpen(false)
  }

  const projectKanbanColumns: { label: string; status: ProjectStatus }[] = [
    { label: 'Planning', status: 'planning' },
    { label: 'In Progress', status: 'in_progress' },
    { label: 'Review', status: 'review' },
    { label: 'On Hold', status: 'on_hold' },
    { label: 'Completed', status: 'completed' },
  ]

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Projects</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Central operational workspace for active agency projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-[#E5E7EB] p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              <List className="w-3.5 h-3.5 inline-block mr-1" /> List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 inline-block mr-1" /> Kanban
            </button>
          </div>

          {permissions.canCreateProject && (
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create Project
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="w-full sm:w-80">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto max-w-full touch-pan-x">
            <table className="w-full text-left text-sm text-[#111827] min-w-[720px]">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap">Project Name</th>
                  <th className="px-6 py-3 whitespace-nowrap">Client</th>
                  <th className="px-6 py-3 whitespace-nowrap">Priority</th>
                  <th className="px-6 py-3 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 whitespace-nowrap">Due Date</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredProjects.map((p) => {
                  const client = state.clients.find((c) => c.id === p.client_id)
                  return (
                    <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#111827] whitespace-nowrap">
                        <Link to={`/projects/${p.id}`} className="hover:text-indigo-600">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6B7280] whitespace-nowrap">{client?.company_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={p.priority === 'critical' ? 'danger' : p.priority === 'high' ? 'warning' : 'default'}>
                          {p.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{p.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6B7280] whitespace-nowrap">{p.due_date || '—'}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link to={`/projects/${p.id}`}>
                          <Button variant="ghost" size="sm">
                            Open →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Project Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 touch-pan-x snap-x">
          {projectKanbanColumns.map((col) => {
            const columnProjects = filteredProjects.filter((p) => p.status === col.status)
            const isHovered = dragOverColumn === col.status
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDragEnter={(e) => {
                  e.preventDefault()
                  setDragOverColumn(col.status)
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return
                  setDragOverColumn((current) => (current === col.status ? null : current))
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const prjId = e.dataTransfer.getData('text/plain') || draggedProjectId
                  if (prjId) {
                    store.updateProject(prjId, { status: col.status })
                  }
                  setDraggedProjectId(null)
                  setDragOverColumn(null)
                }}
                className={`p-3 rounded-xl border transition-all min-h-[500px] flex flex-col shrink-0 w-[280px] sm:w-auto snap-start ${
                  isHovered
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-300'
                    : 'bg-[#FAFAFA] border-[#E5E7EB]'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
                  <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">{col.label}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-white border rounded-full text-[#6B7280]">
                    {columnProjects.length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {columnProjects.map((project) => {
                    const isDragging = draggedProjectId === project.id
                    return (
                      <div
                        key={project.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', project.id)
                          e.dataTransfer.effectAllowed = 'move'
                          setDraggedProjectId(project.id)
                        }}
                        onDragEnd={() => {
                          setDraggedProjectId(null)
                          setDragOverColumn(null)
                        }}
                        className={`bg-white p-3.5 rounded-lg border shadow-2xs transition-all space-y-2 cursor-grab active:cursor-grabbing ${
                          isDragging
                            ? 'opacity-40 border-dashed border-indigo-400 scale-[0.98]'
                            : 'border-[#E5E7EB] hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                            <Badge size="sm" variant={project.priority === 'critical' ? 'danger' : 'default'}>
                              {project.priority}
                            </Badge>
                          </div>
                        </div>
                        <Link to={`/projects/${project.id}`} className="font-semibold text-sm text-[#111827] hover:text-indigo-600 block">
                          {project.name}
                        </Link>
                        <p className="text-xs text-[#6B7280] line-clamp-2">{project.description}</p>
                        <div className="text-[10px] text-[#9CA3AF] pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span>Due: {project.due_date || 'N/A'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project"
        description="Add a new project to your client portfolio."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input label="Project Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm"
            >
              {state.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-[#E5E7EB] rounded-md text-sm text-[#111827]"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Input label="Google Drive URL" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/..." />
          </div>
          <div className="pt-2 border-t border-[#E5E7EB]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#111827]">
              <input
                type="checkbox"
                checked={enableContentPlanner}
                onChange={(e) => setEnableContentPlanner(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              Enable Content Planner (Optional tab for marketing & content scheduling)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
