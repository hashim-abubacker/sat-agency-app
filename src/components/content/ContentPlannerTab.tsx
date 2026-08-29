import React, { useState } from 'react'
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Share2,
  MessageSquare,
} from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ShareCalendarModal } from '@/components/content/ShareCalendarModal'
import { ContentAnnotationModal } from '@/components/content/ContentAnnotationModal'
import type {
  ContentItem,
  ContentPlatform,
  ContentType,
  ContentStatus,
} from '@/types'

interface ContentPlannerTabProps {
  projectId: string
}

const PLATFORMS: { label: string; value: ContentPlatform }[] = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'X (Twitter)', value: 'twitter' },
  { label: 'Website Blog', value: 'blog' },
  { label: 'Email', value: 'email' },
  { label: 'Custom', value: 'custom' },
]

const CONTENT_TYPES: { label: string; value: ContentType }[] = [
  { label: 'Post', value: 'post' },
  { label: 'Carousel', value: 'carousel' },
  { label: 'Story', value: 'story' },
  { label: 'Reel', value: 'reel' },
  { label: 'Video', value: 'video' },
  { label: 'Short', value: 'short' },
  { label: 'Blog', value: 'blog' },
  { label: 'Newsletter', value: 'newsletter' },
  { label: 'Advertisement', value: 'advertisement' },
  { label: 'Custom', value: 'custom' },
]

const STATUSES: { label: string; value: ContentStatus; variant: 'default' | 'outline' | 'warning' | 'purple' | 'success' | 'danger' }[] = [
  { label: 'Draft', value: 'draft', variant: 'outline' },
  { label: 'Writing', value: 'writing', variant: 'default' },
  { label: 'Design', value: 'design', variant: 'purple' },
  { label: 'Review', value: 'review', variant: 'warning' },
  { label: 'Revision Requested', value: 'revision_requested', variant: 'warning' },
  { label: 'Approved', value: 'approved', variant: 'success' },
  { label: 'Scheduled', value: 'scheduled', variant: 'purple' },
  { label: 'Published', value: 'published', variant: 'success' },
  { label: 'Cancelled', value: 'cancelled', variant: 'danger' },
]

