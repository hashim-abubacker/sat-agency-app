import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Calendar,
  Users,
  Settings as SettingsIcon,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'
import { useAgencyStore } from '@/hooks/useAgencyStore'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const permissions = usePermissions()
  const { state, store } = useAgencyStore()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, visible: true },
    { label: 'Clients', path: '/clients', icon: Building2, visible: permissions.canViewClients },
    { label: 'Projects', path: '/projects', icon: FolderKanban, visible: true },
    { label: 'Calendar', path: '/calendar', icon: Calendar, visible: true },
    { label: 'Users', path: '/users', icon: Users, visible: permissions.canViewUsers },
    { label: 'Settings', path: '/settings', icon: SettingsIcon, visible: permissions.canViewSettings },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#111827] text-white flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 border-r border-gray-800',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              S
            </div>
            <div>
              <span className="font-semibold tracking-tight text-white text-base">Simple Agency</span>
              <span className="block text-[10px] text-gray-400 font-mono tracking-widest uppercase">Tool v1.2</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Workspace
          </div>
          {navItems
            .filter((item) => item.visible)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-indigo-600/90 text-white shadow-xs'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* User Session Footer */}
        <div className="p-3 border-t border-gray-800 bg-[#0B0F17]">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-indigo-700 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                {state.currentUser?.full_name?.charAt(0) || 'H'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-white truncate">
                  {state.currentUser?.full_name}
                </div>
                <div className="text-[10px] text-indigo-300 capitalize font-mono">
                  Role: {state.currentUser?.role}
                </div>
              </div>
            </div>
            <button
              onClick={() => store.logout()}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-red-400 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
