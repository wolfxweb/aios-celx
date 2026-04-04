export function searchHitIcon(type: string): string {
  switch (type) {
    case 'lead':
      return 'mdi-account-arrow-right-outline'
    case 'company':
      return 'mdi-office-building-outline'
    case 'contact':
      return 'mdi-account-outline'
    case 'opportunity':
      return 'mdi-briefcase-outline'
    default:
      return 'mdi-magnify'
  }
}

export function searchHitLabel(type: string): string {
  switch (type) {
    case 'lead':
      return 'Lead'
    case 'company':
      return 'Empresa'
    case 'contact':
      return 'Contato'
    case 'opportunity':
      return 'Oportunidade'
    default:
      return type
  }
}
