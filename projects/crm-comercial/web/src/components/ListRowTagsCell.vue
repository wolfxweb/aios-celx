<script setup lang="ts">
import type { TagRow } from '@/api/types'

defineProps<{
  tags: TagRow[] | undefined
}>()

const emit = defineEmits<{ manage: [] }>()
</script>

<template>
  <div class="d-flex align-center gap-1 flex-wrap py-1" style="min-height: 36px">
    <template v-if="tags && tags.length">
      <v-chip
        v-for="t in tags.slice(0, 3)"
        :key="t.id"
        size="x-small"
        variant="tonal"
        color="primary"
        class="text-truncate"
        style="max-width: 140px"
      >
        <span class="d-inline-flex align-center text-truncate">
          <span
            v-if="t.color_hex"
            class="me-1 rounded flex-shrink-0"
            :style="{ width: '8px', height: '8px', backgroundColor: t.color_hex }"
            aria-hidden="true"
          />
          {{ t.name }}
        </span>
      </v-chip>
      <span v-if="tags.length > 3" class="text-caption text-medium-emphasis"> +{{ tags.length - 3 }} </span>
    </template>
    <v-btn
      icon
      variant="text"
      size="small"
      aria-label="Gerir tags"
      class="ms-auto flex-shrink-0"
      @click.stop="emit('manage')"
    >
      <v-icon size="small">mdi-tag-outline</v-icon>
    </v-btn>
  </div>
</template>