export function ContentPlannerTab({ projectId }: ContentPlannerTabProps) {
  const { state, store } = useAgencyStore()
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Share & Annotation Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [annotationItem, setAnnotationItem] = useState<ContentItem | null>(null)

  // Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)

  const project = state.projects.find((p) => p.id === projectId)

  // Form State
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<ContentPlatform>('instagram')
  const [contentType, setContentType] = useState<ContentType>('post')
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduledTime, setScheduledTime] = useState('10:00 AM')
  const [assignedTo, setAssignedTo] = useState(state.users[0]?.id || '')
  const [caption, setCaption] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [status, setStatus] = useState<ContentStatus>('draft')
  const [notes, setNotes] = useState('')

  const contentItems = state.contentItems.filter((c) => c.project_id === projectId)

  const openCreateModal = (defaultDate?: string) => {
    setEditingItem(null)
    setTitle('')
    setPlatform('instagram')
    setContentType('post')
    setScheduledDate(defaultDate || new Date().toISOString().split('T')[0])
    setScheduledTime('10:00 AM')
    setAssignedTo(state.users[0]?.id || '')
    setCaption('')
    setDriveUrl('')
    setStatus('draft')
    setNotes('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: ContentItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setPlatform(item.platform)
    setContentType(item.content_type)
    setScheduledDate(item.scheduled_date)
    setScheduledTime(item.scheduled_time || '10:00 AM')
    setAssignedTo(item.assigned_to || '')
    setCaption(item.caption || '')
    setDriveUrl(item.drive_url || '')
    setStatus(item.status)
    setNotes(item.notes || '')
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !scheduledDate) return

    if (editingItem) {
      store.updateContentItem(editingItem.id, {
        title: title.trim(),
        platform,
        content_type: contentType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime.trim() || '10:00 AM',
        assigned_to: assignedTo || null,
        caption: caption.trim() || null,
        drive_url: driveUrl.trim() || null,
        status,
        notes: notes.trim() || null,
      })
    } else {
      store.addContentItem({
        project_id: projectId,
        title: title.trim(),
        platform,
        content_type: contentType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime.trim() || '10:00 AM',
        assigned_to: assignedTo || null,
        caption: caption.trim() || null,
        drive_url: driveUrl.trim() || null,
        status,
        notes: notes.trim() || null,
      })
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this content item?')) {
      store.deleteContentItem(id)
    }
  }

  // Calendar calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startingDayIndex = firstDayOfMonth.getDay() // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate()

  const calendarDays: (string | null)[] = []
  for (let i = 0; i < startingDayIndex; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarDays.push(formattedDate)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" /> Content Planner
          </h2>
          <p className="text-xs text-[#6B7280]">
            Schedule publication dates, captions, and assets for social media and marketing channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-[#E5E7EB] p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'calendar' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 inline-block mr-1" /> Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5 inline-block mr-1" /> List ({contentItems.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {project && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareModalOpen(true)}
                className="text-xs flex items-center gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-600" /> Share with Client
              </Button>
            )}

            <Button size="sm" onClick={() => openCreateModal()}>
              <Plus className="w-4 h-4 mr-1" /> Add Content
            </Button>
          </div>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          {/* Calendar Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-base font-bold text-[#111827]">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-[#E5E7EB] text-center text-xs font-semibold text-[#6B7280] bg-[#FAFAFA]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#E5E7EB] bg-[#E5E7EB]">
            {calendarDays.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="bg-[#F9FAFB] min-h-[110px]" />
              }

              const dayItems = contentItems.filter((c) => c.scheduled_date === dateStr)
              const isToday = dateStr === todayStr
              const dayNum = parseInt(dateStr.split('-')[2], 10)

              return (
                <div
                  key={dateStr}
                  className={`bg-white p-2 min-h-[120px] flex flex-col justify-between transition-colors group relative ${
                    isToday ? 'bg-indigo-50/30' : ''
                  } hover:bg-gray-50/90`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#111827]'
                        }`}
                      >
                        {dayNum}
                      </span>
                      <button
                        type="button"
                        onClick={() => openCreateModal(dateStr)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-indigo-600 text-xs cursor-pointer"
                        title="Add content on this day"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Day Content Cards */}
                    <div className="space-y-1">
                      {dayItems.map((item) => {
                        const statusObj = STATUSES.find((s) => s.value === item.status)
                        const openAnnotations = (item.annotations || []).filter((a) => a.status === 'open')

                        return (
                          <div
                            key={item.id}
                            onClick={() => setAnnotationItem(item)}
                            className="p-1.5 rounded border border-[#E5E7EB] bg-white text-left shadow-2xs hover:shadow-sm hover:-translate-y-[1px] hover:border-indigo-400 cursor-pointer space-y-1 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span className="font-bold capitalize text-indigo-700 truncate">
                                {item.platform}
                              </span>
                              <Badge size="sm" variant={statusObj?.variant || 'outline'}>
                                {item.status === 'revision_requested' ? 'Changes Req' : item.status}
                              </Badge>
                            </div>
                            <p className="text-xs font-medium text-[#111827] line-clamp-1">
                              {item.title}
                            </p>

                            {openAnnotations.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                <MessageSquare className="w-3 h-3 text-amber-500" />
                                <span>{openAnnotations.length} note</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          <table className="w-full text-left text-sm text-[#111827]">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase">
              <tr>
                <th className="px-6 py-3">Scheduled Date</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Content Type</th>
                <th className="px-6 py-3">Assigned To</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {contentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-xs text-[#6B7280]">
                    No scheduled content found for this project. Click <strong>Add Content</strong> to start planning!
                  </td>
                </tr>
              ) : (
                contentItems.map((item) => {
                  const assignee = state.users.find((u) => u.id === item.assigned_to)
                  const statusObj = STATUSES.find((s) => s.value === item.status)
                  return (
                    <tr key={item.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-[#111827]">
                        {item.scheduled_date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#111827]">{item.title}</div>
                        {item.caption && (
                          <div className="text-xs text-[#6B7280] line-clamp-1 mt-0.5">
                            {item.caption}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 capitalize">
                          {item.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6B7280] capitalize">
                        {item.content_type}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6B7280]">
                        {assignee?.full_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusObj?.variant || 'outline'}>{item.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        {item.drive_url && (
                          <a href={item.drive_url} target="_blank" rel="noreferrer" title="Open Asset Link">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)} title="Edit Content">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} title="Delete Content">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT CONTENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Scheduled Content' : 'Schedule New Content'}
        description="Schedule publications and assets in under 1 minute."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Content Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Summer Special Cold Brew Reel"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
              >
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Scheduled Date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />

            <Input
              label="Posting Time"
              type="text"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              placeholder="e.g. 10:00 AM"
            />

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Assigned Employee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Caption / Copy</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write or paste post caption here..."
              className="w-full p-2 border border-[#E5E7EB] rounded-md text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Google Drive Link"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Production guidelines, hashtag ideas, or notes..."
              className="w-full p-2 border border-[#E5E7EB] rounded-md text-sm text-[#111827] focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingItem ? 'Update Content' : 'Schedule Content'}</Button>
          </div>
        </form>
      </Modal>

      {/* Share Calendar Link Modal */}
      {project && (
        <ShareCalendarModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          project={project}
        />
      )}

      {/* Content Item Annotation & Review Modal */}
      {annotationItem && (
        <ContentAnnotationModal
          isOpen={!!annotationItem}
          onClose={() => setAnnotationItem(null)}
          item={annotationItem}
          isClientMode={false}
          clientName="Agency Internal Review"
          allowApproval={true}
          allowComments={true}
          allowRescheduling={true}
        />
      )}
    </div>
  )
}
