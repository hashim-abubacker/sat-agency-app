import React, { useState } from 'react'
import {
  X,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Link as LinkIcon,
  Calendar,
  Send,
  Check,
  Globe,
  Edit2,
  Trash2,
  Clock,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import type { ContentItem, ContentPlatform, ContentStatus, ContentType } from '@/types'
import { useAgencyStore } from '@/hooks/useAgencyStore'

interface ContentAnnotationModalProps {
  isOpen: boolean
  onClose: () => void
  item: ContentItem | null
  isClientMode?: boolean
  clientName?: string
  allowApproval?: boolean
  allowComments?: boolean
  allowRescheduling?: boolean
}

const PLATFORM_OPTIONS: { label: string; value: ContentPlatform }[] = [
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

const TYPE_OPTIONS: { label: string; value: ContentType }[] = [
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

const STATUS_OPTIONS: { label: string; value: ContentStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Writing', value: 'writing' },
  { label: 'Design', value: 'design' },
  { label: 'In Review', value: 'review' },
  { label: 'Revision Requested', value: 'revision_requested' },
  { label: 'Approved', value: 'approved' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function ContentAnnotationModal({
  isOpen,
  onClose,
  item,
  isClientMode = false,
  clientName = 'Client',
  allowApproval = true,
  allowComments = true,
  allowRescheduling = true,
}: ContentAnnotationModalProps) {
  const { store } = useAgencyStore()

  const [commentText, setCommentText] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)

  // Full Post Edit Mode State
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item?.title || '')
  const [editPlatform, setEditPlatform] = useState<ContentPlatform>(item?.platform || 'instagram')
  const [editContentType, setEditContentType] = useState<ContentType>(item?.content_type || 'post')
  const [editStatus, setEditStatus] = useState<ContentStatus>(item?.status || 'draft')
  const [editScheduledDate, setEditScheduledDate] = useState(item?.scheduled_date || '')
  const [editScheduledTime, setEditScheduledTime] = useState(item?.scheduled_time || '10:00 AM')
  const [editCaption, setEditCaption] = useState(item?.caption || '')
  const [editDriveUrl, setEditDriveUrl] = useState(item?.drive_url || '')

  if (!isOpen || !item) return null

  const annotations = item.annotations || []
  const openAnnotations = annotations.filter((a) => a.status === 'open')

  const openFullEditMode = () => {
    setEditTitle(item.title)
    setEditPlatform(item.platform)
    setEditContentType(item.content_type)
    setEditStatus(item.status)
    setEditScheduledDate(item.scheduled_date)
    setEditScheduledTime(item.scheduled_time || '10:00 AM')
    setEditCaption(item.caption || '')
    setEditDriveUrl(item.drive_url || '')
    setIsEditing(true)
  }

  const handleSavePostEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) return

    store.updateContentItem(item.id, {
      title: editTitle.trim(),
      platform: editPlatform,
      content_type: editContentType,
      status: editStatus,
      scheduled_date: editScheduledDate,
      scheduled_time: editScheduledTime.trim() || '10:00 AM',
      caption: editCaption.trim() || null,
      drive_url: editDriveUrl.trim() || null,
    })

    setIsEditing(false)
  }

  const handleDeletePost = () => {
    if (window.confirm(`Are you sure you want to delete post "${item.title}"?`)) {
      store.deleteContentItem(item.id)
      onClose()
    }
  }

  const handleStatusChange = (newStatus: ContentStatus) => {
    store.updateContentItem(item.id, { status: newStatus })
  }

  const handleApprove = () => {
    store.updateContentItem(item.id, { status: 'approved', notes: `Approved by ${clientName}` })
    onClose()
  }

  const handleRequestRevision = () => {
    if (!commentText.trim()) return

    store.addContentAnnotation(item.id, {
      author_name: clientName,
      author_role: isClientMode ? 'client' : 'agency',
      comment: commentText,
      suggested_drive_url: driveUrl.trim() || null,
    })

    store.updateContentItem(item.id, { status: 'revision_requested' })

    setCommentText('')
    setDriveUrl('')
    setShowRevisionForm(false)
  }

  const handleAddCommentOnly = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    store.addContentAnnotation(item.id, {
      author_name: isClientMode ? clientName : 'Agency Team',
      author_role: isClientMode ? 'client' : 'agency',
      comment: commentText,
      suggested_drive_url: driveUrl.trim() || null,
    })

    setCommentText('')
    setDriveUrl('')
  }

  const handleResolveAnnotation = (annId: string) => {
    store.resolveContentAnnotation(item.id, annId)
  }

  const handleDateChange = (newDate: string) => {
    store.updateContentItem(item.id, { scheduled_date: newDate })
    store.addContentAnnotation(item.id, {
      author_name: clientName,
      author_role: isClientMode ? 'client' : 'agency',
      comment: `Rescheduled post date to ${newDate}`,
    })
  }

  const handleTimeChange = (newTime: string) => {
    store.updateContentItem(item.id, { scheduled_time: newTime })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
                  {item.platform} • {item.content_type}
                </span>

                {/* Quick Status Dropdown Selector */}
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(e.target.value as ContentStatus)}
                  className="bg-slate-800 text-xs font-semibold px-2 py-0.5 rounded border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-0.5">{item.title}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={openFullEditMode}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Post</span>
              </Button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: View vs Edit Mode */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            /* Full Edit Form */
            <form onSubmit={handleSavePostEdit} className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-400" /> Edit Post Details
                </h3>
                <span className="text-xs text-slate-400">Update fields below and save changes.</span>
              </div>

              <Input
                label="Post Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Cold Brew Summer Launch Teaser"
                required
                className="bg-slate-900 border-slate-700 text-slate-100"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Platform</label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value as ContentPlatform)}
                    className="w-full h-9 bg-slate-900 border border-slate-700 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Format / Content Type</label>
                  <select
                    value={editContentType}
                    onChange={(e) => setEditContentType(e.target.value as ContentType)}
                    className="w-full h-9 bg-slate-900 border border-slate-700 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Workflow Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ContentStatus)}
                    className="w-full h-9 bg-slate-900 border border-slate-700 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full h-9 bg-slate-900 border border-slate-700 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Scheduled Posting Time</label>
                  <input
                    type="text"
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full h-9 bg-slate-900 border border-slate-700 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Post Caption & Copy</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Draft caption, hashtags, copy text..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <Input
                label="Google Drive Link (Media Asset)"
                value={editDriveUrl}
                onChange={(e) => setEditDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="bg-slate-900 border-slate-700 text-slate-100"
              />

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeletePost}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Post
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1">
                    <Save className="w-3.5 h-3.5" /> Save Post Changes
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            /* Standard View Mode */
            <>
              {/* Post Overview Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Schedule & Drive Link */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-400" /> Scheduled Date:
                    </span>
                    {allowRescheduling ? (
                      <input
                        type="date"
                        value={item.scheduled_date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <span className="font-medium text-slate-200">{item.scheduled_date}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/40">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-400" /> Posting Time:
                    </span>
                    {allowRescheduling ? (
                      <input
                        type="text"
                        value={item.scheduled_time || '10:00 AM'}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        placeholder="e.g. 10:00 AM"
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-28 focus:outline-none focus:border-indigo-500 font-mono text-right"
                      />
                    ) : (
                      <span className="font-mono text-xs font-semibold text-indigo-400">{item.scheduled_time || '10:00 AM'}</span>
                    )}
                  </div>

                  {item.drive_url && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/40">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-blue-400" /> Media Asset Link:
                      </span>
                      <a
                        href={item.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20"
                      >
                        Open Google Drive <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Right: Review Actions */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col justify-center space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Review Decision</span>
                  {allowApproval ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleApprove}
                        disabled={item.status === 'approved'}
                        className={`w-full text-xs flex items-center justify-center gap-1.5 ${
                          item.status === 'approved'
                            ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {item.status === 'approved' ? 'Approved' : 'Approve Post'}
                      </Button>

                      <Button
                        onClick={() => setShowRevisionForm(true)}
                        className="w-full text-xs flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Request Changes
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">View-only mode enabled for this calendar share.</p>
                  )}
                </div>
              </div>

              {/* Caption Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Post Caption & Copy</h4>
                  <button
                    onClick={openFullEditMode}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Copy
                  </button>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {item.caption || <span className="text-slate-500 italic">No caption provided yet. Click "Edit Post" to add caption text.</span>}
                </div>
              </div>

              {/* Revision Form Modal Inline */}
              {showRevisionForm && (
                <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" /> Specify Required Changes
                    </span>
                    <button
                      onClick={() => setShowRevisionForm(false)}
                      className="text-amber-400 hover:text-amber-200 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Explain what changes are needed (e.g. caption edits, tone adjustment, graphic update)..."
                    className="w-full bg-slate-900 border border-amber-500/30 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[90px]"
                  />

                  <div className="space-y-1">
                    <label className="text-xs text-amber-200/80 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-amber-400" /> Optional: Paste Google Drive URL for suggested replacement media
                    </label>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/file/d/your-suggested-asset"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-xs text-slate-200"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={handleRequestRevision}
                      disabled={!commentText.trim()}
                      className="text-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Revision Request
                    </Button>
                  </div>
                </div>
              )}

              {/* Annotations & Feedback History */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" /> Annotations & Feedback ({annotations.length})
                  </h4>
                  {openAnnotations.length > 0 && (
                    <Badge variant="warning" className="text-[10px]">
                      {openAnnotations.length} Open Feedback
                    </Badge>
                  )}
                </div>

                {annotations.length === 0 ? (
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                    No annotations or feedback notes added yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className={`p-4 rounded-xl border transition-all ${
                          ann.status === 'open'
                            ? 'bg-slate-800/80 border-indigo-500/30'
                            : 'bg-slate-900/50 border-slate-800/60 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                              {ann.author_name.charAt(0)}
                            </span>
                            <span className="text-xs font-semibold text-slate-200">{ann.author_name}</span>
                            <Badge
                              variant={ann.author_role === 'client' ? 'purple' : 'outline'}
                              className="text-[10px] px-1.5 py-0.5"
                            >
                              {ann.author_role.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-slate-500">
                              {new Date(ann.created_at).toLocaleDateString()}
                            </span>
                            {ann.status === 'open' && (
                              <button
                                onClick={() => handleResolveAnnotation(ann.id)}
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                              >
                                <Check className="w-3 h-3" /> Resolve
                              </button>
                            )}
                            {ann.status === 'resolved' && (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Resolved
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 pl-8 leading-relaxed">{ann.comment}</p>

                        {ann.suggested_drive_url && (
                          <div className="mt-2.5 pl-8">
                            <a
                              href={ann.suggested_drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md"
                            >
                              <LinkIcon className="w-3 h-3" /> Suggested Drive Media Link <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Standard Comment Input Box */}
                {allowComments && !showRevisionForm && (
                  <form onSubmit={handleAddCommentOnly} className="pt-3 space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a feedback note or comment..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[70px]"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-3">
                        <Input
                          type="url"
                          placeholder="Optional Google Drive URL..."
                          value={driveUrl}
                          onChange={(e) => setDriveUrl(e.target.value)}
                          className="bg-slate-900 border-slate-700 text-xs text-slate-200"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Comment
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {isClientMode ? `Viewing as ${clientName}` : 'Agency Internal Review'}
            </span>
            <button
              onClick={handleDeletePost}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete Post
            </button>
          </div>

          <Button variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
