import { useState, useRef } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Grid,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquare,
  ExternalLink,
  ShieldAlert,
  Download,
  Clock,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ContentAnnotationModal } from '@/components/content/ContentAnnotationModal'
import type { ContentItem, ContentPlatform, ContentStatus, ContentType } from '@/types'

export function ClientCalendarPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const { state } = useAgencyStore()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'calendar' | 'feed'>('calendar')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const calendarRef = useRef<HTMLDivElement>(null)

  // Find project by share token
  const project = state.projects.find((p) => p.content_planner_share_token === shareToken)
  const client = project ? state.clients.find((c) => c.id === project.client_id) : null

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Invalid or Expired Link</h1>
          <p className="text-sm text-slate-400">
            This content calendar share link is invalid, expired, or has been disabled by the agency.
          </p>
          <div className="pt-2">
            <RouterLink to="/" className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium">
              Return to Agency Portal
            </RouterLink>
          </div>
        </div>
      </div>
    )
  }

  const permissions = project.client_permissions || {
    allow_approval: true,
    allow_comments: true,
    allow_rescheduling: true,
  }

  const projectContentItems = state.contentItems.filter((c) => c.project_id === project.id)

  const filteredItems = projectContentItems.filter((item) => {
    if (selectedPlatform !== 'all' && item.platform !== selectedPlatform) return false
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false
    return true
  })

  // Date Nav Helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleExportImage = async () => {
    if (!calendarRef.current) return
    try {
      setIsExporting(true)
      const dataUrl = await toPng(calendarRef.current, { cacheBust: true, quality: 0.95 })
      const link = document.createElement('a')
      const fileName = `${client?.company_name || 'Agency'}_${project.name}_Calendar_${monthName}_${year}.png`
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '')
      link.download = fileName
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to export calendar screenshot image:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" className="text-[9px] px-1.5 py-0.2">Approved</Badge>
      case 'revision_requested':
        return <Badge variant="warning" className="text-[9px] px-1.5 py-0.2">Changes Requested</Badge>
      case 'scheduled':
        return <Badge variant="purple" className="text-[9px] px-1.5 py-0.2">Scheduled</Badge>
      case 'published':
        return <Badge variant="success" className="text-[9px] px-1.5 py-0.2">Published</Badge>
      default:
        return <Badge variant="outline" className="text-[9px] px-1.5 py-0.2">{status.toUpperCase()}</Badge>
    }
  }

  const getPlatformIcon = (platform: ContentPlatform) => {
    switch (platform) {
      case 'instagram':
        return '📸'
      case 'facebook':
        return '📘'
      case 'linkedin':
        return '💼'
      case 'youtube':
        return '▶️'
      case 'tiktok':
        return '🎵'
      case 'twitter':
        return '🐦'
      case 'blog':
        return '📝'
      case 'email':
        return '✉️'
      default:
        return '🌐'
    }
  }

  const getContentTypeInfo = (type: ContentType) => {
    switch (type) {
      case 'reel':
        return { icon: '🎬', label: 'Reel', style: 'bg-pink-500/20 text-pink-300 border-pink-500/30' }
      case 'carousel':
        return { icon: '🎠', label: 'Carousel', style: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
      case 'story':
        return { icon: '📸', label: 'Story', style: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
      case 'video':
        return { icon: '🎥', label: 'Video', style: 'bg-red-500/20 text-red-300 border-red-500/30' }
      case 'post':
        return { icon: '🖼️', label: 'Post', style: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
      case 'blog':
        return { icon: '📝', label: 'Blog', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
      case 'newsletter':
        return { icon: '✉️', label: 'Newsletter', style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' }
      default:
        return { icon: '📌', label: type, style: 'bg-slate-800 text-slate-300 border-slate-700' }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">Content Calendar Review</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">{client?.company_name || 'Client Portal'}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-100">{project.name}</h1>
            </div>
          </div>

          {/* Tab Switcher & Screenshot Button */}
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'calendar' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportImage}
                disabled={isExporting}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce text-indigo-400' : ''}`} />
                <span>{isExporting ? 'Exporting Image...' : 'Download Month Screenshot'}</span>
              </Button>
            )}

            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar View</span>
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === 'feed'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid Feed View</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Controls Bar: Date Nav & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
          {/* Calendar Month Selector */}
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handlePrevMonth} className="p-2 text-xs">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-base font-bold min-w-[140px] text-center text-slate-100">
              {monthName} {year}
            </h2>
            <Button variant="outline" onClick={handleNextMonth} className="p-2 text-xs">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter Options */}
          <div className="flex items-center space-x-3 text-xs w-full sm:w-auto">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="blog">Blog</option>
              <option value="email">Email</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="review">In Review</option>
              <option value="approved">Approved</option>
              <option value="revision_requested">Revision Requested</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Tab 1: Month Calendar View (Exportable Ref Container) */}
        {activeTab === 'calendar' && (
          <div ref={calendarRef} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-1">
            {/* Header branding on screenshot export */}
            <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{client?.company_name || 'Client Portal'} • Content Calendar</span>
                <h3 className="text-base font-bold text-slate-100">{project.name} ({monthName} {year})</h3>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-700">
                  🗓️ {filteredItems.length} Scheduled Entries
                </span>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/90 text-center py-2.5 text-xs font-semibold text-slate-400">
              <div>SUN</div>
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-950 divide-x divide-y divide-slate-800/60 min-h-[580px]">
              {/* Blank days before 1st of month */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="bg-slate-950/40 p-2 min-h-[115px]" />
              ))}

              {/* Days of current month */}
              {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                const dayItems = filteredItems.filter((item) => item.scheduled_date === dateStr)
                const isToday =
                  new Date().toISOString().split('T')[0] === dateStr

                return (
                  <div
                    key={dateStr}
                    className={`p-2 min-h-[115px] flex flex-col space-y-1.5 transition-colors hover:bg-slate-900/40 ${
                      isToday ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {/* Posts for this day */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto">
                      {dayItems.map((item) => {
                        const openAnnotationsCount = (item.annotations || []).filter((a) => a.status === 'open').length
                        const typeInfo = getContentTypeInfo(item.content_type)

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all hover:scale-[1.02] shadow-sm space-y-1.5 group"
                          >
                            {/* Row 1: Platform Icon, Platform Name & Status */}
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="flex items-center gap-1 font-semibold text-slate-300">
                                <span>{getPlatformIcon(item.platform)}</span>
                                <span className="uppercase tracking-wider">{item.platform}</span>
                              </span>
                              {getStatusBadge(item.status)}
                            </div>

                            {/* Row 2: Post Title */}
                            <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-indigo-300 transition-colors leading-tight">
                              {item.title}
                            </h4>

                            {/* Row 3: Content Type Badge & Scheduled Time */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-tight ${typeInfo.style}`}>
                                <span>{typeInfo.icon}</span>
                                <span>{typeInfo.label}</span>
                              </span>

                              <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                                <Clock className="w-3 h-3 text-indigo-400" />
                                <span>{item.scheduled_time || '10:00 AM'}</span>
                              </span>
                            </div>

                            {openAnnotationsCount > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-400 pt-0.5 font-medium">
                                <MessageSquare className="w-3 h-3" />
                                <span>{openAnnotationsCount} note</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Feed / Grid View */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Visual preview of scheduled posts in grid format. Click any post card to view copy, annotations, or approve.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const typeInfo = getContentTypeInfo(item.content_type)

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/60 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col group"
                  >
                    {/* Card Visual Header */}
                    <div className="h-44 bg-slate-950 relative flex items-center justify-center p-4 border-b border-slate-800/80">
                      <div className="text-center space-y-2">
                        <span className="text-3xl">{getPlatformIcon(item.platform)}</span>
                        <div className="flex items-center justify-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold uppercase tracking-wider ${typeInfo.style}`}>
                            <span>{typeInfo.icon}</span>
                            <span>{typeInfo.label}</span>
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-3 right-3">{getStatusBadge(item.status)}</div>
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 text-[10px] text-slate-300 px-2 py-1 rounded-md flex items-center gap-1.5">
                        <span>📅 {item.scheduled_date}</span>
                        <span>•</span>
                        <span className="text-indigo-400">⏰ {item.scheduled_time || '10:00 AM'}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                          {item.caption || 'No caption provided.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                        <span>Click to review & annotate</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Post Annotation Modal */}
      {selectedItem && (
        <ContentAnnotationModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          isClientMode={true}
          clientName={client?.contact_name || client?.company_name || 'Client'}
          allowApproval={permissions.allow_approval}
          allowComments={permissions.allow_comments}
          allowRescheduling={permissions.allow_rescheduling}
        />
      )}
    </div>
  )
}
