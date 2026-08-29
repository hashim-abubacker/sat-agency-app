import { useState } from 'react'
import { Menu, Search, Shield, RefreshCw, LogOut, ChevronDown } from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'

interface HeaderProps {
  onToggleMobileSidebar: () => void
  onOpenCommandPalette: () => void
}

export function Header({ onToggleMobileSidebar, onOpenCommandPalette }: HeaderProps) {
  const { state, store } = useAgencyStore()
  const currentUser = state.currentUser
  const [isSyncing, setIsSyncing] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const syncInfo = store.getCloudSyncStatus()

  const handleSync = async () => {
    setIsSyncing(true)
    await store.syncFromCloud()
    setTimeout(() => setIsSyncing(false), 600)
  }

  return (
    <header className="h-16 border-b border-[#E5E7EB] bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Search Bar Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg text-[#6B7280] text-xs hover:border-[#D1D5DB] transition-colors w-48 sm:w-72 cursor-pointer"
        >
          <Search className="w-4 h-4 text-[#9CA3AF]" />
          <span className="truncate">Search clients, projects, tasks...</span>
          <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#E5E7EB] rounded text-[#9CA3AF]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* User Profile Info & Sync Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          title={
            syncInfo.status === 'error'
              ? `Sync Error: ${syncInfo.lastSyncError || 'Click to retry'}`
              : `Supabase Cloud Sync (${syncInfo.status}). Click to sync latest agency data across computers.`
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-md transition-colors cursor-pointer ${
            syncInfo.status === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              : 'text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border-gray-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              syncInfo.status === 'synced'
                ? 'bg-emerald-500'
                : syncInfo.status === 'syncing' || isSyncing
                ? 'bg-amber-500 animate-pulse'
                : syncInfo.status === 'error'
                ? 'bg-rose-500'
                : 'bg-gray-400'
            }`}
          />
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
          <span className="hidden sm:inline text-[11px] font-medium">
            {isSyncing ? 'Syncing...' : syncInfo.status === 'error' ? 'Sync Error' : 'Sync Data'}
          </span>
        </button>

        {/* Hoverable User Profile Dropdown */}
        <div
          className="relative group"
          onMouseEnter={() => setIsUserMenuOpen(true)}
          onMouseLeave={() => setIsUserMenuOpen(false)}
        >
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs border border-indigo-200">
              {currentUser?.full_name?.charAt(0) || 'H'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#111827]">{currentUser?.full_name}</div>
              <div className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1 uppercase">
                <Shield className="w-3 h-3 inline" /> {currentUser?.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
          </button>

          {/* Floating User Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-60 bg-white rounded-xl shadow-lg border border-[#E5E7EB] z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2.5 bg-gray-50 rounded-lg space-y-1">
                <div className="font-bold text-xs text-[#111827]">{currentUser?.full_name}</div>
                <div className="text-[11px] text-gray-500 truncate">{currentUser?.email}</div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 uppercase">
                  <Shield className="w-2.5 h-2.5" /> {currentUser?.role}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    store.logout()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
