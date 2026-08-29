import type { User, Client, Quotation, Project, Task, ActivityLog, UserRole, AgencySettings, PaymentRecord, ContentItem, Reminder } from '@/types'
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_QUOTATIONS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_CONTENT_ITEMS,
  INITIAL_REMINDERS,
} from './mockData'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_STORAGE_KEY = 'SAT_AGENCY_STATE_V4'
const BROADCAST_CHANNEL_NAME = 'SAT_AGENCY_SYNC_CHANNEL'

interface AgencyState {
  currentUser: User | null
  users: User[]
  clients: Client[]
  quotations: Quotation[]
  projects: Project[]
  tasks: Task[]
  contentItems: ContentItem[]
  reminders: Reminder[]
  activityLogs: ActivityLog[]
  settings: AgencySettings
}

class Store {
  private state: AgencyState
  private listeners: Set<() => void> = new Set()
  private broadcastChannel: BroadcastChannel | null = null
  private cloudStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'unconfigured' = 'idle'
  private lastSyncedAt: string | null = null
  private lastSyncError: string | null = null
  private cachedSnapshot: AgencyState | null = null
  private lastStateRef: AgencyState | null = null

  constructor() {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const hasLegacyData =
          (parsed.users || []).some(
            (u: User) =>
              u.email === 'owner@agency.com' ||
              u.full_name === 'Elena Rostova' ||
              u.email?.includes('@eyb.digital') ||
              u.email === 'contact@hashim.in'
          ) ||
          (parsed.clients || []).some(
            (c: Client) => c.company_name === 'Cafe Elam' || c.company_name === 'Nexus Tech Solutions'
          )

        if (hasLegacyData) {
          this.state = this.getInitialState()
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state))
        } else {
          let usersList: User[] = parsed.users || INITIAL_USERS
          const existingEmails = new Set(usersList.map((u) => u.email.toLowerCase()))
          INITIAL_USERS.forEach((initUser) => {
            if (!existingEmails.has(initUser.email.toLowerCase())) {
              usersList.push(initUser)
            }
          })

          this.state = {
            ...this.getInitialState(),
            ...parsed,
            users: usersList,
            currentUser: parsed.currentUser !== undefined ? parsed.currentUser : null,
            contentItems: parsed.contentItems || this.getInitialState().contentItems,
            settings: {
              ...this.getInitialState().settings,
              ...(parsed.settings || {}),
            },
          }
        }
      } catch {
        this.state = this.getInitialState()
      }
    } else {
      this.state = this.getInitialState()
    }
    this.autoArchiveCompletedTasks()
    this.initCrossTabSync()
    this.initSupabaseRealtime()
    this.syncFromCloud()
    this.startBackgroundAutoSync()
  }

  private startBackgroundAutoSync() {
    if (typeof window === 'undefined') return
    // Auto-poll Supabase cloud state every 10 seconds as a fallback
    setInterval(() => {
      this.syncFromCloud()
    }, 10000)
  }

  private initSupabaseRealtime() {
    if (!isSupabaseConfigured || typeof window === 'undefined') {
      this.cloudStatus = 'unconfigured'
      return
    }
    try {
      supabase
        .channel('public:agency_state')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agency_state',
            filter: 'id=eq.sat_agency_master',
          },
          (payload) => {
            if (payload.new && (payload.new as any).state) {
              console.log('[Supabase Realtime] Incoming remote change detected! Merging workspace data...')
              this.mergeRemoteState((payload.new as any).state)
              this.cloudStatus = 'synced'
              this.lastSyncedAt = new Date().toISOString()
              this.lastSyncError = null
              this.notify()
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Supabase Realtime] Subscribed to agency_state live updates')
          }
        })
    } catch (err: any) {
      console.warn('[Supabase Realtime] Could not subscribe to realtime channel:', err?.message)
    }
  }

  private initCrossTabSync() {
    if (typeof window === 'undefined') return
    try {
      window.addEventListener('storage', (e) => {
        if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue)
            this.state = {
              ...this.state,
              ...parsed,
              currentUser: this.state.currentUser,
            }
            this.notify()
          } catch {
            // ignore
          }
        }
      })

      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'STATE_UPDATED' && event.data?.state) {
            this.state = {
              ...this.state,
              ...event.data.state,
              currentUser: this.state.currentUser,
            }
            this.notify()
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private getInitialState(): AgencyState {
    return {
      currentUser: null, // Requires login on initial load
      users: INITIAL_USERS,
      clients: INITIAL_CLIENTS,
      quotations: INITIAL_QUOTATIONS,
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      contentItems: INITIAL_CONTENT_ITEMS,
      reminders: INITIAL_REMINDERS,
      activityLogs: INITIAL_ACTIVITY_LOGS,
      settings: {
        agency_name: 'EMAC Agency',
        default_currency: 'INR',
        drive_root_url: 'https://drive.google.com/drive/folders/emac-agency-root',
      },
    }
  }

  private save() {
    this.state = {
      ...this.state,
      users: [...this.state.users],
      clients: [...this.state.clients],
      quotations: [...this.state.quotations],
      projects: [...this.state.projects],
      tasks: [...this.state.tasks],
      contentItems: [...this.state.contentItems],
      reminders: [...(this.state.reminders || [])],
      activityLogs: [...this.state.activityLogs],
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state))
    try {
      this.broadcastChannel?.postMessage({ type: 'STATE_UPDATED', state: this.state })
    } catch {
      // ignore
    }
    this.saveToCloud()
    this.createDailySnapshot()
    this.notify()
  }

  public getCloudSyncStatus() {
    return {
      status: this.cloudStatus,
      lastSyncedAt: this.lastSyncedAt,
      lastSyncError: this.lastSyncError,
      isConfigured: isSupabaseConfigured,
    }
  }

  private mergeRemoteState(remoteState: Partial<AgencyState>) {
    if (!remoteState) return

    const mergeById = <T extends { id: string; updated_at?: string; deleted_at?: string | null }>(
      local: T[] = [],
      remote: T[] = []
    ): T[] => {
      const map = new Map<string, T>()
      local.forEach((item) => map.set(item.id, item))
      remote.forEach((remoteItem) => {
        const localItem = map.get(remoteItem.id)
        if (!localItem) {
          map.set(remoteItem.id, remoteItem)
        } else {
          const getEffectiveTime = (item: T) => {
            const updated = item.updated_at ? new Date(item.updated_at).getTime() : 0
            const deleted = item.deleted_at ? new Date(item.deleted_at).getTime() : 0
            return Math.max(updated, deleted)
          }
          const localTime = getEffectiveTime(localItem)
          const remoteTime = getEffectiveTime(remoteItem)
          if (remoteTime >= localTime) {
            map.set(remoteItem.id, remoteItem)
          }
        }
      })
      return Array.from(map.values())
    }

    const mergedUsers = mergeById(this.state.users, remoteState.users)
    const mergedClients = mergeById(this.state.clients, remoteState.clients)
    const mergedQuotations = mergeById(this.state.quotations, remoteState.quotations)
    const mergedProjects = mergeById(this.state.projects, remoteState.projects)
    const mergedTasks = mergeById(this.state.tasks, remoteState.tasks)
    const mergedContentItems = mergeById(this.state.contentItems, remoteState.contentItems)
    const mergedReminders = mergeById(this.state.reminders || [], remoteState.reminders || [])
    const mergedActivityLogs = mergeById(this.state.activityLogs, remoteState.activityLogs)

    this.state = {
      ...this.state,
      ...remoteState,
      users: mergedUsers,
      clients: mergedClients,
      quotations: mergedQuotations,
      projects: mergedProjects,
      tasks: mergedTasks,
      contentItems: mergedContentItems,
      reminders: mergedReminders,
      activityLogs: mergedActivityLogs,
      currentUser: this.state.currentUser,
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state))
    this.notify()
  }

  public async syncFromCloud(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      this.cloudStatus = 'unconfigured'
      return { success: false, error: 'Supabase credentials not configured in .env' }
    }
    this.cloudStatus = 'syncing'
    this.notify()
    try {
      const { data, error } = await supabase
        .from('agency_state')
        .select('state, updated_at')
        .eq('id', 'sat_agency_master')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Row doesn't exist yet in Supabase -> save local state to cloud to initialize it!
          console.log('[Supabase Sync] Master state row sat_agency_master missing. Uploading current state...')
          const res = await this.saveToCloud()
          return res
        }
        if (error.code === '42P01') {
          const errMsg = 'Database table "agency_state" does not exist in Supabase. Please run schema.sql in your Supabase SQL Editor.'
          console.error('[Supabase Sync Error]', errMsg)
          this.cloudStatus = 'error'
          this.lastSyncError = errMsg
          this.notify()
          return { success: false, error: errMsg }
        }
        throw error
      }

      if (data?.state) {
        this.mergeRemoteState(data.state)
        // Automatically persist merged union of local + cloud data back to Supabase
        await this.saveToCloud()
        this.cloudStatus = 'synced'
        this.lastSyncedAt = data.updated_at || new Date().toISOString()
        this.lastSyncError = null
      } else {
        await this.saveToCloud()
        this.cloudStatus = 'synced'
      }
      this.notify()
      return { success: true }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to fetch agency state from Supabase'
      console.error('[Supabase Sync Error]', err)
      this.cloudStatus = 'error'
      this.lastSyncError = errMsg
      this.notify()
      return { success: false, error: errMsg }
    }
  }

  public async saveToCloud(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase credentials not configured' }
    try {
      const { error } = await supabase.from('agency_state').upsert({
        id: 'sat_agency_master',
        state: this.state,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        if (error.code === '42P01') {
          const errMsg = 'Table "agency_state" does not exist in Supabase. Please run schema.sql in Supabase SQL Editor.'
          console.error('[Supabase Save Error]', errMsg)
          this.cloudStatus = 'error'
          this.lastSyncError = errMsg
          this.notify()
          return { success: false, error: errMsg }
        }
        throw error
      }

      this.cloudStatus = 'synced'
      this.lastSyncedAt = new Date().toISOString()
      this.lastSyncError = null
      this.notify()
      return { success: true }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to save agency state to Supabase cloud'
      console.error('[Supabase Save Error]', err)
      this.cloudStatus = 'error'
      this.lastSyncError = errMsg
      this.notify()
      return { success: false, error: errMsg }
    }
  }

  public exportStateAsJson(): string {
    return JSON.stringify(this.state, null, 2)
  }

  public importStateFromJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr)
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.clients)) {
        this.state = {
          ...this.getInitialState(),
          ...parsed,
          currentUser: this.state.currentUser || parsed.currentUser,
        }
        this.save()
        return true
      }
    } catch {
      // ignore invalid json
    }
    return false
  }

  private createDailySnapshot() {
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const snapshotKey = `SAT_AUTO_SNAPSHOT_${todayStr}`
      localStorage.setItem(snapshotKey, JSON.stringify({
        snapshot_date: todayStr,
        saved_at: new Date().toISOString(),
        state: this.state,
      }))
    } catch {
      // Ignore quota exceptions if storage full
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((fn) => fn())
  }

  public getState(): AgencyState {
    if (this.lastStateRef === this.state && this.cachedSnapshot) {
      return this.cachedSnapshot
    }
    this.lastStateRef = this.state
    this.cachedSnapshot = {
      ...this.state,
      users: (this.state.users || []).filter((u) => !u.deleted_at),
      clients: (this.state.clients || []).filter((c) => !c.deleted_at),
      quotations: (this.state.quotations || []).filter((q) => !q.deleted_at),
      projects: (this.state.projects || []).filter((p) => !p.deleted_at),
      tasks: (this.state.tasks || []).filter((t) => !t.deleted_at),
      contentItems: (this.state.contentItems || []).filter((c) => !c.deleted_at),
      reminders: (this.state.reminders || []).filter((r) => !r.deleted_at),
    }
    return this.cachedSnapshot
  }

  public getRawState(): AgencyState {
    return this.state
  }

  // --- Auth Actions ---
  public setCurrentUserRole(role: UserRole) {
    const targetUser = this.state.users.find((u) => u.role === role) || this.state.users[0]
    this.state.currentUser = targetUser
    this.save()
  }

  public loginUser(email: string): User | null {
    const cleanEmail = (email || '').trim().toLowerCase()
    if (!cleanEmail) return null

    // 1. Search in current state users
    let user = (this.state.users || []).find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.email.toLowerCase().split('@')[0] === cleanEmail ||
        u.full_name.toLowerCase() === cleanEmail
    )

    // 2. Fallback to INITIAL_USERS if state users were out of sync
    if (!user) {
      user = INITIAL_USERS.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail ||
          u.email.toLowerCase().split('@')[0] === cleanEmail ||
          u.full_name.toLowerCase().includes(cleanEmail)
      )
      if (user) {
        // Ensure user is added into active state users
        const exists = this.state.users.some((u) => u.id === user!.id || u.email.toLowerCase() === user!.email.toLowerCase())
        if (!exists) {
          this.state.users = [...this.state.users, user]
        }
      }
    }

    if (user) {
      this.state.currentUser = user
      this.save()
      return user
    }
    return null
  }

  public logout() {
    this.state.currentUser = null
    this.save()
  }

  // --- Settings Actions ---
  public updateSettings(updates: Partial<AgencySettings>): AgencySettings {
    this.state.settings = {
      ...this.state.settings,
      ...updates,
    }
    this.logActivity('user', this.state.currentUser?.id || 'system', 'update', `Updated agency settings (Default Currency: ${this.state.settings.default_currency})`)
    this.save()
    return this.state.settings
  }

  // --- Client Actions ---
  public addClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Client {
    const newClient: Client = {
      currency: this.state.settings.default_currency || 'INR',
      ...client,
      id: `cli-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.state.clients.unshift(newClient)
    this.logActivity('client', newClient.id, 'create', `Created client ${newClient.company_name}`)
    this.save()
    return newClient
  }

  public updateClient(id: string, updates: Partial<Client>): Client | null {
    const index = this.state.clients.findIndex((c) => c.id === id)
    if (index === -1) return null
    const updated = {
      ...this.state.clients[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    this.state.clients[index] = updated
    this.logActivity('client', id, 'update', `Updated client ${updated.company_name}`)
    this.save()
    return updated
  }

  public deleteClient(id: string) {
    const client = this.state.clients.find((c) => c.id === id)
    if (client) {
      const now = new Date().toISOString()
      client.deleted_at = now
      client.updated_at = now
      this.logActivity('client', id, 'delete', `Archived client ${client.company_name}`)
      this.save()
    }
  }

  // --- Quotation Actions ---
  public addQuotation(quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>): Quotation {
    const client = this.state.clients.find((c) => c.id === quotation.client_id)
    const newQuotation: Quotation = {
      currency: client?.currency || this.state.settings?.default_currency || 'INR',
      ...quotation,
      id: `q-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.state.quotations.unshift(newQuotation)
    this.logActivity('quotation', newQuotation.id, 'create', `Created quotation ${newQuotation.quotation_number}`)
    this.save()
    return newQuotation
  }

  public updateQuotation(id: string, updates: Partial<Quotation>): Quotation | null {
    const index = this.state.quotations.findIndex((q) => q.id === id)
    if (index === -1) return null
    const current = this.state.quotations[index]
    const amount = updates.amount !== undefined ? updates.amount : current.amount
    const advance_received = updates.advance_received !== undefined ? updates.advance_received : current.advance_received
    const balance = amount - advance_received

    const updated = {
      ...current,
      ...updates,
      amount,
      advance_received,
      balance,
      updated_at: new Date().toISOString(),
    }
    this.state.quotations[index] = updated
    this.logActivity('quotation', id, 'update', `Updated quotation ${updated.quotation_number}`)
    this.save()
    return updated
  }

  public recordPayment(
    quotationId: string,
    payment: { amount: number; payment_date: string; payment_method?: string; notes?: string }
  ): Quotation | null {
    const index = this.state.quotations.findIndex((q) => q.id === quotationId)
    if (index === -1) return null
    const q = this.state.quotations[index]

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      quotation_id: quotationId,
      amount: Number(payment.amount),
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || 'Bank Transfer',
      notes: payment.notes || null,
      created_at: new Date().toISOString(),
      created_by: this.state.currentUser?.full_name || 'System User',
    }

    const updatedPayments = [...(q.payments || []), newPayment]
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
    const newBalance = Math.max(0, q.amount - totalPaid)
    const newStatus = newBalance === 0 ? 'approved' : q.status

    const updated: Quotation = {
      ...q,
      advance_received: totalPaid,
      balance: newBalance,
      status: newStatus,
      payments: updatedPayments,
      updated_at: new Date().toISOString(),
    }

    this.state.quotations[index] = updated
    this.logActivity(
      'quotation',
      quotationId,
      'update',
      `Recorded payment of ${q.currency || 'INR'} ${payment.amount.toLocaleString()} for quotation ${q.quotation_number}`
    )
    this.save()
    return updated
  }

  public updatePaymentRecord(
    quotationId: string,
    paymentId: string,
    updates: { amount?: number; payment_date?: string; payment_method?: string; notes?: string }
  ): Quotation | null {
    const index = this.state.quotations.findIndex((q) => q.id === quotationId)
    if (index === -1) return null
    const q = this.state.quotations[index]

    const payments = (q.payments || []).map((p) => {
      if (p.id === paymentId) {
        return {
          ...p,
          ...updates,
          amount: updates.amount !== undefined ? Number(updates.amount) : p.amount,
        }
      }
      return p
    })

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const newBalance = Math.max(0, q.amount - totalPaid)

    const updated: Quotation = {
      ...q,
      payments,
      advance_received: totalPaid,
      balance: newBalance,
      status: newBalance === 0 ? 'approved' : q.status,
      updated_at: new Date().toISOString(),
    }

    this.state.quotations[index] = updated
    this.logActivity('quotation', quotationId, 'update', `Updated payment entry for quotation ${q.quotation_number}`)
    this.save()
    return updated
  }

  public deletePaymentRecord(quotationId: string, paymentId: string): Quotation | null {
    const index = this.state.quotations.findIndex((q) => q.id === quotationId)
    if (index === -1) return null
    const q = this.state.quotations[index]

    const payments = (q.payments || []).filter((p) => p.id !== paymentId)
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const newBalance = Math.max(0, q.amount - totalPaid)

    const updated: Quotation = {
      ...q,
      payments,
      advance_received: totalPaid,
      balance: newBalance,
      updated_at: new Date().toISOString(),
    }

    this.state.quotations[index] = updated
    this.logActivity('quotation', quotationId, 'update', `Deleted payment record from quotation ${q.quotation_number}`)
    this.save()
    return updated
  }

  // --- Project Actions ---
  public addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const newProject: Project = {
      ...project,
      id: `prj-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.state.projects.unshift(newProject)
    this.logActivity('project', newProject.id, 'create', `Created project ${newProject.name}`)
    this.save()
    return newProject
  }

  public updateProject(id: string, updates: Partial<Project>): Project | null {
    const index = this.state.projects.findIndex((p) => p.id === id)
    if (index === -1) return null
    const updated = {
      ...this.state.projects[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    this.state.projects[index] = updated
    this.logActivity('project', id, 'update', `Updated project ${updated.name}`)
    this.save()
    return updated
  }

  // --- Task Actions ---
  public addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: task.status === 'completed' ? new Date().toISOString() : null,
      is_archived: false,
    }
    this.state.tasks.unshift(newTask)
    this.logActivity('task', newTask.id, 'create', `Created task "${newTask.title}"`)
    this.save()
    return newTask
  }

  public updateTask(id: string, updates: Partial<Task>): Task | null {
    const index = this.state.tasks.findIndex((t) => t.id === id)
    if (index === -1) return null
    const oldTask = this.state.tasks[index]

    let completed_at = oldTask.completed_at
    if (updates.status === 'completed' && oldTask.status !== 'completed') {
      completed_at = new Date().toISOString()
    } else if (updates.status && updates.status !== 'completed' && oldTask.status === 'completed') {
      completed_at = null
    }

    const updated = {
      ...oldTask,
      ...updates,
      completed_at: updates.completed_at !== undefined ? updates.completed_at : completed_at,
      updated_at: new Date().toISOString(),
    }
    this.state.tasks[index] = updated

    if (updates.status && updates.status !== oldTask.status) {
      this.logActivity('task', id, 'status_change', `Moved task "${updated.title}" to ${updated.status}`)
    } else {
      this.logActivity('task', id, 'update', `Updated task "${updated.title}"`)
    }

    this.save()
    return updated
  }

  public archiveTask(id: string): Task | null {
    const index = this.state.tasks.findIndex((t) => t.id === id)
    if (index === -1) return null
    const task = this.state.tasks[index]
    const updated: Task = {
      ...task,
      is_archived: true,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.state.tasks[index] = updated
    this.logActivity('task', id, 'update', `Archived completed task "${task.title}"`)
    this.save()
    return updated
  }

  public unarchiveTask(id: string): Task | null {
    const index = this.state.tasks.findIndex((t) => t.id === id)
    if (index === -1) return null
    const task = this.state.tasks[index]
    const updated: Task = {
      ...task,
      is_archived: false,
      archived_at: null,
      updated_at: new Date().toISOString(),
    }
    this.state.tasks[index] = updated
    this.logActivity('task', id, 'restore', `Restored task "${task.title}" from archive`)
    this.save()
    return updated
  }

  public deleteTask(id: string) {
    const task = this.state.tasks.find((t) => t.id === id)
    if (task) {
      const now = new Date().toISOString()
      task.deleted_at = now
      task.updated_at = now
      this.logActivity('task', id, 'delete', `Deleted task "${task.title}"`)
      this.save()
    }
  }

  public autoArchiveCompletedTasks() {
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000 // 48 hours
    const now = Date.now()
    let changed = false

    this.state.tasks = this.state.tasks.map((t) => {
      if (t.status === 'completed' && !t.is_archived) {
        const referenceTimeStr = t.completed_at || t.updated_at || t.created_at
        const refTime = new Date(referenceTimeStr).getTime()
        if (now - refTime >= TWO_DAYS_MS) {
          changed = true
          return {
            ...t,
            is_archived: true,
            archived_at: new Date().toISOString(),
          }
        }
      }
      return t
    })

    if (changed) {
      this.save()
    }
  }

  // --- Content Planner Actions ---
  public addContentItem(item: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>): ContentItem {
    const newItem: ContentItem = {
      ...item,
      id: `cnt-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.state.contentItems.unshift(newItem)
    this.logActivity('content_item', newItem.id, 'create', `Scheduled content "${newItem.title}" for ${newItem.scheduled_date}`)
    this.save()
    return newItem
  }

  public updateContentItem(id: string, updates: Partial<ContentItem>): ContentItem | null {
    const index = this.state.contentItems.findIndex((c) => c.id === id)
    if (index === -1) return null
    const oldItem = this.state.contentItems[index]
    const updated = {
      ...oldItem,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    this.state.contentItems[index] = updated
    if (updates.status && updates.status !== oldItem.status) {
      this.logActivity('content_item', id, 'status_change', `Content "${updated.title}" status changed to ${updated.status}`)
    } else {
      this.logActivity('content_item', id, 'update', `Updated content item "${updated.title}"`)
    }
    this.save()
    return updated
  }

  public deleteContentItem(id: string) {
    const item = this.state.contentItems.find((c) => c.id === id)
    if (item) {
      const now = new Date().toISOString()
      item.deleted_at = now
      item.updated_at = now
      this.logActivity('content_item', id, 'delete', `Deleted content item "${item.title}"`)
      this.save()
    }
  }

  public addContentAnnotation(
    contentItemId: string,
    annotation: {
      author_name: string
      author_role: 'client' | 'agency'
      comment: string
      suggested_drive_url?: string | null
    }
  ) {
    const index = this.state.contentItems.findIndex((c) => c.id === contentItemId)
    if (index === -1) return null
    const item = this.state.contentItems[index]
    const newAnnotation = {
      id: `ann-${Date.now()}`,
      content_item_id: contentItemId,
      ...annotation,
      status: 'open' as const,
      created_at: new Date().toISOString(),
    }
    const updatedAnnotations = [...(item.annotations || []), newAnnotation]
    const updatedItem = {
      ...item,
      annotations: updatedAnnotations,
      updated_at: new Date().toISOString(),
    }
    this.state.contentItems[index] = updatedItem
    this.logActivity(
      'content_item',
      contentItemId,
      'comment',
      `${annotation.author_name} added feedback on "${item.title}": "${annotation.comment.slice(0, 50)}..."`
    )
    this.save()
    return updatedItem
  }

  public resolveContentAnnotation(contentItemId: string, annotationId: string) {
    const index = this.state.contentItems.findIndex((c) => c.id === contentItemId)
    if (index === -1) return null
    const item = this.state.contentItems[index]
    const updatedAnnotations = (item.annotations || []).map((ann) =>
      ann.id === annotationId ? { ...ann, status: 'resolved' as const } : ann
    )
    const updatedItem = {
      ...item,
      annotations: updatedAnnotations,
      updated_at: new Date().toISOString(),
    }
    this.state.contentItems[index] = updatedItem
    this.save()
    return updatedItem
  }

  public updateProjectShareSettings(
    projectId: string,
    shareToken: string | null,
    permissions?: { allow_approval: boolean; allow_comments: boolean; allow_rescheduling: boolean }
  ) {
    const index = this.state.projects.findIndex((p) => p.id === projectId)
    if (index === -1) return null
    const project = this.state.projects[index]
    const updated = {
      ...project,
      content_planner_share_token: shareToken,
      client_permissions: permissions || project.client_permissions || {
        allow_approval: true,
        allow_comments: true,
        allow_rescheduling: true,
      },
      updated_at: new Date().toISOString(),
    }
    this.state.projects[index] = updated
    this.logActivity('project', projectId, 'update', `Updated client share link settings for "${project.name}"`)
    this.save()
    return updated
  }

  // --- User Management Actions ---
  public addUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.state.users.push(newUser)
    this.logActivity('user', newUser.id, 'create', `Created user ${newUser.full_name} (${newUser.role})`)
    this.save()
    return newUser
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.state.users.findIndex((u) => u.id === id)
    if (index === -1) return null
    const updated = {
      ...this.state.users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    this.state.users[index] = updated
    if (this.state.currentUser?.id === id) {
      this.state.currentUser = updated
    }
    this.save()
    return updated
  }

  public deleteUser(id: string) {
    const user = this.state.users.find((u) => u.id === id)
    if (user) {
      const now = new Date().toISOString()
      user.deleted_at = now
      user.updated_at = now
      this.logActivity('user', id, 'delete', `Removed user ${user.full_name}`)
      this.save()
    }
  }

  public deleteProject(id: string) {
    const project = this.state.projects.find((p) => p.id === id)
    if (project) {
      const now = new Date().toISOString()
      project.deleted_at = now
      project.updated_at = now
      this.logActivity('project', id, 'delete', `Deleted project "${project.name}"`)
      this.save()
    }
  }

  public deleteQuotation(id: string) {
    const quotation = this.state.quotations.find((q) => q.id === id)
    if (quotation) {
      const now = new Date().toISOString()
      quotation.deleted_at = now
      quotation.updated_at = now
      this.logActivity('quotation', id, 'delete', `Deleted quotation ${quotation.quotation_number}`)
      this.save()
    }
  }

  // --- Reminder Actions ---
  public addReminder(reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Reminder {
    const newReminder: Reminder = {
      ...reminder,
      id: `rem-${Date.now()}`,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (!this.state.reminders) this.state.reminders = []
    this.state.reminders.unshift(newReminder)
    this.logActivity('reminder', newReminder.id, 'create', `Created reminder "${newReminder.title}" for ${newReminder.date}`)
    this.save()
    return newReminder
  }

  public updateReminder(id: string, updates: Partial<Reminder>): Reminder | null {
    if (!this.state.reminders) return null
    const index = this.state.reminders.findIndex((r) => r.id === id)
    if (index === -1) return null
    const updated = {
      ...this.state.reminders[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    this.state.reminders[index] = updated
    this.logActivity('reminder', id, 'update', `Updated reminder "${updated.title}"`)
    this.save()
    return updated
  }

  public toggleReminderCompletion(id: string): Reminder | null {
    if (!this.state.reminders) return null
    const index = this.state.reminders.findIndex((r) => r.id === id)
    if (index === -1) return null
    const rem = this.state.reminders[index]
    const updated = {
      ...rem,
      is_completed: !rem.is_completed,
      updated_at: new Date().toISOString(),
    }
    this.state.reminders[index] = updated
    this.save()
    return updated
  }

  public deleteReminder(id: string) {
    if (!this.state.reminders) return
    const rem = this.state.reminders.find((r) => r.id === id)
    if (rem) {
      const now = new Date().toISOString()
      rem.deleted_at = now
      rem.updated_at = now
      this.logActivity('reminder', id, 'delete', `Deleted reminder "${rem.title}"`)
      this.save()
    }
  }

  // --- Backup & Restore Actions ---
  public exportBackup(): string {
    return JSON.stringify(
      {
        version: '2.0',
        exported_at: new Date().toISOString(),
        exported_by: this.state.currentUser?.full_name || 'Owner',
        state: this.state,
      },
      null,
      2
    )
  }

  public importBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString)
      const stateToImport = parsed.state || parsed

      if (!stateToImport.users || !stateToImport.projects || !stateToImport.clients) {
        return { success: false, message: 'Invalid backup format. Missing core workspace entities.' }
      }

      this.state = {
        ...this.getInitialState(),
        ...stateToImport,
      }
      this.logActivity('user', 'backup', 'restore', 'Restored complete agency workspace data from JSON backup file')
      this.save()
      return { success: true, message: 'Agency data backup successfully restored!' }
    } catch (err: any) {
      return { success: false, message: `Failed to parse backup JSON file: ${err.message}` }
    }
  }

  public resetToDefaults() {
    this.state = this.getInitialState()
    this.save()
  }

  // --- Activity Log ---
  private logActivity(
    entity_type: ActivityLog['entity_type'],
    entity_id: string,
    action: ActivityLog['action'],
    details: string
  ) {
    const user = this.state.currentUser
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      entity_type,
      entity_id,
      action,
      details,
      user_id: user?.id || 'system',
      user_name: user?.full_name || 'System User',
      created_at: new Date().toISOString(),
    }
    this.state.activityLogs.unshift(log)
  }
}

export const agencyStore = new Store()
