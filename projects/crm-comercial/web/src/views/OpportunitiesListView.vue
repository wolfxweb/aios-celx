<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import EntityTagsDialog from '@/components/EntityTagsDialog.vue'
import ListRowTagsCell from '@/components/ListRowTagsCell.vue'
import {
  createOpportunity,
  fetchCompanies,
  fetchContacts,
  fetchOpportunities,
  fetchPipelines,
} from '@/api/client'
import type { CompanyRow, ContactRow, OpportunityRow, PipelineRow } from '@/api/types'
import { useEntityTagsDialog } from '@/composables/useEntityTagsDialog'
import { useSearchHighlightRowProps } from '@/composables/useSearchHighlightRowProps'
import { useAuthStore } from '@/stores/auth'
import { parseReaisToCents } from '@/utils/money'

const auth = useAuthStore()
const { highlightRowProps } = useSearchHighlightRowProps<OpportunityRow>()
const { tagsDialog, tagEntityId, tagSubtitle, openEntityTags } = useEntityTagsDialog()
const loading = ref(true)
const error = ref<string | null>(null)
const rows = ref<OpportunityRow[]>([])
const pipelines = ref<PipelineRow[]>([])
const totalItems = ref(0)

const createOpen = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const loadingCreateLists = ref(false)
const companiesForSelect = ref<CompanyRow[]>([])
const contactsForSelect = ref<ContactRow[]>([])

const formTitle = ref('')
const formPipelineId = ref<number | null>(null)
const formStageId = ref<number | null>(null)
const formAmountReais = ref('0,00')
const formCurrency = ref('BRL')
const formProbability = ref(10)
const formExpectedDate = ref('')
const formCompanyId = ref<number | null>(null)
const formContactId = ref<number | null>(null)

const openStagesForForm = computed(() => {
  const pid = formPipelineId.value
  if (pid == null) return []
  const p = pipelines.value.find((x) => x.id === pid)
  return [...(p?.stages ?? [])]
    .filter((s) => s.stage_type === 'open')
    .sort((a, b) => a.sort_order - b.sort_order)
})

function contactDisplay(c: ContactRow): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || `#${c.id}`
}

function syncStageToPipeline(pipelineId: number | null) {
  if (pipelineId == null) {
    formStageId.value = null
    return
  }
  const p = pipelines.value.find((x) => x.id === pipelineId)
  const open = [...(p?.stages ?? [])]
    .filter((s) => s.stage_type === 'open')
    .sort((a, b) => a.sort_order - b.sort_order)
  formStageId.value = open[0]?.id ?? null
}

function pipelineName(pipelineId: number): string {
  return pipelines.value.find((p) => p.id === pipelineId)?.name ?? `— (#${pipelineId})`
}

