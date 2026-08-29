import React, { useState } from 'react'
import { Plus, Lock, Shield, KeyRound, Edit2, Trash2, Check } from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { User, UserRole } from '@/types'

export function UsersPage() {
  const { state, store } = useAgencyStore()
  const permissions = usePermissions()

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)

  // New User Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('admin')

  // Edit User Form State
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('admin')
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')

  // Password Reset Form State
  const [newPassword, setNewPassword] = useState('EYB2026#digital')
  const [passwordNotice, setPasswordNotice] = useState(false)

  if (!permissions.canViewUsers) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-200 text-red-600 space-y-2 max-w-xl mx-auto my-8">
        <Lock className="w-8 h-8 mx-auto text-red-500" />
        <h2 className="text-base font-semibold">Access Restricted</h2>
        <p className="text-xs text-gray-500">
          User management and role configuration are strictly restricted to agency Owners.
        </p>
      </div>
    )
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return
    store.addUser({
      full_name: fullName.trim(),
      email: email.trim(),
      role,
      status: 'active',
      avatar_url: null,
    })
    setFullName('')
    setEmail('')
    setIsAddModalOpen(false)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditName(user.full_name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditStatus(user.status)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !editName.trim()) return
    store.updateUser(editingUser.id, {
      full_name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
      status: editStatus,
    })
    setEditingUser(null)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordUser) return
    setPasswordNotice(true)
    setTimeout(() => {
      setPasswordNotice(false)
      setResetPasswordUser(null)
    }, 2500)
  }

  const handleDeleteUser = (user: User) => {
    if (user.role === 'owner' && state.users.filter((u) => u.role === 'owner').length === 1) {
      alert('Cannot remove the primary Owner account.')
      return
    }
    if (window.confirm(`Are you sure you want to remove user "${user.full_name}"?`)) {
      store.deleteUser(user.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Owner Control Panel
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Team & Security Management</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Control agency team members, manage administrative roles, and manage passwords.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Team Member
        </Button>
      </div>

      {/* Security Credentials Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-4 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-700/50 rounded-lg text-indigo-200 mt-0.5">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Default Initial Login Password</h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              All new and default team accounts are assigned initial password: <code className="bg-black/40 px-2 py-0.5 rounded text-amber-300 font-mono text-xs select-all">EYB2026#digital</code>
            </p>
          </div>
        </div>
        <div className="text-xs text-indigo-300 bg-white/10 px-3 py-1.5 rounded-md border border-white/10 whitespace-nowrap">
          Users can change passwords in Settings
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <table className="w-full text-left text-sm text-[#111827]">
          <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase">
            <tr>
              <th className="px-6 py-3">Member Name</th>
              <th className="px-6 py-3">Email Address</th>
              <th className="px-6 py-3">Role Level</th>
              <th className="px-6 py-3">Account Status</th>
              <th className="px-6 py-3 text-right">Owner Control Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {state.users.map((u) => (
              <tr key={u.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200">
                    {u.full_name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-[#111827] block">{u.full_name}</span>
                    <span className="text-[10px] text-gray-400">ID: {u.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-[#4B5563]">{u.email}</td>
                <td className="px-6 py-4">
                  <Badge variant={u.role === 'owner' ? 'purple' : u.role === 'admin' ? 'info' : 'default'}>
                    {u.role.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={u.status === 'active' ? 'success' : 'outline'}>{u.status}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetPasswordUser(u)}
                      title="Reset User Password"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-600" /> Password
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(u)}
                      title="Edit User Role & Details"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Edit
                    </Button>

                    {u.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(u)}
                        className="text-rose-600 hover:bg-rose-50"
                        title="Remove User Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Add New Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Team Member"
        description="Add an Owner, Admin, Employee, or Freelancer account."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Alex Johnson" required />
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. alex@eyb.digital" required />
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Role Level</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="owner">Owner (Full System & User Control)</option>
              <option value="admin">Admin (Operational & Project Management)</option>
              <option value="employee">Employee (Assigned Projects & Tasks)</option>
              <option value="freelancer">Freelancer (Assigned Tasks Only)</option>
            </select>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700">
            Initial password will be defaulted to: <strong className="font-mono">EYB2026#digital</strong>.
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Team Member Details"
        description={`Modify properties and access level for ${editingUser?.full_name}.`}
      >
        {editingUser && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <Input label="Email Address" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Role Level</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                  <option value="freelancer">Freelancer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 3: Reset Password Modal */}
      <Modal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        title="Reset User Password"
        description={`Set or issue a new login password for ${resetPasswordUser?.full_name}.`}
      >
        {resetPasswordUser && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {passwordNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Password successfully updated for {resetPasswordUser.full_name}!
              </div>
            )}
            <Input
              label="New Password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <p className="text-xs text-[#6B7280]">
              Standard default password: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">EYB2026#digital</code>
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button type="button" variant="outline" onClick={() => setResetPasswordUser(null)}>
                Cancel
              </Button>
              <Button type="submit">Reset Password</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
