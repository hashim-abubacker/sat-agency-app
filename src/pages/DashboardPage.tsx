import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckSquare,
  FolderKanban,
  AlertTriangle,
  Clock,
  Plus,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

export function DashboardPage() {
  const { state, store } = useAgencyStore()
  const permissions = usePermissions()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskProjectId, setNewTaskProjectId] = useState(state.projects[0]?.id || '')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState(state.currentUser?.id || '')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const currentUserId = state.currentUser?.id

  // Dashboard Aggregation Logic
  const myTasks = state.tasks.filter((t) => !t.assigned_to || t.assigned_to === currentUserId)
  const todayTasks = myTasks.filter((t) => t.due_date === today || t.status === 'in_progress')
  const overdueTasks = myTasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'completed')
  const myProjects = permissions.role === 'owner' || permissions.role === 'admin'
    ? state.projects
    : state.projects.filter((p) => p.members?.some((m) => m.id === currentUserId))
  const waitingProjects = state.projects.filter((p) => p.status === 'waiting')

  // Content Planner Dashboard Aggregation
  const contentPlannerProjects = state.projects.filter((p) => p.enable_content_planner)
  const hasContentPlannerProjects = contentPlannerProjects.length > 0
  const contentProjectIds = new Set(contentPlannerProjects.map((p) => p.id))
  const activeContentItems = state.contentItems.filter((c) => contentProjectIds.has(c.project_id))

  const todaysContentCount = activeContentItems.filter((c) => c.scheduled_date === today).length
  const pendingApprovalCount = activeContentItems.filter((c) => c.status === 'review' || c.status === 'draft').length

  // Next 7 days calculation for publishing this week
  const todayDateObj = new Date()
  const weekLaterObj = new Date()
  weekLaterObj.setDate(todayDateObj.getDate() + 7)
  const weekLaterStr = weekLaterObj.toISOString().split('T')[0]

  const publishingThisWeekCount = activeContentItems.filter(
    (c) => c.scheduled_date >= today && c.scheduled_date <= weekLaterStr && c.status !== 'cancelled'
  ).length

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    store.addTask({
      title: newTaskTitle.trim(),
      project_id: newTaskProjectId || state.projects[0]?.id || 'prj-1',
      description: newTaskDescription.trim() || null,
      assigned_to: newTaskAssignee || null,
      priority: newTaskPriority,
      status: 'todo',
      due_date: newTaskDueDate || today,
      order_index: 1,
    })
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskDueDate('')
    setIsTaskModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Welcome back, {state.currentUser?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Here is your daily operational summary for <span className="font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {permissions.canCreateTask && (
            <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create Task
            </Button>
          )}
        </div>
      </div>

      {/* High-level Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Today's Focus</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-[#111827] mt-2">{todayTasks.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">Active tasks due today</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{overdueTasks.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">Requires immediate attention</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Active Projects</span>
            <FolderKanban className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#111827] mt-2">{myProjects.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">Assigned workspace projects</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Waiting for Client</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{waitingProjects.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">Pending client feedback</div>
        </div>
      </div>

      {/* Content Planner Summary Widget (Appears ONLY if Content Planner projects exist) */}
      {hasContentPlannerProjects && (
        <div className="bg-gradient-to-br from-[#111827] to-indigo-950 rounded-xl p-5 text-white shadow-md space-y-4 relative overflow-hidden">
          {/* Subtle Decorative Glow Background */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between border-b border-indigo-700/50 pb-3 relative">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600/30 rounded-lg text-indigo-300">
                ✨
              </span>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Content Planner Summary</h3>
                <p className="text-[11px] text-indigo-200">
                  Aggregated across {contentPlannerProjects.length} project{contentPlannerProjects.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
            <div className="bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors p-3.5 rounded-lg border border-white/10">
              <div className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Today's Content</div>
              <div className="text-2xl font-bold text-white mt-1">{todaysContentCount}</div>
              <div className="text-[10px] text-indigo-300 mt-0.5">Scheduled for publication today</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors p-3.5 rounded-lg border border-white/10">
              <div className="text-xs text-amber-200/80 font-semibold uppercase tracking-wider">Pending Approval</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{pendingApprovalCount}</div>
              <div className="text-[10px] text-indigo-300 mt-0.5">Drafts & review items</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors p-3.5 rounded-lg border border-white/10">
              <div className="text-xs text-emerald-200/80 font-semibold uppercase tracking-wider">Publishing This Week</div>
              <div className="text-2xl font-bold text-emerald-300 mt-1">{publishingThisWeekCount}</div>
              <div className="text-[10px] text-indigo-300 mt-0.5">Upcoming scheduled items</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Tasks & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-[#111827]">Today's Assigned Work</h2>
            </div>
            <Link to="/projects" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
              View all tasks <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280]">
                🎉 All tasks completed for today! Great job.
              </div>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-white hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        store.updateTask(task.id, {
                          status: task.status === 'completed' ? 'todo' : 'completed',
                        })
                      }
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-300 hover:border-indigo-600'
                      }`}
                    >
                      {task.status === 'completed' && '✓'}
                    </button>
                    <div>
                      <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-[#111827]'}`}>
                        {task.title}
                      </span>
                      <div className="text-[11px] text-[#6B7280]">
                        Due: {task.due_date || 'No due date'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={task.priority === 'critical' ? 'danger' : task.priority === 'high' ? 'warning' : 'default'}>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Stream Sidebar */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-[#111827]">Recent Activity</h2>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {state.activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="text-xs space-y-0.5 border-b border-gray-100 pb-2.5 last:border-none">
                <div className="font-semibold text-[#111827]">{log.user_name}</div>
                <div className="text-[#6B7280]">{log.details}</div>
                <div className="text-[10px] text-[#9CA3AF]">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Task Creation Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create New Task"
        description="Add a task to your active workspace project."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="e.g. Design homepage hero banner"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Project</label>
            <select
              value={newTaskProjectId}
              onChange={(e) => setNewTaskProjectId(e.target.value)}
              className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
            >
              {state.projects.map((p) => {
                const client = state.clients.find((c) => c.id === p.client_id)
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({client?.company_name || 'No Client'})
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Description</label>
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Detailed task instructions and guidelines..."
              className="w-full p-2.5 border border-[#E5E7EB] rounded-md text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Assignee</label>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
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

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <Input
            label="Due Date"
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
