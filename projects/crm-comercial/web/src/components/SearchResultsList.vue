<script setup lang="ts">
import type { SearchHit } from '@/api/types'
import { searchHitIcon, searchHitLabel } from '@/utils/searchDisplay'

defineProps<{
  loading: boolean
  error: string | null
  hits: SearchHit[]
  hasQuery: boolean
}>()

const emit = defineEmits<{
  select: [hit: SearchHit]
}>()
</script>

<template>
  <v-list v-if="loading" density="compact" class="py-2">
    <v-list-item title="A pesquisar…" />
  </v-list>
  <v-list v-else-if="error" density="compact" class="py-2">
    <v-list-item :title="error" />
  </v-list>
  <v-list v-else-if="!hasQuery" density="compact" class="py-2">
    <v-list-item title="Escreva um termo" subtitle="Mínimo 1 carácter" />
  </v-list>
  <v-list v-else-if="hits.length === 0" density="compact" class="py-2">
    <v-list-item title="Sem resultados" subtitle="Tente outro termo" />
  </v-list>
  <v-list v-else density="compact" class="py-1">
    <v-list-item
      v-for="h in hits"
      :key="`${h.type}-${h.id}`"
      class="search-hit-item"
      @click="emit('select', h)"
    >
      <template #prepend>
        <v-icon size="small" class="me-1">{{ searchHitIcon(h.type) }}</v-icon>
      </template>
      <v-list-item-title>{{ h.title }}</v-list-item-title>
      <v-list-item-subtitle>
        {{ searchHitLabel(h.type) }}
        <template v-if="h.subtitle"> · {{ h.subtitle }}</template>
      </v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<style scoped>
.search-hit-item {
  cursor: pointer;
}
</style>
