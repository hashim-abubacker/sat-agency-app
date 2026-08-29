export type UserRole = 'owner' | 'admin' | 'employee' | 'freelancer'
export type UserStatus = 'active' | 'inactive'

export type ClientStatus =
  | 'lead'
  | 'discussion'
  | 'proposal_sent'
  | 'won'
  | 'in_progress'
  | 'completed'
  | 'support'
  | 'inactive'

export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'won', label: 'Won' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'support', label: 'Support' },
  { value: 'inactive', label: 'Inactive' },
]

export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical'

export type ProjectStatus =
  | 'planning'
  | 'waiting'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed'

export type ContentPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'blog'
  | 'email'
  | 'custom'

export type ContentType =
  | 'post'
  | 'carousel'
  | 'story'
  | 'reel'
  | 'video'
  | 'short'
  | 'blog'
  | 'newsletter'
  | 'advertisement'
  | 'custom'

export type ContentStatus =
  | 'draft'
  | 'writing'
  | 'design'
  | 'review'
  | 'revision_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'cancelled'

export interface BaseAuditEntity {
  id: string
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  deleted_at?: string | null
}

export interface User extends BaseAuditEntity {
  full_name: string
  email: string
  role: UserRole
  status: UserStatus
  avatar_url?: string | null
}

export interface AgencySettings {
  agency_name: string
  default_currency: string
  drive_root_url: string
}

export interface Client extends BaseAuditEntity {
  company_name: string
  contact_name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  industry?: string | null
  status: ClientStatus
  notes?: string | null
  drive_url?: string | null
  currency?: string | null
  // Computed / Optional fields
  projects_count?: number
  quotations_total?: number
}

export interface PaymentRecord {
  id: string
  quotation_id: string
  amount: number
  payment_date: string
  payment_method?: string | null
  notes?: string | null
  created_at: string
  created_by?: string | null
}

export interface Quotation extends BaseAuditEntity {
  client_id: string
  quotation_number: string
  amount: number
  advance_received: number
  balance: number
  status: QuotationStatus
  remarks?: string | null
  drive_url?: string | null
  currency?: string | null
  payments?: PaymentRecord[]
  client?: Client
}

export interface ClientPermissions {
  allow_approval: boolean
  allow_comments: boolean
  allow_rescheduling: boolean
}

export interface Project extends BaseAuditEntity {
  client_id: string
  name: string
  description?: string | null
  priority: PriorityLevel
  status: ProjectStatus
  start_date?: string | null
  due_date?: string | null
  drive_url?: string | null
  enable_content_planner?: boolean
  content_planner_share_token?: string | null
  client_permissions?: ClientPermissions
  // Relations
  client?: Client
  members?: User[]
  tasks?: Task[]
  content_items?: ContentItem[]
  progress_percentage?: number
}

export interface ContentAnnotation {
  id: string
  content_item_id: string
  author_name: string
  author_role: 'client' | 'agency'
  comment: string
  suggested_drive_url?: string | null
  status: 'open' | 'resolved'
  created_at: string
}

export interface ContentItem extends BaseAuditEntity {
  project_id: string
  title: string
  platform: ContentPlatform
  content_type: ContentType
  scheduled_date: string
  scheduled_time?: string | null
  assigned_to?: string | null
  caption?: string | null
  drive_url?: string | null
  status: ContentStatus
  notes?: string | null
  annotations?: ContentAnnotation[]
  // Relations
  assignee?: User | null
  project?: Project | null
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role_in_project?: string | null
  user?: User
}

export interface Task extends BaseAuditEntity {
  project_id: string
  assigned_to?: string | null
  title: string
  description?: string | null
  priority: PriorityLevel
  status: TaskStatus
  due_date?: string | null
  order_index: number
  completed_at?: string | null
  is_archived?: boolean
  archived_at?: string | null
  // Relations
  assignee?: User | null
  project?: Project | null
  comments_count?: number
}

export interface Comment extends BaseAuditEntity {
  task_id: string
  user_id: string
  comment: string
  user?: User
}

export interface ActivityLog {
  id: string
  entity_type: 'client' | 'quotation' | 'project' | 'task' | 'user' | 'content_item' | 'reminder'
  entity_id: string
  action: 'create' | 'update' | 'delete' | 'restore' | 'status_change' | 'assignment_change' | 'comment'
  details: string
  user_id: string
  user_name?: string
  created_at: string
}

export type ReminderType = 'general' | 'call' | 'meeting' | 'followup' | 'deadline'

export interface Reminder extends BaseAuditEntity {
  title: string
  date: string // YYYY-MM-DD
  time?: string | null // e.g. "10:00 AM"
  type: ReminderType
  priority?: PriorityLevel
  assigned_to?: string | null
  notes?: string | null
  project_id?: string | null
  client_id?: string | null
  is_completed?: boolean
}
