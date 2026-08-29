import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderKanban, CheckSquare, Building2, X } from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { state } = useAgencyStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredClients = query
    ? state.clients.filter((c) =>
        c.company_name.toLowerCase().includes(query.toLowerCase()) ||
        c.industry?.toLowerCase().includes(query.toLowerCase())
      )
    : state.clients.slice(0, 3)

  const filteredProjects = query
    ? state.projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      )
    : state.projects.slice(0, 3)

  const filteredTasks = query
    ? state.tasks.filter((t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.description?.toLowerCase().includes(query.toLowerCase())
      )
    : state.tasks.slice(0, 3)

  const handleSelect = (url: string) => {
    navigate(url)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA]">
          <Search className="w-5 h-5 text-[#9CA3AF] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, projects, tasks... (Press Esc to close)"
            className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111827] hover:bg-[#E5E7EB] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Clients */}
          {filteredClients.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-[#9CA3AF] uppercase">
                Clients
              </div>
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(`/clients/${client.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-indigo-50/70 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-[#111827] group-hover:text-indigo-900">
                        {client.company_name}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {client.contact_name} • {client.industry}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">View Client →</span>
                </button>
              ))}
            </div>
          )}

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-[#9CA3AF] uppercase">
                Projects
              </div>
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(`/projects/${project.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-indigo-50/70 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-[#111827] group-hover:text-indigo-900">
                        {project.name}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        Status: {project.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">View Project →</span>
                </button>
              ))}
            </div>
          )}

          {/* Tasks */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-[#9CA3AF] uppercase">
                Tasks
              </div>
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSelect(`/projects/${task.project_id}/tasks`)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-indigo-50/70 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-[#111827] group-hover:text-indigo-900">
                        {task.title}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        Priority: {task.priority} • Due: {task.due_date || 'No due date'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">View Task →</span>
                </button>
              ))}
            </div>
          )}

          {filteredClients.length === 0 &&
            filteredProjects.length === 0 &&
            filteredTasks.length === 0 && (
              <div className="py-8 text-center text-sm text-[#6B7280]">
                No matching results found for "<span className="font-semibold">{query}</span>"
              </div>
            )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between text-[11px] text-[#9CA3AF]">
          <span>Navigation: <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded">↓</kbd></span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  )
}
