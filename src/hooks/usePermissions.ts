import { useAgencyStore } from './useAgencyStore'
import type { UserRole } from '@/types'

export function usePermissions() {
  const { state } = useAgencyStore()
  const role: UserRole = state.currentUser?.role || 'employee'
  const currentUserId = state.currentUser?.id

  return {
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isEmployee: role === 'employee',
    isFreelancer: role === 'freelancer',

    // --- Page / Navigation Access Guards ---
    canViewClients: role === 'owner' || role === 'admin',
    canViewQuotations: role === 'owner' || role === 'admin',
    canViewUsers: role === 'owner',
    canViewSettings: role === 'owner',

    // --- Action Guards ---
    canCreateClient: role === 'owner' || role === 'admin',
    canEditClient: role === 'owner' || role === 'admin',
    canArchiveClient: role === 'owner' || role === 'admin',
    canDeleteClient: role === 'owner',

    canCreateProject: role === 'owner' || role === 'admin',
    canEditProject: role === 'owner' || role === 'admin',
    canDeleteProject: role === 'owner' || role === 'admin',

    canCreateQuotation: role === 'owner' || role === 'admin',
    canEditQuotation: role === 'owner' || role === 'admin',
    canDeleteQuotation: role === 'owner' || role === 'admin',
    canRecordPayment: role === 'owner' || role === 'admin',
    canUpdateDriveLink: role === 'owner' || role === 'admin',

    canCreateTask: role === 'owner' || role === 'admin' || role === 'employee',
    canUpdateTaskStatus: true, // Everyone can update assigned tasks
    canDeleteTask: role === 'owner' || role === 'admin',

    // --- Sensitive Data Field Scoping ---
    canViewPaymentInfo: role === 'owner' || role === 'admin', // Payment summaries & Quotation values

    // --- Entity Assignment Checkers ---
    canAccessClient: (clientId: string) => {
      if (role === 'owner' || role === 'admin') return true
      if (role === 'freelancer') return false
      // Employee: check if assigned to any project belonging to client
      return state.projects.some(
        (p) => p.client_id === clientId && p.members?.some((m) => m.id === currentUserId)
      )
    },

    canAccessProject: (projectId: string) => {
      if (role === 'owner' || role === 'admin') return true
      const prj = state.projects.find((p) => p.id === projectId)
      if (!prj) return false
      // Employee & Freelancer: must be assigned
      return prj.members?.some((m) => m.id === currentUserId) ?? true
    },
  }
}
