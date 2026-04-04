<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { createActivity, fetchActivities } from '@/api/client'
import type { ActivityRow } from '@/api/types'
import { crmEntityDetailRoute, crmEntityTypeLabel } from '@/composables/useCrmEntityLink'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const error = ref<string | null>(null)
const rows = ref<ActivityRow[]>([])
const totalItems = ref(0)

const createOpen = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const formType = ref<'call' | 'meeting' | 'email' | 'note' | 'other'>('call')
const formTitle = ref('')
const formNotes = ref('')
const formOccurred = ref('')
const formOutcome = ref('')
const formEntityType = ref<'lead' | 'company' | 'contact' | 'opportunity' | ''>('')
const formEntityId = ref('')

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    call: 'Chamada',
    meeting: 'Reunião',
    email: 'E-mail',
    note: 'Nota',
    other: 'Outro',
  }
  return map[t] ?? t
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR')
  } catch {
    return iso
  }
}

function notesPreview(n: string | null): string {
  if (!n) return '—'
  return n.length > 48 ? `${n.slice(0, 48)}…` : n
}

async function loadRows() {
  if (!auth.token) {
    error.value = 'Sessão em falta.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await fetchActivities(auth.token, 1, 50)
    rows.value = res.data
    totalItems.value = res.meta.totalItems
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createError.value = null
  formType.value = 'call'
  formTitle.value = ''
  formNotes.value = ''
  formOccurred.value = ''
  formOutcome.value = ''
  formEntityType.value = ''
  formEntityId.value = ''
  createOpen.value = true
}

async function submitCreate() {
  if (!auth.token || !formTitle.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    const body: Parameters<typeof createActivity>[1] = {
      activity_type: formType.value,
      title: formTitle.value.trim(),
      notes: formNotes.value.trim() || null,
      outcome: formOutcome.value.trim() || null,
    }
    if (formOccurred.value) {
      const d = new Date(formOccurred.value)
      if (!Number.isNaN(d.getTime())) {
        body.occurred_at = d.toISOString()
      }
    }
    if (formEntityType.value && formEntityId.value.trim()) {
      const eid = Number(formEntityId.value.trim())
      if (Number.isFinite(eid) && eid >= 1) {
        body.entity_type = formEntityType.value
        body.entity_id = eid
      }
    }
    await createActivity(auth.token, body)
    createOpen.value = false
    await loadRows()
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Erro ao criar.'
  } finally {
    creating.value = false
  }
}

onMounted(() => void loadRows())
</script>

<template>
  <v-container class="py-6" fluid>
    <div class="d-flex align-center mb-4 flex-wrap gap-2">
      <h1 class="text-h5">Atividades</h1>
      <v-spacer />
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate"> Nova atividade </v-btn>
      <span class="text-body-2 text-medium-emphasis">Total: {{ totalItems }}</span>
    </div>

    <v-dialog v-model="createOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Nova atividade</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="createError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ createError }}
          </v-alert>
          <v-select
            v-model="formType"
            :items="[
              { title: 'Chamada', value: 'call' },
              { title: 'Reunião', value: 'meeting' },
              { title: 'E-mail', value: 'email' },
              { title: 'Nota', value: 'note' },
              { title: 'Outro', value: 'other' },
            ]"
            item-title="title"
            item-value="value"
            label="Tipo"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field v-model="formTitle" label="Título *" variant="outlined" density="comfortable" class="mb-3" />
          <v-textarea v-model="formNotes" label="Notas" variant="outlined" density="comfortable" rows="3" class="mb-3" />
          <v-text-field
            v-model="formOccurred"
            label="Data/hora (opcional, omissão = agora)"
            type="datetime-local"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details
          />
          <v-text-field v-model="formOutcome" label="Resultado" variant="outlined" density="comfortable" class="mb-3" />
          <p class="text-caption text-medium-emphasis mb-1">Vínculo (opcional)</p>
          <div class="d-flex flex-wrap gap-2">
            <v-select
              v-model="formEntityType"
              :items="[
                { title: 'Nenhum', value: '' },
                { title: 'Lead', value: 'lead' },
                { title: 'Empresa', value: 'company' },
                { title: 'Contato', value: 'contact' },
                { title: 'Oportunidade', value: 'opportunity' },
              ]"
              item-title="title"
              item-value="value"
              label="Tipo"
              variant="outlined"
              density="comfortable"
              style="min-width: 160px; flex: 1"
            />
            <v-text-field
              v-model="formEntityId"
              label="ID da entidade"
              type="number"
              variant="outlined"
              density="comfortable"
              :disabled="!formEntityType"
              style="min-width: 120px; flex: 1"
              hide-details
            />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createOpen = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="lg" :loading="creating" :disabled="!formTitle.trim()" @click="submitCreate">
            Registar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading" type="table" />

    <v-data-table
      v-else
      :items="rows"
      :headers="[
        { title: 'Quando', key: 'occurred_at' },
        { title: 'Tipo', key: 'activity_type' },
        { title: 'Título', key: 'title' },
        { title: 'Notas', key: 'notes', sortable: false },
        { title: 'Entidade', key: 'entity_type' },
        { title: 'Resultado', key: 'outcome' },
      ]"
      class="elevation-1 rounded-lg"
    >
      <template #item.occurred_at="{ item }">
        {{ formatWhen(item.occurred_at) }}
      </template>
      <template #item.activity_type="{ item }">
        {{ typeLabel(item.activity_type) }}
      </template>
      <template #item.notes="{ item }">
        <span class="text-body-2">{{ notesPreview(item.notes) }}</span>
      </template>
      <template #item.entity_type="{ item }">
        <RouterLink
          v-if="item.entity_type && item.entity_id != null && crmEntityDetailRoute(item.entity_type, item.entity_id)"
          class="text-primary text-decoration-none text-body-2"
          :to="crmEntityDetailRoute(item.entity_type, item.entity_id)!"
        >
          {{ crmEntityTypeLabel(item.entity_type) }} #{{ item.entity_id }}
        </RouterLink>
        <span v-else-if="item.entity_type && item.entity_id != null" class="text-caption">
          {{ item.entity_type }} #{{ item.entity_id }}
        </span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>
      <template #item.outcome="{ item }">
        {{ item.outcome ?? '—' }}
      </template>
    </v-data-table>
  </v-container>
</template>
