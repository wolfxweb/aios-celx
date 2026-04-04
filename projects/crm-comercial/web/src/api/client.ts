import type {
  ActivityRow,
  ApiErrorBody,
  CompanyRow,
  ContactRow,
  DashboardSummary,
  LeadConvertPayload,
  LeadRow,
  LoginResponse,
  LossReasonRow,
  OpportunityRow,
  Paginated,
  PipelineRow,
  ReportCatalogItem,
  ReportRunResponse,
  SearchResponse,
  TagRow,
  TaskRow,
  UserListItem,
  UserPublic,
} from '@/api/types'

const apiBase = () => import.meta.env.VITE_API_BASE_URL ?? ''

function joinUrl(path: string): string {
  const base = apiBase().replace(/\/$/, '')
  return base ? `${base}${path}` : path
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(joinUrl('/api/v1/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = (await res.json()) as LoginResponse & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível entrar. Verifique os dados.'
    throw new Error(msg)
  }
  return data
}

export async function meRequest(token: string): Promise<UserPublic> {
  const res = await fetch(joinUrl('/api/v1/me'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as UserPublic & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Sessão inválida.'
    throw new Error(msg)
  }
  return data
}

export async function patchMe(
  token: string,
  body: Partial<{
    full_name: string
    phone: string | null
    theme_preference: string
    sidebar_collapsed_default: boolean
  }>,
): Promise<UserPublic> {
  const res = await fetch(joinUrl('/api/v1/me'), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as UserPublic & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível guardar o perfil.'
    throw new Error(msg)
  }
  return data
}

export async function fetchOpportunities(
  token: string,
  page = 1,
  pageSize = 25,
): Promise<Paginated<OpportunityRow>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  const res = await fetch(joinUrl(`/api/v1/opportunities?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as Paginated<OpportunityRow> & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar oportunidades.'
    throw new Error(msg)
  }
  return data
}

export async function fetchOpportunity(token: string, id: number): Promise<OpportunityRow> {
  const res = await fetch(joinUrl(`/api/v1/opportunities/${id}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as OpportunityRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar a oportunidade.'
    throw new Error(msg)
  }
  return data
}

export async function createOpportunity(
  token: string,
  body: {
    title: string
    pipeline_id: number
    stage_id: number
    company_id?: number | null
    contact_id?: number | null
    amount_cents?: number
    currency?: string
    probability?: number
    expected_close_date?: string | null
  },
): Promise<OpportunityRow> {
  const res = await fetch(joinUrl('/api/v1/opportunities'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: body.title,
      pipeline_id: body.pipeline_id,
      stage_id: body.stage_id,
      company_id: body.company_id ?? null,
      contact_id: body.contact_id ?? null,
      amount_cents: body.amount_cents ?? 0,
      currency: body.currency ?? 'BRL',
      probability: body.probability ?? 0,
      expected_close_date: body.expected_close_date ?? null,
    }),
  })
  const data = (await res.json()) as OpportunityRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível criar a oportunidade.'
    throw new Error(msg)
  }
  return data
}

export async function fetchLeads(
  token: string,
  page = 1,
  pageSize = 25,
): Promise<Paginated<LeadRow>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  const res = await fetch(joinUrl(`/api/v1/leads?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as Paginated<LeadRow> & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar leads.'
    throw new Error(msg)
  }
  return data
}

export async function fetchLead(token: string, id: number): Promise<LeadRow> {
  const res = await fetch(joinUrl(`/api/v1/leads/${id}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as LeadRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar o lead.'
    throw new Error(msg)
  }
  return data
}

