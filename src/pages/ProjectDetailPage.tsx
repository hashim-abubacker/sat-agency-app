import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  CheckSquare,
  ArrowLeft,
  Plus,
  ExternalLink,
  Share2,
  FileText,
  Activity,
  LayoutGrid,
  Settings,
  Archive,
  RotateCcw,
  Clock,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ContentPlannerTab } from '@/components/content/ContentPlannerTab'
import type { Task, TaskStatus, PriorityLevel, ProjectStatus } from '@/types'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { state, store } = useAgencyStore()
  const permissions = usePermissions()
  const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'tasks' | 'content' | 'files' | 'activity'>('overview')

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  // Run auto-archiving check for tasks completed >2 days ago
  useEffect(() => {
    store.autoArchiveCompletedTasks()
  }, [store])

  // Task creation modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskAssignee, setTaskAssignee] = useState(state.users[0]?.id || '')
  const [taskPriority, setTaskPriority] = useState<PriorityLevel>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')

  // Task Detail & Edit Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailTitle, setDetailTitle] = useState('')
  const [detailDescription, setDetailDescription] = useState('')
  const [detailAssignee, setDetailAssignee] = useState('')
  const [detailPriority, setDetailPriority] = useState<PriorityLevel>('medium')
  const [detailStatus, setDetailStatus] = useState<TaskStatus>('todo')
  const [detailDueDate, setDetailDueDate] = useState('')

  const openTaskDetailModal = (task: Task) => {
    setSelectedTask(task)
    setDetailTitle(task.title)
    setDetailDescription(task.description || '')
    setDetailAssignee(task.assigned_to || '')
    setDetailPriority(task.priority)
    setDetailStatus(task.status)
    setDetailDueDate(task.due_date || '')
  }

  const handleUpdateTaskDetail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask || !detailTitle.trim()) return
    store.updateTask(selectedTask.id, {
      title: detailTitle.trim(),
      description: detailDescription.trim() || null,
      assigned_to: detailAssignee || null,
      priority: detailPriority,
      status: detailStatus,
      due_date: detailDueDate || null,
    })
    setSelectedTask(null)
  }

  const handleDeleteSelectedTask = () => {
    if (!selectedTask) return
    if (window.confirm(`Are you sure you want to delete task "${selectedTask.title}"?`)) {
      store.deleteTask(selectedTask.id)
      setSelectedTask(null)
    }
  }

  const handleArchiveSelectedTask = () => {
    if (!selectedTask) return
    store.archiveTask(selectedTask.id)
    setSelectedTask(null)
  }

  // Project Settings Modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<ProjectStatus>('in_progress')
  const [editPriority, setEditPriority] = useState<PriorityLevel>('medium')
  const [editStartDate, setEditStartDate] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDriveUrl, setEditDriveUrl] = useState('')
  const [editEnableContentPlanner, setEditEnableContentPlanner] = useState(false)

  // Archive Folder Modal
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)

  const project = state.projects.find((p) => p.id === projectId)

  if (!project || !permissions.canAccessProject(project.id)) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E5E7EB] space-y-4">
        <h2 className="text-lg font-semibold text-[#111827]">Project Not Found or Access Denied</h2>
        <p className="text-xs text-[#6B7280]">
          You do not have permission to access this project workspace.
        </p>
        <Link to="/projects">
          <Button size="sm" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  const client = state.clients.find((c) => c.id === project.client_id)
  const allTasks = state.tasks.filter((t) => t.project_id === project.id)
  const tasks = allTasks.filter((t) => !t.is_archived)
  const archivedTasks = allTasks.filter((t) => t.is_archived)

  const contentItems = state.contentItems.filter((c) => c.project_id === project.id)
  const projectLogs = state.activityLogs.filter(
    (log) => log.entity_id === project.id || allTasks.some((t) => t.id === log.entity_id) || contentItems.some((c) => c.id === log.entity_id)
  )

  const openSettingsModal = () => {
    setEditName(project.name)
    setEditDescription(project.description || '')
    setEditStatus(project.status)
    setEditPriority(project.priority)
    setEditStartDate(project.start_date || '')
    setEditDueDate(project.due_date || '')
    setEditDriveUrl(project.drive_url || '')
    setEditEnableContentPlanner(!!project.enable_content_planner)
    setIsSettingsModalOpen(true)
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    store.updateProject(project.id, {
      name: editName.trim() || project.name,
      description: editDescription.trim() || null,
      status: editStatus,
      priority: editPriority,
      start_date: editStartDate || null,
      due_date: editDueDate || null,
      drive_url: editDriveUrl.trim() || null,
      enable_content_planner: editEnableContentPlanner,
    })
    if (!editEnableContentPlanner && activeTab === 'content') {
      setActiveTab('overview')
    }
    setIsSettingsModalOpen(false)
  }

  const handleDeleteProject = () => {
    if (!permissions.canDeleteProject) return
    if (window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      store.deleteProject(project.id)
      navigate('/projects')
    }
  }

  const taskKanbanColumns: { label: string; status: TaskStatus }[] = [
    { label: 'To Do', status: 'todo' },
    { label: 'In Progress', status: 'in_progress' },
    { label: 'Review', status: 'review' },
    { label: 'Blocked', status: 'blocked' },
    { label: 'Completed', status: 'completed' },
  ]

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    store.addTask({
      project_id: project.id,
      assigned_to: taskAssignee || null,
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      priority: taskPriority,
      status: 'todo',
      due_date: taskDueDate || null,
      order_index: tasks.length + 1,
    })
    setTaskTitle('')
    setTaskDescription('')
    setIsTaskModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div>
        <Link to="/projects" className="inline-flex items-center text-xs text-[#6B7280] hover:text-indigo-600 mb-2">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="purple">{project.status.replace('_', ' ')}</Badge>
              {project.enable_content_planner && (
                <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
                  Content Planner Enabled
                </Badge>
              )}
              <span className="text-xs text-[#6B7280]">Client: {client?.company_name}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#111827]">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {project.drive_url ? (
              <a href={project.drive_url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Drive Folder
                </Button>
              </a>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsArchiveModalOpen(true)}
              title="View archived tasks older than 2 days"
            >
              <Archive className="w-4 h-4 mr-1.5 text-gray-500" /> Archive ({archivedTasks.length})
            </Button>

            <Button variant="outline" size="sm" onClick={openSettingsModal}>
              <Settings className="w-4 h-4 mr-1.5 text-[#6B7280]" /> Settings
            </Button>

            <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Layout Tabs: Overview, Task Board, Task List, Content (if enabled), Files, Activity */}
      <div className="flex border-b border-[#E5E7EB] gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#6B7280]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" /> Overview
        </button>

        <button
          onClick={() => setActiveTab('kanban')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'kanban' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#6B7280]'
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Task Board
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#6B7280]'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Task List ({tasks.length})
        </button>

        {/* Content Tab: ONLY appears when Content Planner is enabled */}
        {project.enable_content_planner && (
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'content' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#6B7280]'
            }`}
          >
            <Share2 className="w-4 h-4 text-indigo-600" /> Content ({contentItems.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('files')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'files' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#6B7280]'
          }`}
        >
          <FileText className="w-4 h-4" /> Files
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#6B7280]'
          }`}
        >
          <Activity className="w-4 h-4" /> Activity
        </button>
      </div>

      {/* OVERVIEW VIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Project Details</h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              {project.description || 'No detailed project description provided.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E5E7EB]">
              <div>
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase">Client</span>
                <div className="text-sm font-medium text-[#111827] mt-0.5">{client?.company_name || 'N/A'}</div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase">Priority</span>
                <div className="mt-0.5">
                  <Badge variant={project.priority === 'critical' ? 'danger' : 'default'}>{project.priority}</Badge>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase">Start Date</span>
                <div className="text-sm font-medium text-[#111827] mt-0.5">{project.start_date || '—'}</div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase">Due Date</span>
                <div className="text-sm font-medium text-[#111827] mt-0.5">{project.due_date || '—'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Workspace Capability</h3>
            <div className="p-4 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#111827]">
                <span>Content Planner Module</span>
                <Badge variant={project.enable_content_planner ? 'purple' : 'outline'}>
                  {project.enable_content_planner ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-xs text-[#6B7280]">
                {project.enable_content_planner
                  ? 'Social media and publishing content planning is active. The Content tab is visible.'
                  : 'Content planning tab is hidden. You can enable it anytime for marketing projects.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task Kanban View */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {taskKanbanColumns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status)
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
                  const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
                  if (taskId) {
                    store.updateTask(taskId, { status: col.status })
                  }
                  setDraggedTaskId(null)
                  setDragOverColumn(null)
                }}
                className={`p-3 rounded-xl border transition-all min-h-[500px] flex flex-col ${
                  isHovered
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-300'
                    : 'bg-[#FAFAFA] border-[#E5E7EB]'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
                  <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">{col.label}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-white border rounded-full text-[#6B7280]">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {columnTasks.map((task) => {
                    const assignee = state.users.find((u) => u.id === task.assigned_to)
                    const isDragging = draggedTaskId === task.id
                    return (
                      <div
                        key={task.id}
                        draggable={true}
                        onClick={() => openTaskDetailModal(task)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task.id)
                          e.dataTransfer.effectAllowed = 'move'
                          setDraggedTaskId(task.id)
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null)
                          setDragOverColumn(null)
                        }}
                        className={`bg-white p-3.5 rounded-lg border shadow-2xs space-y-2 transition-all cursor-pointer ${
                          isDragging
                            ? 'opacity-40 border-dashed border-indigo-400 scale-[0.98]'
                            : 'border-[#E5E7EB] hover:border-indigo-400 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 cursor-grab" />
                            <Badge size="sm" variant={task.priority === 'critical' ? 'danger' : 'default'}>
                              {task.priority}
                            </Badge>
                          </div>
                          <select
                            value={task.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation()
                              store.updateTask(task.id, { status: e.target.value as TaskStatus })
                            }}
                            className="text-[10px] bg-gray-50 border rounded px-1 text-[#6B7280] cursor-pointer"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="blocked">Blocked</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <h4 className="font-semibold text-sm text-[#111827]">{task.title}</h4>
                        {task.description && <p className="text-xs text-[#6B7280] line-clamp-2">{task.description}</p>}
                        <div className="text-[10px] text-[#9CA3AF] pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span>Assignee: {assignee?.full_name || 'Unassigned'}</span>
                          <div className="flex items-center gap-2">
                            <span>{task.due_date || ''}</span>
                            {task.status === 'completed' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  store.archiveTask(task.id)
                                }}
                                className="text-gray-400 hover:text-indigo-600 transition-colors p-0.5 cursor-pointer"
                                title="Archive completed task immediately"
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {col.status === 'completed' && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Auto-archives after 2 days
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Task List View */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          <table className="w-full text-left text-sm text-[#111827]">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase">
              <tr>
                <th className="px-6 py-3">Task Title</th>
                <th className="px-6 py-3">Assignee</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {tasks.map((task) => {
                const assignee = state.users.find((u) => u.id === task.assigned_to)
                return (
                  <tr
                    key={task.id}
                    onClick={() => openTaskDetailModal(task)}
                    className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-semibold text-[#111827]">{task.title}</td>
                    <td className="px-6 py-4 text-xs text-[#6B7280]">{assignee?.full_name || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={task.priority === 'critical' ? 'danger' : 'default'}>{task.priority}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation()
                          store.updateTask(task.id, { status: e.target.value as TaskStatus })
                        }}
                        className="text-xs bg-[#FAFAFA] border border-[#E5E7EB] rounded px-2 py-1 cursor-pointer"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#6B7280]">{task.due_date || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {task.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            store.archiveTask(task.id)
                          }}
                          title="Move to Archive Folder"
                        >
                          <Archive className="w-3.5 h-3.5 mr-1 text-gray-500" /> Archive
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTENT PLANNER TAB */}
      {activeTab === 'content' && project.enable_content_planner && (
        <ContentPlannerTab projectId={project.id} />
      )}

      {/* FILES TAB */}
      {activeTab === 'files' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-6 space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Project Files & Assets</h3>
          {project.drive_url ? (
            <div className="flex items-center justify-between p-4 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="font-semibold text-sm text-[#111827]">Google Drive Folder</div>
                  <a href={project.drive_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                    {project.drive_url}
                  </a>
                </div>
              </div>
              <a href={project.drive_url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-4 h-4 mr-1" /> Open Drive
                </Button>
              </a>
            </div>
          ) : (
            <p className="text-xs text-[#6B7280]">No Google Drive link configured for this project yet.</p>
          )}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-6 space-y-4">
          <h3 className="text-base font-bold text-[#111827]">Project Activity Log</h3>
          <div className="space-y-3">
            {projectLogs.length === 0 ? (
              <p className="text-xs text-[#6B7280]">No activity logged yet for this project.</p>
            ) : (
              projectLogs.map((log) => (
                <div key={log.id} className="text-xs space-y-0.5 border-b border-gray-100 pb-2.5 last:border-none">
                  <div className="font-semibold text-[#111827]">{log.user_name}</div>
                  <div className="text-[#6B7280]">{log.details}</div>
                  <div className="text-[10px] text-[#9CA3AF]">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Task to Project"
        description={`Add a new task to ${project.name}.`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input label="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Description</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full p-2 border border-[#E5E7EB] rounded-md text-sm text-[#111827]"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Assignee</label>
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm"
              >
                {state.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as PriorityLevel)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <Input label="Due Date" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>

      {/* Project Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Project Settings"
        description={`Manage settings, status, timeline, and capabilities for ${project.name}.`}
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <Input
            label="Project Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Project Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">✓ Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
            />
            <Input
              label="Due Date"
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full p-2 border border-[#E5E7EB] rounded-md text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <Input
            label="Google Drive Link"
            value={editDriveUrl}
            onChange={(e) => setEditDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
          />

          <div className="pt-2 border-t border-[#E5E7EB]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#111827]">
              <input
                type="checkbox"
                checked={editEnableContentPlanner}
                onChange={(e) => setEditEnableContentPlanner(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              Enable Content Planner (Content tab for social media & marketing scheduling)
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
            {permissions.canDeleteProject ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeleteProject}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete Project
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIsSettingsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Settings</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Archive Folder Modal */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        title={`Task Archive (${archivedTasks.length})`}
        description="Completed tasks older than 2 days are archived here to keep your active board uncluttered."
      >
        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
          {archivedTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B7280] space-y-1">
              <Archive className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-semibold text-gray-700">Archive is currently empty</p>
              <p>Completed tasks older than 2 days will automatically appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {archivedTasks.map((task) => {
                const assignee = state.users.find((u) => u.id === task.assigned_to)
                return (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge size="sm" variant={task.priority === 'critical' ? 'danger' : 'default'}>
                          {task.priority}
                        </Badge>
                        <span className="font-semibold text-sm text-[#111827]">{task.title}</span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-[#6B7280] line-clamp-1">{task.description}</p>
                      )}
                      <div className="text-[11px] text-[#9CA3AF] flex items-center gap-3">
                        <span>Assignee: {assignee?.full_name || 'Unassigned'}</span>
                        {task.archived_at && (
                          <span>Archived: {new Date(task.archived_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => store.unarchiveTask(task.id)}
                      title="Restore task to active board"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end pt-3 border-t border-[#E5E7EB]">
          <Button variant="outline" onClick={() => setIsArchiveModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Task Detail & Full Description Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Overview & Details"
        description="View full description, edit properties, or update task progress."
      >
        {selectedTask && (
          <form onSubmit={handleUpdateTaskDetail} className="space-y-4">
            <Input
              label="Task Title"
              value={detailTitle}
              onChange={(e) => setDetailTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Full Description
              </label>
              <textarea
                value={detailDescription}
                onChange={(e) => setDetailDescription(e.target.value)}
                placeholder="Enter full task instructions, guidelines, and detailed specification..."
                className="w-full p-3 border border-[#E5E7EB] rounded-md text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Status</label>
                <select
                  value={detailStatus}
                  onChange={(e) => setDetailStatus(e.target.value as TaskStatus)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Priority</label>
                <select
                  value={detailPriority}
                  onChange={(e) => setDetailPriority(e.target.value as PriorityLevel)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Assignee</label>
                <select
                  value={detailAssignee}
                  onChange={(e) => setDetailAssignee(e.target.value)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {state.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Due Date"
                type="date"
                value={detailDueDate}
                onChange={(e) => setDetailDueDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelectedTask}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
                {selectedTask.status === 'completed' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveSelectedTask}
                  >
                    <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedTask(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
