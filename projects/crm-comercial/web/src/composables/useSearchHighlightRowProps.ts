import { useRoute } from 'vue-router'

/** Destaca a linha cujo `id` coincide com `?highlight=` (vinda da busca global). */
export function useSearchHighlightRowProps<T extends { id: number }>() {
  const route = useRoute()

  function highlightRowProps({ item }: { item: T }) {
    const h = route.query.highlight
    if (h != null && String(item.id) === String(h)) {
      return { class: 'search-highlight-row' }
    }
    return {}
  }

  return { highlightRowProps }
}
