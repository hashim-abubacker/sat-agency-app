import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  FolderKanban,
  FileText,
  Plus,
  ArrowLeft,
  Edit2,
  CreditCard,
  History,
  CheckCircle2,
  Trash2,
  Calendar,
} from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency, SUPPORTED_CURRENCIES, getCurrencyInfo } from '@/lib/utils'
import { CLIENT_STATUS_OPTIONS, type Quotation, type QuotationStatus, type PaymentRecord, type ClientStatus } from '@/types'

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { state, store } = useAgencyStore()
  const permissions = usePermissions()
  const [activeTab, setActiveTab] = useState<'projects' | 'quotations'>('projects')

  const client = state.clients.find((c) => c.id === clientId)
  const clientCurrency = client?.currency || state.settings?.default_currency || 'INR'

  // Edit Client Modal State
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false)
  const [editCompanyName, setEditCompanyName] = useState('')
  const [editContactName, setEditContactName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editIndustry, setEditIndustry] = useState('')
  const [editStatus, setEditStatus] = useState<ClientStatus>('won')
  const [editCurrency, setEditCurrency] = useState('INR')
  const [editDriveUrl, setEditDriveUrl] = useState('')
  const [editFormError, setEditFormError] = useState('')

  const openEditClientModal = () => {
    if (!client) return
    setEditCompanyName(client.company_name)
    setEditContactName(client.contact_name)
    setEditEmail(client.email || '')
    setEditPhone(client.phone || '')
    setEditIndustry(client.industry || '')
    setEditStatus(client.status)
    setEditCurrency(client.currency || clientCurrency)
    setEditDriveUrl(client.drive_url || '')
    setEditFormError('')
    setIsEditClientModalOpen(true)
  }

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return
    setEditFormError('')

    if (!editCompanyName.trim() || !editContactName.trim()) {
      setEditFormError('Company name and contact person are required.')
      return
    }

    store.updateClient(client.id, {
      company_name: editCompanyName.trim(),
      contact_name: editContactName.trim(),
      email: editEmail.trim() || null,
      phone: editPhone.trim() || null,
      industry: editIndustry.trim() || null,
      status: editStatus,
      currency: editCurrency,
      drive_url: editDriveUrl.trim() || null,
    })

    setIsEditClientModalOpen(false)
  }

  const handleDeleteClient = () => {
    if (!client) return
    if (
      window.confirm(
        `Are you sure you want to delete "${client.company_name}"? This action is strictly restricted to workspace Owners.`
      )
    ) {
      store.deleteClient(client.id)
      setIsEditClientModalOpen(false)
      navigate('/clients')
    }
  }

  // New Quotation Modal State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false)
  const [qtNumber, setQtNumber] = useState(`QT-2026-${Math.floor(100 + Math.random() * 900)}`)
  const [qtCurrency, setQtCurrency] = useState(clientCurrency)
  const [qtAmount, setQtAmount] = useState<number>(50000)
  const [qtAdvance, setQtAdvance] = useState<number>(25000)
  const [qtRemarks, setQtRemarks] = useState('')
  const [qtDriveUrl, setQtDriveUrl] = useState('')

  // Edit Quotation Modal State
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [editQtNumber, setEditQtNumber] = useState('')
  const [editQtStatus, setEditQtStatus] = useState<QuotationStatus>('draft')
  const [editQtCurrency, setEditQtCurrency] = useState('INR')
  const [editQtAmount, setEditQtAmount] = useState<number>(0)
  const [editQtAdvance, setEditQtAdvance] = useState<number>(0)
  const [editQtDriveUrl, setEditQtDriveUrl] = useState('')
  const [editQtRemarks, setEditQtRemarks] = useState('')

  // Payment History & Management Modal State
  const [historyQuotation, setHistoryQuotation] = useState<Quotation | null>(null)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editPayAmount, setEditPayAmount] = useState<number>(0)
  const [editPayDate, setEditPayDate] = useState('')
  const [editPayMethod, setEditPayMethod] = useState('Bank Transfer')
  const [editPayNotes, setEditPayNotes] = useState('')

  // New Payment Form in History Modal
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [newPayAmount, setNewPayAmount] = useState<number>(0)
  const [newPayDate, setNewPayDate] = useState(new Date().toISOString().split('T')[0])
  const [newPayMethod, setNewPayMethod] = useState('Bank Transfer')
  const [newPayNotes, setNewPayNotes] = useState('')

  if (!client || !permissions.canAccessClient(client.id)) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E5E7EB] space-y-4">
        <h2 className="text-lg font-semibold text-[#111827]">Client Not Found or Access Denied</h2>
        <p className="text-xs text-[#6B7280]">
          The client record does not exist or you do not have authorization to view it.
        </p>
        <Link to="/clients">
          <Button size="sm" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Clients
          </Button>
        </Link>
      </div>
    )
  }

  const projects = state.projects.filter((p) => p.client_id === client.id)
  const quotations = state.quotations.filter((q) => q.client_id === client.id)

  // Keep live reference for open history modal quotation
  const activeHistoryQuotation = historyQuotation
    ? state.quotations.find((q) => q.id === historyQuotation.id) || historyQuotation
    : null

  const selectedCurrencySymbol = getCurrencyInfo(qtCurrency).symbol
  const editCurrencySymbol = getCurrencyInfo(editQtCurrency).symbol


  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault()
    store.addQuotation({
      client_id: client.id,
      quotation_number: qtNumber,
      amount: Number(qtAmount),
      advance_received: Number(qtAdvance),
      balance: Number(qtAmount) - Number(qtAdvance),
      status: 'draft',
      currency: qtCurrency,
      remarks: qtRemarks.trim() || null,
      drive_url: qtDriveUrl.trim() || null,
    })
    setIsQuotationModalOpen(false)
  }

  const openEditQuotationModal = (q: Quotation) => {
    setEditingQuotation(q)
    setEditQtNumber(q.quotation_number)
    setEditQtStatus(q.status)
    setEditQtCurrency(q.currency || clientCurrency)
    setEditQtAmount(q.amount)
    setEditQtAdvance(q.advance_received)
    setEditQtDriveUrl(q.drive_url || '')
    setEditQtRemarks(q.remarks || '')
  }

  const handleUpdateQuotation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuotation) return
    store.updateQuotation(editingQuotation.id, {
      quotation_number: editQtNumber,
      status: editQtStatus,
      currency: editQtCurrency,
      amount: Number(editQtAmount),
      advance_received: Number(editQtAdvance),
      drive_url: editQtDriveUrl.trim() || null,
      remarks: editQtRemarks.trim() || null,
    })
    setEditingQuotation(null)
  }

  const openPaymentHistoryModal = (q: Quotation) => {
    setHistoryQuotation(q)
    setIsAddingPayment(false)
    setEditingPaymentId(null)
    setNewPayAmount(q.balance > 0 ? q.balance : 0)
    setNewPayDate(new Date().toISOString().split('T')[0])
    setNewPayMethod('Bank Transfer')
    setNewPayNotes('')
  }

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeHistoryQuotation || newPayAmount <= 0) return
    store.recordPayment(activeHistoryQuotation.id, {
      amount: Number(newPayAmount),
      payment_date: newPayDate,
      payment_method: newPayMethod,
      notes: newPayNotes.trim() || undefined,
    })
    setIsAddingPayment(false)
    setNewPayAmount(0)
    setNewPayNotes('')
  }

  const startEditPayment = (p: PaymentRecord) => {
    setEditingPaymentId(p.id)
    setEditPayAmount(p.amount)
    setEditPayDate(p.payment_date)
    setEditPayMethod(p.payment_method || 'Bank Transfer')
    setEditPayNotes(p.notes || '')
  }

  const handleSavePaymentEdit = (paymentId: string) => {
    if (!activeHistoryQuotation) return
    store.updatePaymentRecord(activeHistoryQuotation.id, paymentId, {
      amount: Number(editPayAmount),
      payment_date: editPayDate,
      payment_method: editPayMethod,
      notes: editPayNotes.trim() || undefined,
    })
    setEditingPaymentId(null)
  }

  const handleDeletePayment = (paymentId: string) => {
    if (!activeHistoryQuotation) return
    if (
      window.confirm(
        'Are you sure you want to delete this payment record? The quotation advance received and remaining balance will automatically recalculate.'
      )
    ) {
      store.deletePaymentRecord(activeHistoryQuotation.id, paymentId)
    }
  }

  const handleDeleteQuotation = (quotationId: string) => {
    const q = state.quotations.find((item) => item.id === quotationId)
    if (!q) return
    if (
      window.confirm(
        `Are you sure you want to delete quotation "${q.quotation_number}"? This will also remove its associated payment history.`
      )
    ) {
      store.deleteQuotation(quotationId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Header */}
      <div>
        <Link to="/clients" className="inline-flex items-center text-xs text-[#6B7280] hover:text-indigo-600 mb-2">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Clients
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
              {client.company_name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[#111827]">{client.company_name}</h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  {clientCurrency}
                </span>
                {permissions.canEditClient ? (
                  <select
                    value={client.status}
                    onChange={(e) =>
                      store.updateClient(client.id, { status: e.target.value as ClientStatus })
                    }
                    className="text-xs font-medium rounded-md px-2 py-0.5 border border-[#E5E7EB] bg-white text-[#111827] cursor-pointer hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    {CLIENT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
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
                )}
              </div>
              <p className="text-xs text-[#6B7280]">
                Contact: <span className="font-semibold">{client.contact_name}</span>
                {client.email ? ` (${client.email})` : ''}
                {client.phone ? ` • ${client.phone}` : ''}
                {client.industry ? ` • ${client.industry}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {permissions.canEditClient && (
              <Button variant="outline" size="sm" onClick={openEditClientModal}>
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Client
              </Button>
            )}
            {client.drive_url ? (
              <a href={client.drive_url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Drive Folder
                </Button>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[#E5E7EB] gap-6">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'projects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Projects ({projects.length})
        </button>
        {permissions.canViewQuotations && (
          <button
            onClick={() => setActiveTab('quotations')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'quotations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <FileText className="w-4 h-4" /> Quotations ({quotations.length})
          </button>
        )}
      </div>

      {/* Projects View */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111827]">Active Projects</h2>
            {permissions.canCreateProject && (
              <Link to="/projects">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> New Project
                </Button>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={project.priority === 'critical' ? 'danger' : 'purple'}>
                    {project.priority}
                  </Badge>
                  <Badge variant="outline">{project.status.replace('_', ' ')}</Badge>
                </div>
                <h3 className="font-semibold text-sm text-[#111827]">{project.name}</h3>
                <p className="text-xs text-[#6B7280] line-clamp-2">{project.description}</p>
                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-[11px] text-[#6B7280]">Due: {project.due_date || 'N/A'}</span>
                  <Link to={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm">
                      View Project →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quotations View (Owner & Admin) */}
      {activeTab === 'quotations' && permissions.canViewQuotations && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111827]">Commercial Quotations</h2>
            {permissions.canCreateQuotation && (
              <Button size="sm" onClick={() => setIsQuotationModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create Quotation
              </Button>
            )}
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
            <table className="w-full text-left text-sm text-[#111827]">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] font-semibold text-[#6B7280] uppercase">
                <tr>
                  <th className="px-6 py-3">Quotation #</th>
                  <th className="px-6 py-3">Currency</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Advance Received</th>
                  <th className="px-6 py-3">Balance</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {quotations.map((q) => {
                  const qCurr = q.currency || clientCurrency
                  const paymentCount = q.payments?.length || (q.advance_received > 0 ? 1 : 0)

                  return (
                    <tr key={q.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-indigo-600">
                        {q.quotation_number}
                        {q.remarks && <div className="text-[11px] font-sans font-normal text-gray-500">{q.remarks}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {qCurr}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">{formatCurrency(q.amount, qCurr)}</td>
                      <td className="px-6 py-4 font-mono text-emerald-600">{formatCurrency(q.advance_received, qCurr)}</td>
                      <td className="px-6 py-4 font-mono text-amber-600">{formatCurrency(q.balance, qCurr)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={q.status === 'approved' ? 'success' : q.status === 'sent' ? 'purple' : 'warning'}>
                          {q.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {permissions.canRecordPayment && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentHistoryModal(q)}
                            className="text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 border-indigo-200"
                          >
                            <History className="w-3.5 h-3.5 mr-1" /> Payment History ({paymentCount})
                          </Button>
                        )}
                        {permissions.canEditQuotation && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditQuotationModal(q)}
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                        )}
                        {permissions.canDeleteQuotation && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuotation(q.id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditClientModalOpen}
        onClose={() => setIsEditClientModalOpen(false)}
        title={`Edit Client: ${client.company_name}`}
        description="Update commercial client profile, contact info, status, and preferred currency."
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
              <Button type="button" variant="outline" onClick={() => setIsEditClientModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </div>
        </form>
      </Modal>


      {/* Create New Quotation Modal */}
      <Modal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        title="Create New Quotation"
        description="Add a financial quotation for this client."
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <Input label="Quotation Number" value={qtNumber} onChange={(e) => setQtNumber(e.target.value)} required />
          
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">
              Quotation Currency
            </label>
            <select
              value={qtCurrency}
              onChange={(e) => setQtCurrency(e.target.value)}
              className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.label} {curr.code === 'INR' ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Total Amount (${selectedCurrencySymbol})`}
              type="number"
              value={qtAmount}
              onChange={(e) => setQtAmount(Number(e.target.value))}
              required
            />
            <Input
              label={`Advance Received (${selectedCurrencySymbol})`}
              type="number"
              value={qtAdvance}
              onChange={(e) => setQtAdvance(Number(e.target.value))}
              required
            />
          </div>
          <Input
            label="Quotation Remarks"
            value={qtRemarks}
            onChange={(e) => setQtRemarks(e.target.value)}
            placeholder="e.g. 50% advance upon contract signing"
          />
          <Input
            label="Google Drive PDF URL"
            value={qtDriveUrl}
            onChange={(e) => setQtDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="outline" onClick={() => setIsQuotationModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Quotation</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Quotation Modal */}
      {editingQuotation && (
        <Modal
          isOpen={!!editingQuotation}
          onClose={() => setEditingQuotation(null)}
          title={`Edit Quotation: ${editingQuotation.quotation_number}`}
          description="Update quotation details, financial parameters, or Google Drive PDF link."
        >
          <form onSubmit={handleUpdateQuotation} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quotation Number"
                value={editQtNumber}
                onChange={(e) => setEditQtNumber(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Status</label>
                <select
                  value={editQtStatus}
                  onChange={(e) => setEditQtStatus(e.target.value as QuotationStatus)}
                  className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="approved">Approved / Fully Paid</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">Quotation Currency</label>
              <select
                value={editQtCurrency}
                onChange={(e) => setEditQtCurrency(e.target.value)}
                className="w-full h-9 border border-[#E5E7EB] rounded-md px-3 text-sm text-[#111827] bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={`Total Amount (${editCurrencySymbol})`}
                type="number"
                value={editQtAmount}
                onChange={(e) => setEditQtAmount(Number(e.target.value))}
                required
              />
              <Input
                label={`Total Advance Received (${editCurrencySymbol})`}
                type="number"
                value={editQtAdvance}
                onChange={(e) => setEditQtAdvance(Number(e.target.value))}
                required
              />
            </div>

            <Input
              label="Google Drive PDF Link (File URL)"
              value={editQtDriveUrl}
              onChange={(e) => setEditQtDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
            />

            <Input
              label="Remarks / Terms"
              value={editQtRemarks}
              onChange={(e) => setEditQtRemarks(e.target.value)}
              placeholder="e.g. 50% advance received, balance due on completion"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button type="button" variant="outline" onClick={() => setEditingQuotation(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment History & Management Modal */}
      {activeHistoryQuotation && (
        <Modal
          isOpen={!!activeHistoryQuotation}
          onClose={() => setHistoryQuotation(null)}
          title={`Payment History — ${activeHistoryQuotation.quotation_number}`}
          description="View, edit, or record payment installments for this quotation."
        >
          <div className="space-y-5">
            {/* Financial Summary Card */}
            <div className="p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[#6B7280] block">Total Amount</span>
                <span className="font-mono font-bold text-[#111827]">
                  {formatCurrency(activeHistoryQuotation.amount, activeHistoryQuotation.currency || clientCurrency)}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Total Paid</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatCurrency(activeHistoryQuotation.advance_received, activeHistoryQuotation.currency || clientCurrency)}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Remaining Balance</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatCurrency(activeHistoryQuotation.balance, activeHistoryQuotation.currency || clientCurrency)}
                </span>
              </div>
            </div>

            {/* Payment History Entries List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-600" />
                  Received Payments ({activeHistoryQuotation.payments?.length || 0})
                </h4>
                {!isAddingPayment && permissions.canRecordPayment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingPayment(true)
                      setNewPayAmount(activeHistoryQuotation.balance > 0 ? activeHistoryQuotation.balance : 0)
                      setNewPayDate(new Date().toISOString().split('T')[0])
                    }}
                    className="text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Payment
                  </Button>
                )}
              </div>

              {(!activeHistoryQuotation.payments || activeHistoryQuotation.payments.length === 0) && !isAddingPayment ? (
                <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No payment records logged yet. Click "+ Add Payment" to log a payment.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {activeHistoryQuotation.payments?.map((p) => {
                    const isEditingThis = editingPaymentId === p.id

                    if (isEditingThis) {
                      return (
                        <div key={p.id} className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200 space-y-2">
                          <div className="text-xs font-bold text-indigo-900">Edit Payment Record</div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              label={`Amount (${getCurrencyInfo(activeHistoryQuotation.currency || clientCurrency).symbol})`}
                              type="number"
                              value={editPayAmount}
                              onChange={(e) => setEditPayAmount(Number(e.target.value))}
                              required
                            />
                            <Input
                              label="Date"
                              type="date"
                              value={editPayDate}
                              onChange={(e) => setEditPayDate(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#111827] mb-1">Method</label>
                            <select
                              value={editPayMethod}
                              onChange={(e) => setEditPayMethod(e.target.value)}
                              className="w-full h-8 border border-[#E5E7EB] rounded-md px-2 text-xs bg-white"
                            >
                              <option value="Bank Transfer">Bank Transfer (Wire / ACH)</option>
                              <option value="UPI / Online">UPI / Online Payment</option>
                              <option value="Credit Card">Credit Card / Debit Card</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Cash">Cash</option>
                            </select>
                          </div>
                          <Input
                            label="Notes / Reference #"
                            value={editPayNotes}
                            onChange={(e) => setEditPayNotes(e.target.value)}
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <Button size="sm" variant="outline" onClick={() => setEditingPaymentId(null)}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => handleSavePaymentEdit(p.id)}>
                              Save Entry
                            </Button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg bg-white border border-[#E5E7EB] hover:border-gray-300 transition-colors flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[#111827]">
                              {p.payment_method || 'Payment'}
                            </span>
                            <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {p.payment_date}
                            </span>
                          </div>
                          {p.notes && <div className="text-xs text-gray-600">{p.notes}</div>}
                          {p.created_by && <div className="text-[10px] text-gray-400">Logged by: {p.created_by}</div>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-emerald-700">
                            +{formatCurrency(p.amount, activeHistoryQuotation.currency || clientCurrency)}
                          </span>
                          {permissions.canRecordPayment && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditPayment(p)}
                                title="Edit Payment Date, Method or Amount"
                                className="text-indigo-600 hover:bg-indigo-50 h-7 px-2 text-xs"
                              >
                                <Edit2 className="w-3 h-3 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePayment(p.id)}
                                title="Delete Payment Record"
                                className="text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs"
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add New Payment Form */}
              {isAddingPayment && (
                <form onSubmit={handleAddPayment} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-3 pt-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Record New Payment Entry
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsAddingPayment(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label={`Payment Amount (${getCurrencyInfo(activeHistoryQuotation.currency || clientCurrency).symbol})`}
                      type="number"
                      value={newPayAmount}
                      onChange={(e) => setNewPayAmount(Number(e.target.value))}
                      required
                    />
                    <Input
                      label="Payment Date"
                      type="date"
                      value={newPayDate}
                      onChange={(e) => setNewPayDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1">Payment Method</label>
                    <select
                      value={newPayMethod}
                      onChange={(e) => setNewPayMethod(e.target.value)}
                      className="w-full h-8 border border-[#E5E7EB] rounded-md px-2 text-xs bg-white"
                    >
                      <option value="Bank Transfer">Bank Transfer (Wire / ACH)</option>
                      <option value="UPI / Online">UPI / Online Payment</option>
                      <option value="Credit Card">Credit Card / Debit Card</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <Input
                    label="Notes / Reference #"
                    value={newPayNotes}
                    onChange={(e) => setNewPayNotes(e.target.value)}
                    placeholder="e.g. Transaction Ref #123456"
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingPayment(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Add Entry
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
              <Button type="button" variant="outline" size="sm" onClick={() => setHistoryQuotation(null)}>
                Close History
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
