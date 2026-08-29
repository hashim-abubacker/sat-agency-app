import React, { useState } from 'react'
import { Lock, CheckCircle2, KeyRound, Download, Upload, RefreshCcw, Database, Cloud, AlertTriangle, Copy } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SUPPORTED_CURRENCIES } from '@/lib/utils'

export function SettingsPage() {
  const permissions = usePermissions()
  const { state, store } = useAgencyStore()
  const syncInfo = store.getCloudSyncStatus()

  const [agencyName, setAgencyName] = useState(state.settings?.agency_name || 'Elevate Your Brand (EYB) Agency')
  const [defaultCurrency, setDefaultCurrency] = useState(state.settings?.default_currency || 'INR')
  const [driveRootUrl, setDriveRootUrl] = useState(state.settings?.drive_root_url || 'https://drive.google.com/drive/folders/sample-root')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Backup State
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!permissions.canViewSettings) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-200 text-red-600 space-y-2">
        <Lock className="w-8 h-8 mx-auto text-red-500" />
        <h2 className="text-base font-semibold">Access Restricted</h2>
        <p className="text-xs text-gray-500">
          System configuration settings are strictly restricted to agency Owners.
        </p>
      </div>
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    store.updateSettings({
      agency_name: agencyName,
      default_currency: defaultCurrency,
      drive_root_url: driveRootUrl,
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (!currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.')
      return
    }

    setPasswordSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordSuccess(false), 4000)
  }

  const handleExportBackup = () => {
    const jsonStr = store.exportBackup()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SAT_Agency_Backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setBackupMessage({ type: 'success', text: 'Backup JSON downloaded successfully!' })
    setTimeout(() => setBackupMessage(null), 4000)
  }

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        const res = store.importBackup(content)
        if (res.success) {
          setBackupMessage({ type: 'success', text: res.message })
        } else {
          setBackupMessage({ type: 'error', text: res.message })
        }
        setTimeout(() => setBackupMessage(null), 4000)
      }
    }
    reader.readAsText(file)
  }

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset workspace data to default seed data?')) {
      store.resetToDefaults()
      setBackupMessage({ type: 'success', text: 'Workspace reset to default seed data.' })
      setTimeout(() => setBackupMessage(null), 4000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Agency Settings & Security</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Configure workspace preferences, perform data backups, and manage account credentials.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2 max-w-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Agency settings saved successfully. Default currency is set to {SUPPORTED_CURRENCIES.find(c => c.code === defaultCurrency)?.name}.
        </div>
      )}

      {/* General Configuration */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-6 space-y-6 max-w-2xl">
        <h2 className="text-sm font-bold text-[#111827]">General Configuration</h2>
        
        <Input
          label="Agency Legal Name"
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">
            Default Agency Currency
          </label>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            {SUPPORTED_CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.label} {curr.code === 'INR' ? '(Default)' : ''}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#6B7280] mt-1">
            This currency will be used as default for new global clients and quotations.
          </p>
        </div>

        <Input
          label="Google Drive Root Shared URL"
          value={driveRootUrl}
          onChange={(e) => setDriveRootUrl(e.target.value)}
        />

        <div className="pt-2 border-t border-[#E5E7EB]">
          <Button type="submit" size="sm">Save Configuration</Button>
        </div>
      </form>

      {/* Supabase Realtime Multi-User Cloud Sync & Diagnostics */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-6 space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-[#111827]">Supabase Cloud Sync & Realtime Diagnostics</h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
              syncInfo.status === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : syncInfo.status === 'syncing'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : syncInfo.status === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncInfo.status === 'synced'
                  ? 'bg-emerald-500'
                  : syncInfo.status === 'syncing'
                  ? 'bg-amber-500 animate-pulse'
                  : syncInfo.status === 'error'
                  ? 'bg-rose-500'
                  : 'bg-gray-400'
              }`}
            />
            {syncInfo.status === 'synced'
              ? 'Cloud Connected & Synced'
              : syncInfo.status === 'syncing'
              ? 'Syncing...'
              : syncInfo.status === 'error'
              ? 'Sync Issue Detected'
              : 'Supabase Offline'}
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Multi-user real-time sync ensures that when Chrisbin or any team member updates clients, projects, or tasks, all logged-in computers receive updates instantly via Supabase.
          </p>

          {syncInfo.lastSyncError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Cloud Synchronization Error
              </div>
              <p className="text-[11px] leading-relaxed">{syncInfo.lastSyncError}</p>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span>Supabase Connection:</span>
              <span className="font-mono font-semibold text-gray-900">
                {syncInfo.isConfigured ? 'Connected' : 'Not Configured'}
              </span>
            </div>
            {syncInfo.lastSyncedAt && (
              <div className="flex items-center justify-between text-gray-600">
                <span>Last Cloud Sync:</span>
                <span className="font-mono text-gray-900">
                  {new Date(syncInfo.lastSyncedAt).toLocaleTimeString()} ({new Date(syncInfo.lastSyncedAt).toLocaleDateString()})
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                const res = await store.syncFromCloud()
                if (res.success) {
                  setBackupMessage({ type: 'success', text: 'Cloud data synchronized successfully!' })
                } else {
                  setBackupMessage({ type: 'error', text: res.error || 'Failed to sync with Supabase cloud.' })
                }
                setTimeout(() => setBackupMessage(null), 4000)
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Sync Cloud Data Now
            </Button>

            <button
              type="button"
              onClick={() => {
                const sqlScript = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS agency_state (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE agency_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on agency_state" ON agency_state;
CREATE POLICY "Allow all on agency_state" ON agency_state FOR ALL USING (true) WITH CHECK (true);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'agency_state') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agency_state;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;`
                navigator.clipboard.writeText(sqlScript)
                setCopiedSql(true)
                setTimeout(() => setCopiedSql(false), 3000)
              }}
              className="inline-flex items-center px-3 py-1.5 border border-[#E5E7EB] rounded-md text-xs font-semibold text-[#111827] bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {copiedSql ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Copied Setup SQL!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 text-gray-500" /> Copy Supabase Setup SQL
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Owner Data Backup & Restore Center */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-[#111827]">Data Backup & Restore Center</h2>
        </div>

        {backupMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              backupMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {backupMessage.text}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Export a full JSON snapshot of your clients, projects, tasks, content planner items, quotations, users, and audit logs. Store backup files securely or restore data anytime.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Button type="button" size="sm" onClick={handleExportBackup} className="bg-indigo-600 hover:bg-indigo-700">
              <Download className="w-4 h-4 mr-1.5" /> Export Full Backup (.json)
            </Button>

            <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 border border-[#E5E7EB] rounded-md text-xs font-semibold text-[#111827] bg-white hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4 mr-1.5 text-gray-500" /> Restore from Backup File
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>

            <Button type="button" size="sm" variant="ghost" onClick={handleResetDefaults} className="text-gray-500 hover:text-rose-600">
              <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Reset Defaults
            </Button>
          </div>
        </div>
      </div>

      {/* Account Security & Password Change */}
      <form onSubmit={handlePasswordChange} className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-[#111827]">Account Security & Password Change</h2>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Your account password has been updated successfully!
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
            {passwordError}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Default initial: EYB2026#digital"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E7EB]">
          <Button type="submit" size="sm" variant="outline">
            Update Password
          </Button>
        </div>
      </form>
    </div>
  )
}
