import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Plus,
  ArrowRight,
  Bell,
  Phone,
  Users,
  Clock,
  Pin,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import type { PriorityLevel, ReminderType } from '@/types'

interface CalendarEvent {
  id: string
  rawId: string
  title: string
  date: string // YYYY-MM-DD
  time?: string | null
  type: 'project' | 'task' | 'payment' | 'reminder'
  reminderType?: ReminderType
  priority?: string
  status?: string
  assignedTo?: string[]
  linkUrl?: string
  amount?: number
  currency?: string
  notes?: string
  isCompleted?: boolean
}

export function CalendarPage() {
  const { state, store } = useAgencyStore()

  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month')
  const [filterMode, setFilterMode] = useState<'all' | 'my' | 'projects' | 'payments' | 'reminders'>('all')
  const [currentDate, setCurrentDate] = useState<Date>(new Date()) // Default to current date

  // Modal States
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: CalendarEvent[] } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Creation Modal state (Task vs Reminder tabs)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'reminder' | 'task'>('reminder')

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskProjectId, setNewTaskProjectId] = useState(state.projects[0]?.id || '')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState(state.currentUser?.id || '')
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>('medium')
  const [newTaskDate, setNewTaskDate] = useState('')

  // New reminder form state
  const [newReminderTitle, setNewReminderTitle] = useState('')
  const [newReminderType, setNewReminderType] = useState<ReminderType>('call')
  const [newReminderDate, setNewReminderDate] = useState('')
  const [newReminderTime, setNewReminderTime] = useState('10:00 AM')
  const [newReminderPriority, setNewReminderPriority] = useState<PriorityLevel>('medium')
  const [newReminderAssignee, setNewReminderAssignee] = useState(state.currentUser?.id || '')
  const [newReminderClientId, setNewReminderClientId] = useState('')
  const [newReminderProjectId, setNewReminderProjectId] = useState('')
  const [newReminderNotes, setNewReminderNotes] = useState('')

  const currentUserId = state.currentUser?.id

  // 1. Gather all calendar events from projects, tasks, payments, and reminders
  const projectEvents: CalendarEvent[] = state.projects
    .filter((p) => p.due_date)
    .map((p) => ({
      id: `prj-${p.id}`,
      rawId: p.id,
      title: `[Project] ${p.name}`,
      date: p.due_date!,
      type: 'project',
      priority: p.priority,
      status: p.status,
      assignedTo: p.members?.map((m) => m.id) || [],
      linkUrl: `/projects/${p.id}`,
      notes: p.description || undefined,
    }))

  const taskEvents: CalendarEvent[] = state.tasks
    .filter((t) => t.due_date)
    .map((t) => ({
      id: `tsk-${t.id}`,
      rawId: t.id,
      title: `[Task] ${t.title}`,
      date: t.due_date!,
      type: 'task',
      priority: t.priority,
      status: t.status,
      assignedTo: t.assigned_to ? [t.assigned_to] : [],
      linkUrl: `/projects/${t.project_id}`,
      notes: t.description || undefined,
    }))

  const paymentEvents: CalendarEvent[] = state.quotations.flatMap((q) => {
    const qCurrency = q.currency || state.settings?.default_currency || 'INR'
    return (q.payments || []).map((p) => ({
      id: `pay-${p.id}`,
      rawId: p.id,
      title: `[Payment] ${q.quotation_number}: ${formatCurrency(p.amount, qCurrency)}`,
      date: p.payment_date,
      type: 'payment' as const,
      amount: p.amount,
      currency: qCurrency,
      linkUrl: `/clients/${q.client_id}`,
      notes: `${p.payment_method || 'Payment'} - ${p.notes || 'No notes'}`,
    }))
  })

  const reminderEvents: CalendarEvent[] = (state.reminders || []).map((r) => {
    const client = state.clients.find((c) => c.id === r.client_id)
    return {
      id: `rem-${r.id}`,
      rawId: r.id,
      title: `[${r.type.toUpperCase()}] ${r.title}${r.time ? ` (${r.time})` : ''}`,
      date: r.date,
      time: r.time,
      type: 'reminder' as const,
      reminderType: r.type,
      priority: r.priority || 'medium',
      assignedTo: r.assigned_to ? [r.assigned_to] : [],
      notes: r.notes ? `${r.notes}${client ? ` • Client: ${client.company_name}` : ''}` : client ? `Client: ${client.company_name}` : undefined,
      isCompleted: r.is_completed,
    }
  })

  const allEvents: CalendarEvent[] = [...projectEvents, ...taskEvents, ...paymentEvents, ...reminderEvents]

  // Filter events based on active selection
  const filteredEvents = allEvents.filter((evt) => {
    if (filterMode === 'my') return evt.assignedTo?.includes(currentUserId || '')
    if (filterMode === 'projects') return evt.type === 'project'
    if (filterMode === 'payments') return evt.type === 'payment'
    if (filterMode === 'reminders') return evt.type === 'reminder'
    return true
  })

  // Sort events chronologically
  filteredEvents.sort((a, b) => a.date.localeCompare(b.date))

  // 2. Month Grid Calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthTitle = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const getDaysForMonthGrid = () => {
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const grid: { dateString: string; dayNumber: number; isCurrentMonth: boolean }[] = []

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      grid.push({ dateString, dayNumber: dayNum, isCurrentMonth: false })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      grid.push({ dateString, dayNumber: day, isCurrentMonth: true })
    }

    // Next month padding to fill out grid (35 or 42 cells)
    const targetLength = grid.length > 35 ? 42 : 35
    const remaining = targetLength - grid.length
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      grid.push({ dateString, dayNumber: i, isCurrentMonth: false })
    }

    return grid
  }

  const monthGridDays = getDaysForMonthGrid()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const openCreateModalForDate = (dateStr?: string, tab: 'reminder' | 'task' = 'reminder') => {
    setNewTaskDate(dateStr || todayStr)
    setNewReminderDate(dateStr || todayStr)
    setModalTab(tab)
    setIsCreateModalOpen(true)
  }

  const handleCreateReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReminderTitle.trim() || !newReminderDate) return

    store.addReminder({
      title: newReminderTitle.trim(),
      type: newReminderType,
      date: newReminderDate,
      time: newReminderTime.trim() || '10:00 AM',
      priority: newReminderPriority,
      assigned_to: newReminderAssignee || null,
      client_id: newReminderClientId || null,
      project_id: newReminderProjectId || null,
      notes: newReminderNotes.trim() || null,
    })

    setNewReminderTitle('')
    setNewReminderNotes('')
    setIsCreateModalOpen(false)
  }

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    store.addTask({
      title: newTaskTitle.trim(),
      project_id: newTaskProjectId || state.projects[0]?.id || 'prj-1',
      assigned_to: newTaskAssignee || null,
      priority: newTaskPriority,
      status: 'todo',
      due_date: newTaskDate || todayStr,
      order_index: 1,
    })
    setNewTaskTitle('')
    setNewTaskDescription('')
    setIsCreateModalOpen(false)
  }

  const getEventBadgeStyle = (evt: CalendarEvent) => {
    if (evt.type === 'project') return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
    if (evt.type === 'task') return 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
    if (evt.type === 'payment') return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'

    // Reminders by type
    switch (evt.reminderType) {
      case 'call':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
      case 'meeting':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
      case 'followup':
        return 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
      case 'deadline':
        return 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
      default:
        return 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
    }
  }

  const getReminderIcon = (type?: ReminderType) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3 h-3 text-emerald-600 inline mr-1" />
      case 'meeting':
        return <Users className="w-3 h-3 text-indigo-600 inline mr-1" />
      case 'followup':
        return <Bell className="w-3 h-3 text-amber-600 inline mr-1" />
      case 'deadline':
        return <Clock className="w-3 h-3 text-rose-600 inline mr-1" />
      default:
        return <Pin className="w-3 h-3 text-purple-600 inline mr-1" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Schedule & Calendar</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Visual month calendar grid for projects, tasks, payments, calls, and internal reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-[#E5E7EB] p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'month' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              <Grid className="w-3.5 h-3.5 inline-block mr-1" /> Month View
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'agenda' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              <List className="w-3.5 h-3.5 inline-block mr-1" /> Agenda View
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="h-9 border border-[#E5E7EB] rounded-md px-3 text-xs bg-white text-[#111827] focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
          >
            <option value="all">All Deadlines & Reminders</option>
            <option value="my">My Assigned Items</option>
            <option value="projects">Projects Only</option>
            <option value="payments">Payments Only</option>
            <option value="reminders">Reminders & Meetings</option>
          </select>

          <Button size="sm" variant="outline" onClick={() => openCreateModalForDate(todayStr, 'reminder')}>
            <Bell className="w-4 h-4 mr-1 text-indigo-600" /> Add Reminder
          </Button>

          <Button size="sm" onClick={() => openCreateModalForDate(todayStr, 'task')}>
            <Plus className="w-4 h-4 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      {/* View Mode 1: Month Calendar Grid */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          {/* Navigation Bar */}
          <div className="p-4 flex items-center justify-between border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[#111827]">{monthTitle}</h2>
              <Button size="sm" variant="outline" onClick={handleToday} className="text-xs">
                Today
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth} title="Previous Month">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNextMonth} title="Next Month">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#FAFAFA] text-center py-2 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Month Days Cell Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#E5E7EB] min-h-[600px] text-xs">
            {monthGridDays.map((cell, idx) => {
              const dayEvents = filteredEvents.filter((evt) => evt.date === cell.dateString)
              const isToday = cell.dateString === todayStr

              return (
                <div
                  key={`${cell.dateString}-${idx}`}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedDayEvents({ date: cell.dateString, events: dayEvents })
                    }
                  }}
                  className={`p-2 min-h-[110px] flex flex-col justify-between transition-colors ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50/60 text-gray-400'
                  } ${isToday ? 'bg-indigo-50/30' : ''} hover:bg-gray-50/90 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold text-xs rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : cell.isCurrentMonth
                          ? 'text-[#111827]'
                          : 'text-gray-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.isCurrentMonth && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openCreateModalForDate(cell.dateString)
                        }}
                        className="text-gray-300 hover:text-indigo-600 p-0.5 rounded transition-colors"
                        title="Add event on this date"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(evt)
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-medium border truncate cursor-pointer transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm ${getEventBadgeStyle(evt)}`}
                        title={evt.title}
                      >
                        {evt.type === 'reminder' && getReminderIcon(evt.reminderType)}
                        {evt.isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />}
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-[#6B7280] font-semibold pl-1">
                        + {dayEvents.length - 3} more events
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* View Mode 2: Agenda View */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h2 className="text-base font-bold text-[#111827]">Chronological Event Agenda</h2>
            <span className="text-xs text-[#6B7280]">{filteredEvents.length} entries scheduled</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280] space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-bold text-gray-700">No events or reminders found</p>
              <p>Schedule a new task or internal reminder using the button above.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {evt.type === 'reminder' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                          {getReminderIcon(evt.reminderType)} {evt.reminderType || 'Reminder'}
                        </span>
                      )}
                      {evt.type === 'project' && (
                        <Badge variant="purple" size="sm">
                          Project Deadline
                        </Badge>
                      )}
                      {evt.type === 'task' && (
                        <Badge variant="default" size="sm">
                          Task Due
                        </Badge>
                      )}
                      {evt.type === 'payment' && (
                        <Badge variant="success" size="sm">
                          Payment Entry
                        </Badge>
                      )}
                      <span className="font-bold text-sm text-[#111827]">{evt.title}</span>
                    </div>
                    {evt.notes && <p className="text-xs text-[#6B7280] line-clamp-1">{evt.notes}</p>}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#6B7280] font-medium shrink-0">
                    <span className="bg-gray-100 px-2.5 py-1 rounded border border-gray-200 font-mono">
                      📅 {evt.date} {evt.time ? `• ⏰ ${evt.time}` : ''}
                    </span>
                    {evt.linkUrl && (
                      <Link to={evt.linkUrl} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost">
                          View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Day Overview Modal */}
      {selectedDayEvents && (
        <Modal
          isOpen={!!selectedDayEvents}
          onClose={() => setSelectedDayEvents(null)}
          title={`Schedule for ${selectedDayEvents.date}`}
          description={`View all ${selectedDayEvents.events.length} deadlines and reminders scheduled on this day.`}
        >
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {selectedDayEvents.events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => {
                  setSelectedDayEvents(null)
                  setSelectedEvent(evt)
                }}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-[#111827]">{evt.title}</div>
                  <div className="text-[11px] text-gray-500 capitalize">
                    {evt.type} {evt.reminderType ? `(${evt.reminderType})` : ''} {evt.time ? `• ${evt.time}` : ''}
                  </div>
                </div>
                {evt.linkUrl && (
                  <Link to={evt.linkUrl} onClick={() => setSelectedDayEvents(null)}>
                    <Button variant="outline" size="sm">
                      Open <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  openCreateModalForDate(selectedDayEvents.date)
                  setSelectedDayEvents(null)
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Event for this Date
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedDayEvents(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          description={`Scheduled Date: ${selectedEvent.date} ${selectedEvent.time ? `• ${selectedEvent.time}` : ''}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Category:</span>
                <span className="font-bold capitalize text-[#111827]">{selectedEvent.type} {selectedEvent.reminderType ? `(${selectedEvent.reminderType})` : ''}</span>
              </div>
              {selectedEvent.priority && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Priority Level:</span>
                  <span className="font-bold uppercase text-indigo-600">{selectedEvent.priority}</span>
                </div>
              )}
              {selectedEvent.notes && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 font-medium block mb-1">Details / Notes:</span>
                  <p className="text-[#111827] leading-relaxed">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              {selectedEvent.type === 'reminder' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    store.deleteReminder(selectedEvent.rawId)
                    setSelectedEvent(null)
                  }}
                  className="text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Reminder
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
                {selectedEvent.linkUrl && (
                  <Link to={selectedEvent.linkUrl} onClick={() => setSelectedEvent(null)}>
                    <Button size="sm">
                      View Record Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 3: Add Event / Reminder Creation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={modalTab === 'reminder' ? 'Add Internal Reminder' : 'Add Task to Schedule'}
        description={
          modalTab === 'reminder'
            ? 'Schedule an internal call, team meeting, follow-up note, or deadline alert.'
            : 'Schedule a task for an active workspace project.'
        }
      >
        <div className="space-y-4">
          {/* Tab 1: Reminder Creation Form */}
          {modalTab === 'reminder' && (
            <form onSubmit={handleCreateReminderSubmit} className="space-y-4">
              <Input
                label="Reminder Title"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                placeholder="e.g. Client Call with Alex Rivera"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">Reminder Category</label>
                  <select
                    value={newReminderType}
                    onChange={(e) => setNewReminderType(e.target.value as ReminderType)}
                    className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="call">📞 Client Call</option>
                    <option value="meeting">🤝 Team Meeting</option>
                    <option value="followup">🔔 Follow-up Note</option>
                    <option value="deadline">⏰ Deadline Alert</option>
                    <option value="general">📌 General Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">Priority</label>
                  <select
                    value={newReminderPriority}
                    onChange={(e) => setNewReminderPriority(e.target.value as PriorityLevel)}
                    className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
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
                  label="Scheduled Date"
                  type="date"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  required
                />

                <Input
                  label="Scheduled Time"
                  type="text"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">Assign To Member</label>
                  <select
                    value={newReminderAssignee}
                    onChange={(e) => setNewReminderAssignee(e.target.value)}
                    className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-xs font-semibold text-[#111827] mb-1">Linked Client</label>
                  <select
                    value={newReminderClientId}
                    onChange={(e) => setNewReminderClientId(e.target.value)}
                    className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None</option>
                    {state.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">Linked Project</label>
                  <select
                    value={newReminderProjectId}
                    onChange={(e) => setNewReminderProjectId(e.target.value)}
                    className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None</option>
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Details / Notes</label>
                <textarea
                  value={newReminderNotes}
                  onChange={(e) => setNewReminderNotes(e.target.value)}
                  placeholder="Meeting agenda, discussion points, or call details..."
                  className="w-full p-2.5 border border-[#E5E7EB] rounded-md text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Reminder</Button>
              </div>
            </form>
          )}

          {/* Tab 2: Task Creation Form */}
          {modalTab === 'task' && (
            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <Input
                label="Task Title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Deliver homepage prototype"
                required
              />

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Project</label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
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
                  placeholder="Detailed task instructions..."
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
                    className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <Input
                label="Scheduled Due Date"
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Schedule Task</Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}