function stageLabel(item: OpportunityRow): string {
  const p = pipelines.value.find((x) => x.id === item.pipeline_id)
  const s = p?.stages.find((st) => st.id === item.stage_id)
  return s?.name ?? `— (#${item.stage_id})`
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`
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
    const [res, pls] = await Promise.all([
      fetchOpportunities(auth.token, 1, 50),
      fetchPipelines(auth.token),
    ])
    rows.value = res.data
    pipelines.value = pls
    totalItems.value = res.meta.totalItems
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  if (!auth.token) return
  createError.value = null
  formTitle.value = ''
  formAmountReais.value = '0,00'
  formCurrency.value = 'BRL'
  formProbability.value = 10
  formExpectedDate.value = ''
  formCompanyId.value = null
  formContactId.value = null
  createOpen.value = true
  loadingCreateLists.value = true
  try {
    const [pls, co, ct] = await Promise.all([
      fetchPipelines(auth.token),
      fetchCompanies(auth.token, 1, 200),
      fetchContacts(auth.token, 1, 200),
    ])
    pipelines.value = pls
    companiesForSelect.value = co.data
    contactsForSelect.value = ct.data
    const def = pls.find((p) => p.is_default) ?? pls[0]
    formPipelineId.value = def?.id ?? null
    syncStageToPipeline(formPipelineId.value)
  } catch {
    createError.value = 'Não foi possível carregar pipelines ou listas.'
  } finally {
    loadingCreateLists.value = false
  }
}

async function submitCreate() {
  if (!auth.token || !formTitle.value.trim() || formPipelineId.value == null || formStageId.value == null) {
    return
  }
  const parsed = parseReaisToCents(formAmountReais.value)
  if (!parsed.ok) {
    createError.value = parsed.message
    return
  }
  const prob = Number(formProbability.value)
  if (!Number.isFinite(prob) || prob < 0 || prob > 100) {
    createError.value = 'Probabilidade deve estar entre 0 e 100.'
    return
  }
  const cur = formCurrency.value.trim() || 'BRL'
  if (cur.length !== 3) {
    createError.value = 'Use um código de moeda ISO de 3 letras (ex.: BRL).'
    return
  }
  creating.value = true
  createError.value = null
  try {
    await createOpportunity(auth.token, {
      title: formTitle.value.trim(),
      pipeline_id: formPipelineId.value,
      stage_id: formStageId.value,
      company_id: formCompanyId.value,
      contact_id: formContactId.value,
      amount_cents: parsed.cents,
      currency: cur,
      probability: Math.round(prob),
      expected_close_date: formExpectedDate.value.trim() ? formExpectedDate.value.trim() : null,
    })
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
      <h1 class="text-h5">Oportunidades</h1>
      <v-spacer />
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate"> Nova oportunidade </v-btn>
      <span class="text-body-2 text-medium-emphasis">Total: {{ totalItems }}</span>
    </div>

    <v-dialog v-model="createOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Nova oportunidade</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="createError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ createError }}
          </v-alert>
          <v-skeleton-loader v-if="loadingCreateLists" type="article" />
          <template v-else>
            <v-text-field v-model="formTitle" label="Título *" variant="outlined" density="comfortable" class="mb-3" />
            <v-select
              v-model="formPipelineId"
              :items="pipelines"
              item-title="name"
              item-value="id"
              label="Pipeline *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details
              @update:model-value="syncStageToPipeline"
            />
            <v-select
              v-model="formStageId"
              :items="openStagesForForm"
              item-title="name"
              item-value="id"
              label="Etapa inicial *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              :disabled="openStagesForForm.length === 0"
              hide-details
            />
            <v-text-field
              v-model="formAmountReais"
              label="Valor (reais) *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hint="Ex.: 1500,50"
              persistent-hint
            />
            <v-text-field
              v-model="formCurrency"
              label="Moeda (ISO)"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details
            />
            <v-text-field
              v-model.number="formProbability"
              label="Probabilidade (%)"
              type="number"
              min="0"
              max="100"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="formExpectedDate"
              label="Previsão de fechamento"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hide-details
            />
            <v-select
              v-model="formCompanyId"
              :items="companiesForSelect"
              item-title="name"
              item-value="id"
              label="Empresa"
              variant="outlined"
              density="comfortable"
              clearable
              class="mb-3"
            />
            <v-select
              v-model="formContactId"
              :items="contactsForSelect"
              :item-title="contactDisplay"
              item-value="id"
              label="Contato"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </template>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createOpen = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            rounded="lg"
            :loading="creating"
            :disabled="
              loadingCreateLists ||
              !formTitle.trim() ||
              formPipelineId == null ||
              formStageId == null ||
              openStagesForForm.length === 0
            "
            @click="submitCreate"
          >
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
        { title: 'Valor', key: 'amount_cents' },
        { title: 'Prob.', key: 'probability' },
        { title: 'Pipeline', key: 'pipeline_id' },
        { title: 'Etapa', key: 'stage_id' },
        { title: 'Tags', key: 'tags', sortable: false, minWidth: '220px' },
      ]"
      class="elevation-1 rounded-lg"
    >
      <template #item.title="{ item }">
        <RouterLink
          class="text-primary text-decoration-none font-weight-medium"
          :to="{ name: 'opportunity-detail', params: { id: String(item.id) } }"
        >
          {{ item.title }}
        </RouterLink>
      </template>
      <template #item.amount_cents="{ item }">
        {{ formatMoney(item.amount_cents, item.currency) }}
      </template>
      <template #item.probability="{ item }"> {{ item.probability }}% </template>
      <template #item.pipeline_id="{ item }">
        {{ pipelineName(item.pipeline_id) }}
      </template>
      <template #item.stage_id="{ item }">
        {{ stageLabel(item) }}
      </template>
      <template #item.tags="{ item }">
        <ListRowTagsCell :tags="item.tags" @manage="openEntityTags(item.id, item.title)" />
      </template>
    </v-data-table>

    <EntityTagsDialog
      v-model="tagsDialog"
      entity-type="opportunity"
      :entity-id="tagEntityId"
      :subtitle="tagSubtitle"
      @changed="loadRows"
    />
  </v-container>
</template>