export async function patchLead(
  token: string,
  id: number,
  body: Partial<{
    title: string
    email: string | null
    phone: string | null
    company_name: string | null
    source: string | null
    qualification_stage: 'novo' | 'contato' | 'qualificado' | 'perdido'
    score: number
  }>,
): Promise<LeadRow> {
  const res = await fetch(joinUrl(`/api/v1/leads/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as LeadRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível guardar o lead.'
    throw new Error(msg)
  }
  return data
}

export async function fetchPipelines(token: string): Promise<PipelineRow[]> {
  const res = await fetch(joinUrl('/api/v1/pipelines'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as PipelineRow[] & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar pipelines.'
    throw new Error(msg)
  }
  return data
}

export async function convertLead(
  token: string,
  leadId: number,
  body: LeadConvertPayload,
): Promise<LeadRow> {
  const res = await fetch(joinUrl(`/api/v1/leads/${leadId}/convert`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pipeline_id: body.pipeline_id,
      stage_id: body.stage_id,
      opportunity_title: body.opportunity_title ?? null,
      company_id: body.company_id ?? null,
      create_company_from_lead: body.create_company_from_lead ?? false,
      amount_cents: body.amount_cents ?? 0,
      currency: body.currency ?? 'BRL',
    }),
  })
  const data = (await res.json()) as LeadRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível converter o lead.'
    throw new Error(msg)
  }
  return data
}

export async function createLead(
  token: string,
  body: {
    title: string
    email?: string | null
    phone?: string | null
    company_name?: string | null
    source?: string | null
    qualification_stage?: 'novo' | 'contato' | 'qualificado' | 'perdido'
    score?: number
  },
): Promise<LeadRow> {
  const res = await fetch(joinUrl('/api/v1/leads'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as LeadRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível criar o lead.'
    throw new Error(msg)
  }
  return data
}

export async function createCompany(
  token: string,
  body: {
    name: string
    legal_name?: string | null
    tax_id?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
  },
): Promise<CompanyRow> {
  const res = await fetch(joinUrl('/api/v1/companies'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as CompanyRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível criar a empresa.'
    throw new Error(msg)
  }
  return data
}

export async function createContact(
  token: string,
  body: {
    first_name: string
    last_name?: string | null
    email?: string | null
    phone?: string | null
    company_id?: number | null
  },
): Promise<ContactRow> {
  const res = await fetch(joinUrl('/api/v1/contacts'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as ContactRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível criar o contato.'
    throw new Error(msg)
  }
  return data
}

export async function markOpportunityWon(token: string, opportunityId: number): Promise<OpportunityRow> {
  const res = await fetch(joinUrl(`/api/v1/opportunities/${opportunityId}/mark-won`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as OpportunityRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível marcar como ganho.'
    throw new Error(msg)
  }
  return data
}

export async function markOpportunityLost(
  token: string,
  opportunityId: number,
  lossReasonId: number | null = null,
): Promise<OpportunityRow> {
  const res = await fetch(joinUrl(`/api/v1/opportunities/${opportunityId}/mark-lost`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ loss_reason_id: lossReasonId }),
  })
  const data = (await res.json()) as OpportunityRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível marcar como perda.'
    throw new Error(msg)
  }
  return data
}

export async function fetchLossReasons(
  token: string,
  pipelineId?: number,
): Promise<LossReasonRow[]> {
  const params = new URLSearchParams()
  if (pipelineId != null) {
    params.set('pipeline_id', String(pipelineId))
  }
  const qs = params.toString()
  const path = qs ? `/api/v1/loss-reasons?${qs}` : '/api/v1/loss-reasons'
  const res = await fetch(joinUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as LossReasonRow[] & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar motivos de perda.'
    throw new Error(msg)
  }
  return data
}

export async function createTask(
  token: string,
  body: {
    title: string
    description?: string | null
    priority?: 'low' | 'normal' | 'high'
    due_at?: string | null
    entity_type?: 'company' | 'contact' | 'opportunity' | 'lead' | null
    entity_id?: number | null
  },
): Promise<TaskRow> {
  const payload: Record<string, unknown> = {
    title: body.title,
    priority: body.priority ?? 'normal',
  }
  if (body.description != null) payload.description = body.description
  if (body.due_at != null && body.due_at !== '') payload.due_at = body.due_at
  if (body.entity_type != null && body.entity_id != null) {
    payload.entity_type = body.entity_type
    payload.entity_id = body.entity_id
  }
  const res = await fetch(joinUrl('/api/v1/tasks'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = (await res.json()) as TaskRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível criar a tarefa.'
    throw new Error(msg)
  }
  return data
}

export async function completeTask(token: string, taskId: number): Promise<TaskRow> {
  const res = await fetch(joinUrl(`/api/v1/tasks/${taskId}/complete`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as TaskRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível concluir a tarefa.'
    throw new Error(msg)
  }
  return data
}

export async function fetchCompanies(
  token: string,
  page = 1,
  pageSize = 25,
): Promise<Paginated<CompanyRow>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  const res = await fetch(joinUrl(`/api/v1/companies?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as Paginated<CompanyRow> & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar empresas.'
    throw new Error(msg)
  }
  return data
}

export async function fetchCompany(token: string, id: number): Promise<CompanyRow> {
  const res = await fetch(joinUrl(`/api/v1/companies/${id}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as CompanyRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar a empresa.'
    throw new Error(msg)
  }
  return data
}

export async function patchCompany(
  token: string,
  id: number,
  body: Partial<{
    name: string
    legal_name: string | null
    tax_id: string | null
    phone: string | null
    email: string | null
    website: string | null
  }>,
): Promise<CompanyRow> {
  const res = await fetch(joinUrl(`/api/v1/companies/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as CompanyRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível guardar a empresa.'
    throw new Error(msg)
  }
  return data
}

export async function fetchContacts(
  token: string,
  page = 1,
  pageSize = 25,
): Promise<Paginated<ContactRow>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  const res = await fetch(joinUrl(`/api/v1/contacts?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as Paginated<ContactRow> & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar contatos.'
    throw new Error(msg)
  }
  return data
}

export async function fetchContact(token: string, id: number): Promise<ContactRow> {
  const res = await fetch(joinUrl(`/api/v1/contacts/${id}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as ContactRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar o contato.'
    throw new Error(msg)
  }
  return data
}

export async function patchContact(
  token: string,
  id: number,
  body: Partial<{
    first_name: string
    last_name: string | null
    email: string | null
    phone: string | null
    company_id: number | null
  }>,
): Promise<ContactRow> {
  const res = await fetch(joinUrl(`/api/v1/contacts/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as ContactRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível guardar o contato.'
    throw new Error(msg)
  }
  return data
}

export async function patchOpportunity(
  token: string,
  id: number,
  body: Partial<{
    title: string
    company_id: number | null
    contact_id: number | null
    amount_cents: number
    currency: string
    probability: number
    expected_close_date: string | null
  }>,
): Promise<OpportunityRow> {
  const res = await fetch(joinUrl(`/api/v1/opportunities/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as OpportunityRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível guardar a oportunidade.'
    throw new Error(msg)
  }
  return data
}

/** Move a oportunidade para outra etapa do mesmo pipeline (etapas «open» na UI). */
export async function patchOpportunityStage(
  token: string,
  id: number,
  body: { stage_id: number },
): Promise<OpportunityRow> {
  const res = await fetch(joinUrl(`/api/v1/opportunities/${id}/stage`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as OpportunityRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível alterar a etapa.'
    throw new Error(msg)
  }
  return data
}

export async function fetchActivities(
  token: string,
  page = 1,
  pageSize = 50,
): Promise<Paginated<ActivityRow>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  const res = await fetch(joinUrl(`/api/v1/activities?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as Paginated<ActivityRow> & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar atividades.'
    throw new Error(msg)
  }
  return data
}

export async function createActivity(
  token: string,
  body: {
    activity_type: 'call' | 'meeting' | 'email' | 'note' | 'other'
    title: string
    notes?: string | null
    occurred_at?: string | null
    outcome?: string | null
    entity_type?: 'company' | 'contact' | 'opportunity' | 'lead' | null
    entity_id?: number | null
  },
): Promise<ActivityRow> {
  const payload: Record<string, unknown> = {
    activity_type: body.activity_type,
    title: body.title,
  }
  if (body.notes != null && body.notes !== '') payload.notes = body.notes
  if (body.occurred_at) payload.occurred_at = body.occurred_at
  if (body.outcome != null && body.outcome !== '') payload.outcome = body.outcome
  if (body.entity_type != null && body.entity_id != null) {
    payload.entity_type = body.entity_type
    payload.entity_id = body.entity_id
  }
  const res = await fetch(joinUrl('/api/v1/activities'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = (await res.json()) as ActivityRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível criar a atividade.'
    throw new Error(msg)
  }
  return data
}

export async function fetchTasks(
  token: string,
  page = 1,
  pageSize = 25,
): Promise<Paginated<TaskRow>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  const res = await fetch(joinUrl(`/api/v1/tasks?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as Paginated<TaskRow> & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar tarefas.'
    throw new Error(msg)
  }
  return data
}

export async function fetchSearch(token: string, q: string, types?: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: q.trim() })
  if (types?.trim()) {
    params.set('types', types.trim())
  }
  const res = await fetch(joinUrl(`/api/v1/search?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as SearchResponse & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Pesquisa indisponível.'
    throw new Error(msg)
  }
  return data
}

export async function fetchDashboardSummary(
  token: string,
  days = 30,
): Promise<DashboardSummary> {
  const params = new URLSearchParams({ days: String(days) })
  const res = await fetch(joinUrl(`/api/v1/dashboard/summary?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as DashboardSummary & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar o painel.'
    throw new Error(msg)
  }
  return data
}

export async function fetchReportsCatalog(token: string): Promise<ReportCatalogItem[]> {
  const res = await fetch(joinUrl('/api/v1/reports'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as ReportCatalogItem[] & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar relatórios.'
    throw new Error(msg)
  }
  return data
}

export async function runReport(
  token: string,
  reportId: string,
  body: {
    date_from?: string | null
    date_to?: string | null
    pipeline_id?: number | null
  } = {},
): Promise<ReportRunResponse> {
  const res = await fetch(
    joinUrl(`/api/v1/reports/${encodeURIComponent(reportId)}/run`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  const data = (await res.json()) as ReportRunResponse & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível executar o relatório.'
    throw new Error(msg)
  }
  return data
}

export async function fetchTags(
  token: string,
  includeArchived = false,
): Promise<TagRow[]> {
  const params = new URLSearchParams()
  if (includeArchived) {
    params.set('include_archived', 'true')
  }
  const qs = params.toString()
  const path = qs ? `/api/v1/tags?${qs}` : '/api/v1/tags'
  const res = await fetch(joinUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as TagRow[] & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar tags.'
    throw new Error(msg)
  }
  return data
}

export async function createTag(
  token: string,
  body: { name: string; color_hex?: string | null },
): Promise<TagRow> {
  const res = await fetch(joinUrl('/api/v1/tags'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as TagRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível criar a tag.'
    throw new Error(msg)
  }
  return data
}

export async function patchTag(
  token: string,
  tagId: number,
  body: Partial<{ name: string; color_hex: string | null; is_archived: boolean }>,
): Promise<TagRow> {
  const res = await fetch(joinUrl(`/api/v1/tags/${tagId}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as TagRow & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível atualizar a tag.'
    throw new Error(msg)
  }
  return data
}

export async function fetchTagsForEntity(
  token: string,
  entityType: 'lead' | 'company' | 'contact' | 'opportunity',
  entityId: number,
): Promise<TagRow[]> {
  const path = `/api/v1/tags/by-entity/${encodeURIComponent(entityType)}/${entityId}`
  const res = await fetch(joinUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as TagRow[] & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar tags da entidade.'
    throw new Error(msg)
  }
  return data
}

export async function linkTagToEntity(
  token: string,
  tagId: number,
  entityType: string,
  entityId: number,
): Promise<void> {
  const res = await fetch(joinUrl(`/api/v1/tags/${tagId}/link`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
  })
  if (res.ok) return
  let msg = 'Não foi possível associar a tag.'
  try {
    const data = (await res.json()) as ApiErrorBody
    msg = data.error?.message ?? msg
  } catch {
    /* corpo vazio */
  }
  throw new Error(msg)
}

export async function unlinkTagFromEntity(
  token: string,
  tagId: number,
  entityType: string,
  entityId: number,
): Promise<void> {
  const params = new URLSearchParams({
    entity_type: entityType,
    entity_id: String(entityId),
  })
  const res = await fetch(joinUrl(`/api/v1/tags/${tagId}/link?${params}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.ok) return
  let msg = 'Não foi possível remover a tag.'
  try {
    const data = (await res.json()) as ApiErrorBody
    msg = data.error?.message ?? msg
  } catch {
    /* corpo vazio */
  }
  throw new Error(msg)
}

export async function fetchUsersAdmin(
  token: string,
  page = 1,
  pageSize = 50,
): Promise<Paginated<UserListItem>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  const res = await fetch(joinUrl(`/api/v1/users?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await res.json()) as Paginated<UserListItem> & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível carregar utilizadores.'
    throw new Error(msg)
  }
  return data
}

export async function submitPublicContact(body: {
  name: string
  email: string
  message: string
  consent: boolean
  company?: string | null
  phone?: string | null
}): Promise<{ ok: boolean }> {
  const res = await fetch(joinUrl('/api/v1/public/contact'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { ok?: boolean } & ApiErrorBody
  if (!res.ok) {
    const msg = data.error?.message ?? 'Não foi possível enviar o pedido.'
    throw new Error(msg)
  }
  return { ok: Boolean(data.ok) }
}
