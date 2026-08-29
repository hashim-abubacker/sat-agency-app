import { useState } from 'react'
import { X, Share2, Copy, Check, ShieldCheck, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Project, ClientPermissions } from '@/types'
import { useAgencyStore } from '@/hooks/useAgencyStore'

interface ShareCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
}

export function ShareCalendarModal({ isOpen, onClose, project }: ShareCalendarModalProps) {
  const { store } = useAgencyStore()

  const existingToken = project.content_planner_share_token || ''
  const initialPermissions: ClientPermissions = project.client_permissions || {
    allow_approval: true,
    allow_comments: true,
    allow_rescheduling: true,
  }

  const [shareToken, setShareToken] = useState(existingToken)
  const [permissions, setPermissions] = useState<ClientPermissions>(initialPermissions)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const shareUrl = shareToken
    ? `${window.location.origin}/share/content-planner/${shareToken}`
    : ''

  const handleGenerateLink = () => {
    const newToken = `${project.id.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36)}`
    setShareToken(newToken)
    store.updateProjectShareSettings(project.id, newToken, permissions)
  }

  const handleSavePermissions = () => {
    store.updateProjectShareSettings(project.id, shareToken || null, permissions)
    onClose()
  }

  const handleDisableLink = () => {
    setShareToken('')
    store.updateProjectShareSettings(project.id, null, permissions)
  }

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Share Calendar with Client</h3>
              <p className="text-xs text-slate-400">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Token Link Generator */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-indigo-400" /> Frictionless Shareable Link
            </label>

            {shareToken ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="bg-slate-950 border-slate-700 text-xs text-indigo-300 font-mono flex-1"
                  />
                  <Button
                    onClick={handleCopy}
                    className="text-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    Open Client View <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleDisableLink}
                    className="text-red-400 hover:text-red-300 text-xs hover:underline"
                  >
                    Disable Share Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Generate a secure share link to allow the client to review, annotate, and approve content without signing in.
                </p>
                <Button
                  onClick={handleGenerateLink}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Generate Shareable Link
                </Button>
              </div>
            )}
          </div>

          {/* Client Permissions */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Client Permissions
            </h4>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Allow Post Approvals</span>
                  <span className="text-[11px] text-slate-400 block">Client can click "Approve" or "Request Revision"</span>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.allow_approval}
                  onChange={(e) => setPermissions({ ...permissions, allow_approval: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Allow Annotations & Feedback</span>
                  <span className="text-[11px] text-slate-400 block">Client can comment and attach Google Drive URLs</span>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.allow_comments}
                  onChange={(e) => setPermissions({ ...permissions, allow_comments: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Allow Date Rescheduling</span>
                  <span className="text-[11px] text-slate-400 block">Client can select preferred publish dates</span>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.allow_rescheduling}
                  onChange={(e) => setPermissions({ ...permissions, allow_rescheduling: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end space-x-3">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button onClick={handleSavePermissions} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
            Save Permissions
          </Button>
        </div>
      </div>
    </div>
  )
}
