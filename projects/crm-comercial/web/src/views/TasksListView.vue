<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { completeTask, createTask, fetchTasks } from '@/api/client'
import type { TaskRow } from '@/api/types'
import { crmEntityDetailRoute, crmEntityTypeLabel } from '@/composables/useCrmEntityLink'
import { useAuthStore } from '@/stores/auth'
import { taskStatusLabel } from '@/utils/crmLabels'

const auth = useAuthStore()
const loading = ref(true)
const error = ref<string | null>(null)
const rows = ref<TaskRow[]>([])
const totalItems = ref(0)

const createOpen = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const formTitle = ref('')
const formDescription = ref('')
const formPriority = ref<'low' | 'normal' | 'high'>('normal')
const formDue = ref('')
const formEntityType = ref<'lead' | 'company' | 'contact' | 'opportunity' | ''>('')
const formEntityId = ref<string>('')

const completingId = ref<number | null>(null)

function priorityLabel(p: string): string {
  const m: Record<string, string> = { low: 'Baixa', normal: 'Normal', high: 'Alta' }
  return m[p] ?? p
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
    const res = await fetchTasks(auth.token, 1, 50)
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
  formTitle.value = ''
  formDescription.value = ''
  formPriority.value = 'normal'
  formDue.value = ''
  formEntityType.value = ''
  formEntityId.value = ''
  createOpen.value = true
}

async function submitCreate() {
  if (!auth.token || !formTitle.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    const body: Parameters<typeof createTask>[1] = {
      title: formTitle.value.trim(),
      description: formDescription.value.trim() || null,
      priority: formPriority.value,
    }
    if (formDue.value) {
      const d = new Date(formDue.value)
      if (!Number.isNaN(d.getTime())) {
        body.due_at = d.toISOString()
      }
    }
    if (formEntityType.value && formEntityId.value.trim()) {
      const eid = Number(formEntityId.value.trim())
      if (Number.isFinite(eid) && eid >= 1) {
        body.entity_type = formEntityType.value
        body.entity_id = eid
      }
    }
    await createTask(auth.token, body)
    createOpen.value = false
    await loadRows()
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Erro ao criar.'
  } finally {
    creating.value = false
  }
}

async function completeRow(task: TaskRow) {
  if (!auth.token || task.status !== 'pending') return
  completingId.value = task.id
  try {
    await completeTask(auth.token, task.id)
    await loadRows()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao concluir.'
  } finally {
    completingId.value = null
  }
}

onMounted(() => void loadRows())
</script>

<template>
  <v-container class="py-6" fluid>
    <div class="d-flex align-center mb-4 flex-wrap gap-2">
      <h1 class="text-h5">Tarefas</h1>
      <v-spacer />
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate"> Nova tarefa </v-btn>
      <span class="text-body-2 text-medium-emphasis">Total: {{ totalItems }}</span>
    </div>

    <v-dialog v-model="createOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Nova tarefa</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="createError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ createError }}
          </v-alert>
          <v-text-field v-model="formTitle" label="Título *" variant="outlined" density="comfortable" class="mb-3" />
          <v-textarea v-model="formDescription" label="Descrição" variant="outlined" density="comfortable" rows="2" class="mb-3" />
          <v-select
            v-model="formPriority"
            :items="[
              { title: 'Baixa', value: 'low' },
              { title: 'Normal', value: 'normal' },
              { title: 'Alta', value: 'high' },
            ]"
            item-title="title"
            item-value="value"
            label="Prioridade"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="formDue"
            label="Vencimento"
            type="datetime-local"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details
          />
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
            Criar
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
        { title: 'Título', key: 'title' },
        { title: 'Prioridade', key: 'priority' },
        { title: 'Estado', key: 'status' },
        { title: 'Vencimento', key: 'due_at' },
        { title: 'Entidade', key: 'entity', sortable: false },
        { title: '', key: 'actions', sortable: false, width: '120px' },
      ]"
      class="elevation-1 rounded-lg"
    >
      <template #item.priority="{ item }">
        {{ priorityLabel(item.priority) }}
      </template>
      <template #item.status="{ item }">
        {{ taskStatusLabel(item.status) }}
      </template>
      <template #item.entity="{ item }">
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
      <template #item.due_at="{ item }">
        {{ item.due_at ? new Date(item.due_at).toLocaleString('pt-BR') : '—' }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="item.status === 'pending'"
          size="small"
          color="success"
          variant="tonal"
          rounded="lg"
          :loading="completingId === item.id"
          @click="completeRow(item)"
        >
          Concluir
        </v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>
