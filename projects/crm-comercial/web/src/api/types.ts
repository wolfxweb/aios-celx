export interface UserPublic {
  id: number
  email: string
  full_name: string
  phone: string | null
  is_active: boolean
  is_admin: boolean
  theme_preference: string
  sidebar_collapsed_default: boolean
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserPublic
}

export interface ApiErrorBody {
  error?: {
    code: string
    message: string
    details?: unknown[]
  }
}

export interface DashboardSummary {
  period: { from: string; to: string }
  open_leads: number
  open_opportunities: number
  pending_tasks: number
  activities_in_period: number
  companies: number
  contacts: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface SearchHit {
  type: string
  id: number
  title: string
  subtitle: string | null
}

export interface SearchResponse {
  hits: SearchHit[]
  query: string
}

export interface StageRow {
  id: number
  pipeline_id: number
  name: string
  sort_order: number
  stage_type: string
}

export interface PipelineRow {
  id: number
  name: string
  is_default: boolean
  created_at: string
  stages: StageRow[]
}

export interface LeadConvertPayload {
  pipeline_id: number
  stage_id: number
  opportunity_title?: string | null
  company_id?: number | null
  create_company_from_lead?: boolean
  amount_cents?: number
  currency?: string
}

export interface LossReasonRow {
  id: number
  pipeline_id: number | null
  name: string
  sort_order: number
  is_active: boolean
}

export interface TagRow {
  id: number
  name: string
  color_hex: string | null
  owner_user_id: number
  is_archived: boolean
  created_at: string
}

export interface CompanyRow {
  id: number
  name: string
  legal_name: string | null
  tax_id: string | null
  phone: string | null
  email: string | null
  website: string | null
  owner_user_id: number
  created_at: string
  updated_at: string
  tags?: TagRow[]
}

export interface ContactRow {
  id: number
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  company_id: number | null
  owner_user_id: number
  created_at: string
  updated_at: string
  tags?: TagRow[]
}

export interface LeadRow {
  id: number
  title: string
  email: string | null
  phone: string | null
  company_name: string | null
  source: string | null
  qualification_stage: string
  status: string
  score: number
  owner_user_id: number
  converted_opportunity_id: number | null
  created_at: string
  updated_at: string
  tags?: TagRow[]
}

export interface ActivityRow {
  id: number
  activity_type: string
  title: string
  notes: string | null
  occurred_at: string
  outcome: string | null
  owner_user_id: number
  entity_type: string | null
  entity_id: number | null
  created_at: string
  updated_at: string
}

export interface TaskRow {
  id: number
  title: string
  description: string | null
  status: string
  priority: string
  due_at: string | null
  completed_at: string | null
  owner_user_id: number
  entity_type: string | null
  entity_id: number | null
  created_at: string
  updated_at: string
}

export interface ReportCatalogItem {
  id: string
  title: string
  description: string
}

export interface ReportRunResponse {
  report_id: string
  columns: string[]
  rows: unknown[][]
  meta: Record<string, unknown>
}

export interface UserListItem {
  id: number
  email: string
  full_name: string
  is_active: boolean
  is_admin: boolean
}

export interface OpportunityRow {
  id: number
  title: string
  company_id: number | null
  contact_id: number | null
  pipeline_id: number
  stage_id: number
  amount_cents: number
  currency: string
  probability: number
  expected_close_date: string | null
  owner_user_id: number
  loss_reason_id: number | null
  created_at: string
  updated_at: string
  tags?: TagRow[]
}
