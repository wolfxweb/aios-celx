/** Etapa de qualificação do lead (valores da API). */
export function leadQualificationStageLabel(stage: string): string {
  const m: Record<string, string> = {
    novo: 'Novo',
    contato: 'Contato',
    qualificado: 'Qualificado',
    perdido: 'Perdido',
  }
  return m[stage] ?? stage
}

/** Estado do lead (open, converted, lost, …). */
export function leadStatusLabel(status: string): string {
  const m: Record<string, string> = {
    open: 'Aberto',
    converted: 'Convertido',
    lost: 'Perdido',
  }
  return m[status] ?? status
}

/** Estado da tarefa (pending, completed, cancelled). */
export function taskStatusLabel(status: string): string {
  const m: Record<string, string> = {
    pending: 'Pendente',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  }
  return m[status] ?? status
}
