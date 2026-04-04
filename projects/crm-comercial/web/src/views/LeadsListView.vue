<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import EntityTagsDialog from '@/components/EntityTagsDialog.vue'
import ListRowTagsCell from '@/components/ListRowTagsCell.vue'
import { createLead, fetchLeads } from '@/api/client'
import type { LeadRow } from '@/api/types'
import { useEntityTagsDialog } from '@/composables/useEntityTagsDialog'
import { useSearchHighlightRowProps } from '@/composables/useSearchHighlightRowProps'
import { leadQualificationStageLabel, leadStatusLabel } from '@/utils/crmLabels'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { highlightRowProps } = useSearchHighlightRowProps<LeadRow>()
const { tagsDialog, tagEntityId, tagSubtitle, openEntityTags } = useEntityTagsDialog()
const loading = ref(true)
const error = ref<string | null>(null)
const rows = ref<LeadRow[]>([])
const totalItems = ref(0)

const createOpen = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const formTitle = ref('')
const formEmail = ref('')
const formPhone = ref('')
const formCompanyName = ref('')
const formSource = ref('')

function openCreate() {
  createError.value = null
  formTitle.value = ''
  formEmail.value = ''
  formPhone.value = ''
  formCompanyName.value = ''
  formSource.value = ''
  createOpen.value = true
}

async function submitCreate() {
  if (!auth.token || !formTitle.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    await createLead(auth.token, {
      title: formTitle.value.trim(),
      email: formEmail.value.trim() || null,
      phone: formPhone.value.trim() || null,
      company_name: formCompanyName.value.trim() || null,
      source: formSource.value.trim() || null,
    })
    createOpen.value = false
    await loadRows()
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Erro ao criar.'
  } finally {
    creating.value = false
  }
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
    const res = await fetchLeads(auth.token, 1, 50)
    rows.value = res.data
    totalItems.value = res.meta.totalItems
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}

onMounted(() => void loadRows())
</script>

<template>
  <v-container class="py-6" fluid>
    <div class="d-flex align-center mb-4 flex-wrap gap-2">
      <h1 class="text-h5">Leads</h1>
      <v-spacer />
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate"> Novo lead </v-btn>
      <span class="text-body-2 text-medium-emphasis">Total: {{ totalItems }}</span>
    </div>

    <v-dialog v-model="createOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Novo lead</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="createError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ createError }}
          </v-alert>
          <v-text-field v-model="formTitle" label="Título *" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formEmail" label="E-mail" type="email" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formPhone" label="Telefone" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formCompanyName" label="Empresa (texto)" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formSource" label="Origem" variant="outlined" density="comfortable" />
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
      :row-props="highlightRowProps"
      :headers="[
        { title: 'Título', key: 'title' },
        { title: 'Empresa', key: 'company_name' },
        { title: 'Etapa', key: 'qualification_stage' },
        { title: 'Estado', key: 'status' },
        { title: 'Score', key: 'score' },
        { title: 'Tags', key: 'tags', sortable: false, minWidth: '220px' },
      ]"
      class="elevation-1 rounded-lg"
    >
      <template #item.title="{ item }">
        <RouterLink
          class="text-primary text-decoration-none font-weight-medium"
          :to="{ name: 'lead-detail', params: { id: String(item.id) } }"
        >
          {{ item.title }}
        </RouterLink>
      </template>
      <template #item.company_name="{ item }">
        {{ item.company_name ?? '—' }}
      </template>
      <template #item.qualification_stage="{ item }">
        {{ leadQualificationStageLabel(item.qualification_stage) }}
      </template>
      <template #item.status="{ item }">
        {{ leadStatusLabel(item.status) }}
      </template>
      <template #item.tags="{ item }">
        <ListRowTagsCell
          :tags="item.tags"
          @manage="openEntityTags(item.id, item.title)"
        />
      </template>
    </v-data-table>

    <EntityTagsDialog
      v-model="tagsDialog"
      entity-type="lead"
      :entity-id="tagEntityId"
      :subtitle="tagSubtitle"
      @changed="loadRows"
    />
  </v-container>
</template>
