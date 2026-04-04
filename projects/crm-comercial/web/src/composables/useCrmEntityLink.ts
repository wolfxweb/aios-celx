import type { RouteLocationRaw } from 'vue-router'

const ENTITY_LABELS: Record<string, string> = {
  lead: 'Lead',
  company: 'Empresa',
  contact: 'Contato',
  opportunity: 'Oportunidade',
}

const ROUTE_NAME_BY_ENTITY: Record<string, string> = {
  lead: 'lead-detail',
  company: 'company-detail',
  contact: 'contact-detail',
  opportunity: 'opportunity-detail',
}

/** Rótulo curto em pt-BR para `entity_type` da API (lead, company, …). */
export function crmEntityTypeLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType
}

/** Rota para a ficha de detalhe, ou `null` se o tipo não tiver rota. */
export function crmEntityDetailRoute(
  entityType: string | null | undefined,
  entityId: number | null | undefined,
): RouteLocationRaw | null {
  if (entityType == null || entityId == null) return null
  const name = ROUTE_NAME_BY_ENTITY[entityType]
  if (!name) return null
  return { name, params: { id: String(entityId) } }
}
