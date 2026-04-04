<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  fetchTags,
  fetchTagsForEntity,
  linkTagToEntity,
  unlinkTagFromEntity,
} from '@/api/client'
import type { TagRow } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  modelValue: boolean
  entityType: 'lead' | 'company' | 'contact' | 'opportunity'
  entityId: number
  subtitle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  /** Emitido após associar ou remover uma tag (para atualizar listagens). */
  changed: []
}>()

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const linked = ref<TagRow[]>([])
const allTags = ref<TagRow[]>([])
const selectedTagId = ref<number | null>(null)

const availableToAdd = computed(() => {
  const linkedIds = new Set(linked.value.map((t) => t.id))
  return allTags.value.filter((t) => !t.is_archived && !linkedIds.has(t.id))
})

async function load() {
  if (!auth.token || props.entityId < 1) return
  loading.value = true
  error.value = null
  try {
    const [forEntity, catalog] = await Promise.all([
      fetchTagsForEntity(auth.token, props.entityType, props.entityId),
      fetchTags(auth.token, false),
    ])
    linked.value = forEntity
    allTags.value = catalog
    selectedTagId.value = null
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar tags.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) void load()
  },
)

watch(
  () => [props.entityId, props.entityType] as const,
  () => {
    if (props.modelValue) void load()
  },
)

function close() {
  emit('update:modelValue', false)
}

async function addSelected() {
  if (!auth.token || selectedTagId.value == null) return
  error.value = null
  try {
    await linkTagToEntity(auth.token, selectedTagId.value, props.entityType, props.entityId)
    selectedTagId.value = null
    await load()
    emit('changed')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao associar.'
  }
}

async function remove(tag: TagRow) {
  if (!auth.token) return
  error.value = null
  try {
    await unlinkTagFromEntity(auth.token, tag.id, props.entityType, props.entityId)
    await load()
    emit('changed')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao remover.'
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="text-h6"> Tags da entidade </v-card-title>
      <v-card-subtitle v-if="subtitle" class="text-wrap pb-2">
        {{ subtitle }}
      </v-card-subtitle>
      <v-divider />
      <v-card-text class="pt-4">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
          {{ error }}
        </v-alert>

        <v-skeleton-loader v-if="loading" type="list-item-two-line" />

        <template v-else>
          <p class="text-body-2 text-medium-emphasis mb-2">Associadas</p>
          <div v-if="linked.length === 0" class="text-body-2 text-medium-emphasis mb-4">Nenhuma tag.</div>
          <div v-else class="d-flex flex-wrap mb-6" style="gap: 8px">
            <v-chip
              v-for="t in linked"
              :key="t.id"
              closable
              variant="tonal"
              color="primary"
              @click:close="remove(t)"
            >
              <span class="d-inline-flex align-center">
                <span
                  v-if="t.color_hex"
                  class="me-1 rounded"
                  :style="{ width: '10px', height: '10px', backgroundColor: t.color_hex, display: 'inline-block' }"
                  aria-hidden="true"
                />
                {{ t.name }}
              </span>
            </v-chip>
          </div>

          <p class="text-body-2 text-medium-emphasis mb-2">Adicionar</p>
          <div class="d-flex flex-wrap align-center gap-2">
            <v-select
              v-model="selectedTagId"
              :items="availableToAdd"
              item-title="name"
              item-value="id"
              label="Tag"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              :disabled="availableToAdd.length === 0"
              style="min-width: 200px; flex: 1"
            />
            <v-btn
              color="primary"
              rounded="lg"
              :disabled="selectedTagId == null"
              @click="addSelected"
            >
              Associar
            </v-btn>
          </div>
          <p v-if="availableToAdd.length === 0 && !loading" class="text-caption text-medium-emphasis mt-2">
            Crie tags em «Tags» no menu se ainda não existirem.
          </p>
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Fechar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
