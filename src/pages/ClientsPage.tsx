import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Lock, Edit2, Trash2 } from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, isValidGoogleDriveUrl, SUPPORTED_CURRENCIES } from '@/lib/utils'
import { CLIENT_STATUS_OPTIONS, type Client, type ClientStatus } from '@/types'

export function ClientsPage() {
  const { state, store } = useAgencyStore()
  const permissions = usePermissions()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Create Client form state
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState<ClientStatus>('won')
  const [currency, setCurrency] = useState(state.settings?.default_currency || 'INR')
  const [driveUrl, setDriveUrl] = useState('')
  const [formError, setFormError] = useState('')

  // Edit Client Modal state
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editCompanyName, setEditCompanyName] = useState('')
  const [editContactName, setEditContactName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editIndustry, setEditIndustry] = useState('')
  const [editStatus, setEditStatus] = useState<ClientStatus>('won')
  const [editCurrency, setEditCurrency] = useState('INR')
  const [editDriveUrl, setEditDriveUrl] = useState('')
  const [editFormError, setEditFormError] = useState('')

  if (!permissions.canViewClients) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-200 text-red-600 space-y-2">
        <Lock className="w-8 h-8 mx-auto text-red-500" />
        <h2 className="text-base font-semibold">Access Restricted</h2>
        <p className="text-xs text-gray-500">
          You don't have permission to view commercial client records. Please contact your administrator.
        </p>
      </div>
    )
  }

  // Filter clients based on user role scoping & query
  const accessibleClients = state.clients.filter((c) => permissions.canAccessClient(c.id))

  const filteredClients = accessibleClients.filter((c) => {
    const matchesSearch =
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email ? c.email.toLowerCase().includes(searchQuery.toLowerCase()) : false)
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!companyName.trim() || !contactName.trim()) {
      setFormError('Company name and contact person are required.')
      return
    }
    if (driveUrl && !isValidGoogleDriveUrl(driveUrl)) {
      setFormError('Please enter a valid Google Drive URL (drive.google.com).')
      return
    }

    store.addClient({
      company_name: companyName.trim(),
      contact_name: contactName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      industry: industry.trim() || 'Digital Agency Services',
      status: status,
      currency: currency || state.settings?.default_currency || 'INR',
      drive_url: driveUrl.trim() || null,
    })

    setCompanyName('')
    setContactName('')
    setEmail('')
    setPhone('')
    setIndustry('')
    setStatus('won')
    setCurrency(state.settings?.default_currency || 'INR')
    setDriveUrl('')
    setIsCreateModalOpen(false)
  }

  const openEditClientModal = (client: Client) => {
    setEditingClient(client)
    setEditCompanyName(client.company_name)
    setEditContactName(client.contact_name)
    setEditEmail(client.email || '')
    setEditPhone(client.phone || '')
    setEditIndustry(client.industry || '')
    setEditStatus(client.status)
    setEditCurrency(client.currency || state.settings?.default_currency || 'INR')
    setEditDriveUrl(client.drive_url || '')
    setEditFormError('')
  }

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return
    setEditFormError('')

    if (!editCompanyName.trim() || !editContactName.trim()) {
      setEditFormError('Company name and contact person are required.')
      return
    }

    store.updateClient(editingClient.id, {
      company_name: editCompanyName.trim(),
      contact_name: editContactName.trim(),
      email: editEmail.trim() || null,
      phone: editPhone.trim() || null,
      industry: editIndustry.trim() || null,
      status: editStatus,
      currency: editCurrency,
      drive_url: editDriveUrl.trim() || null,
    })

    setEditingClient(null)
  }

  const handleDeleteClient = () => {
    if (!editingClient) return
    if (
      window.confirm(
        `Are you sure you want to delete "${editingClient.company_name}"? This action is strictly restricted to workspace Owners.`
      )
    ) {
      store.deleteClient(editingClient.id)
      setEditingClient(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Clients</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage commercial client directory and project entries across global currencies.
          </p>
        </div>
        {permissions.canCreateClient && (
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Client
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5E7EB] shadow-2xs">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#6B7280]">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 border border-[#E5E7EB] rounded-md px-3 text-xs bg-white text-[#111827] focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {CLIENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Client Table / Card Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Get started by adding your first client or adjust your search filters."
          actionLabel={permissions.canCreateClient ? 'Add Client' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto max-w-full touch-pan-x">
            <table className="w-full text-left text-sm text-[#111827] min-w-[720px]">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap">Company & Contact</th>
                  <th className="px-6 py-3 whitespace-nowrap">Industry</th>
                  <th className="px-6 py-3 whitespace-nowrap">Currency</th>
                  <th className="px-6 py-3 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 whitespace-nowrap">Projects</th>
                  {permissions.canViewPaymentInfo && <th className="px-6 py-3 text-right whitespace-nowrap">Financial Summary</th>}
                  <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredClients.map((client) => {
                  const clientProjects = state.projects.filter((p) => p.client_id === client.id)
                  const clientQuotations = state.quotations.filter((q) => q.client_id === client.id)
                  const totalQuoted = clientQuotations.reduce((acc, q) => acc + q.amount, 0)
                  const clientCurrency = client.currency || state.settings?.default_currency || 'INR'

                  return (
                    <tr key={client.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          to={`/clients/${client.id}`}
                          className="font-semibold text-[#111827] hover:text-indigo-600 transition-colors block"
                        >
                          {client.company_name}
                        </Link>
                        <div className="text-xs text-[#6B7280]">
                          {client.contact_name}
                          {client.email ? ` • ${client.email}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6B7280]">
                        {client.industry || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#4B5563]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                          {clientCurrency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            client.status === 'won' || client.status === 'in_progress'
                              ? 'success'
                              : client.status === 'proposal_sent'
                              ? 'purple'
                              : 'default'
                          }
                        >
                          {client.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#111827]">
                        {clientProjects.length} active
                      </td>
                      {permissions.canViewPaymentInfo && (
                        <td className="px-6 py-4 text-right text-xs font-mono font-semibold text-emerald-700">
                          {formatCurrency(totalQuoted, clientCurrency)}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {permissions.canEditClient && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditClientModal(client)}
                              title="Edit Client & Settings"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Link to={`/clients/${client.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Client"
        description="Enter commercial details for the new agency client."
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}
          <Input
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            required
          />
          <Input
            label="Contact Person"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="e.g. Jane Doe"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jane@acme.com (Optional)"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210 (Optional)"
            />
            <Input
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. E-Commerce"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Client Status <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClientStatus)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {CLIENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Client Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.label} {curr.code === 'INR' ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Google Drive Link (Folder)"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Client</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      {editingClient && (
        <Modal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          title={`Edit Client: ${editingClient.company_name}`}
          description="Update client commercial profile, contact info, or status."
        >
          <form onSubmit={handleUpdateClient} className="space-y-4">
            {editFormError && <p className="text-xs text-rose-600 font-medium">{editFormError}</p>}
            <Input
              label="Company Name"
              value={editCompanyName}
              onChange={(e) => setEditCompanyName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              required
            />
            <Input
              label="Contact Person"
              value={editContactName}
              onChange={(e) => setEditContactName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="e.g. jane@acme.com (Optional)"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210 (Optional)"
              />
              <Input
                label="Industry"
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
                placeholder="e.g. E-Commerce"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Client Status <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ClientStatus)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {CLIENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Client Preferred Currency
                </label>
                <select
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.label} {curr.code === 'INR' ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label="Google Drive Link (Folder)"
              value={editDriveUrl}
              onChange={(e) => setEditDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
            />
            <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
              {permissions.canDeleteClient ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClient}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete Client
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingClient(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
