import { ref } from 'vue'

/** Estado partilhado para `EntityTagsDialog` nas listagens CRM (ícone na coluna Tags). */
export function useEntityTagsDialog() {
  const tagsDialog = ref(false)
  const tagEntityId = ref(0)
  const tagSubtitle = ref('')

  function openEntityTags(entityId: number, subtitle: string) {
    tagEntityId.value = entityId
    tagSubtitle.value = subtitle
    tagsDialog.value = true
  }

  return { tagsDialog, tagEntityId, tagSubtitle, openEntityTags }
}
