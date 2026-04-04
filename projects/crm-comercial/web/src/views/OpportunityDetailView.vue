<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import EntityTagsDialog from '@/components/EntityTagsDialog.vue'
import ListRowTagsCell from '@/components/ListRowTagsCell.vue'
import {
  fetchCompanies,
  fetchCompany,
  fetchContact,
  fetchContacts,
  fetchLossReasons,
  fetchOpportunity,
  fetchPipelines,
  markOpportunityLost,
  markOpportunityWon,
  patchOpportunity,
  patchOpportunityStage,
} from '@/api/client'
import type { CompanyRow, ContactRow, LossReasonRow, OpportunityRow, PipelineRow } from '@/api/types'
import { useEntityTagsDialog } from '@/composables/useEntityTagsDialog'
import { useAuthStore } from '@/stores/auth'
import { parseReaisToCents } from '@/utils/money'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { tagsDialog, tagEntityId, tagSubtitle, openEntityTags } = useEntityTagsDialog()

const loading = ref(true)
const error = ref<string | null>(null)
const opportunity = ref<OpportunityRow | null>(null)
const pipelines = ref<PipelineRow[]>([])
const marking = ref(false)
const lostDialog = ref(false)
const lossReasons = ref<LossReasonRow[]>([])
const lossReasonId = ref<number | null>(null)
const lostError = ref<string | null>(null)
const loadingLossReasons = ref(false)

const editOpen = ref(false)
const savingEdit = ref(false)
const editError = ref<string | null>(null)
const companiesForSelect = ref<CompanyRow[]>([])
const contactsForSelect = ref<ContactRow[]>([])
const loadingEditLists = ref(false)
const formTitle = ref('')
const formAmountReais = ref('')
const formCurrency = ref('BRL')
const formProbability = ref(0)
const formExpectedDate = ref('')
const formCompanyId = ref<number | null>(null)
const formContactId = ref<number | null>(null)

const currentStageMeta = computed(() => {
  const o = opportunity.value
  if (!o) return null
  const p = pipelines.value.find((x) => x.id === o.pipeline_id)
  const s = p?.stages.find((st) => st.id === o.stage_id)
  return s ? { name: s.name, type: s.stage_type } : null
})

const canMarkOpen = computed(() => currentStageMeta.value?.type === 'open')

const openStagesInPipeline = computed(() => {
  const o = opportunity.value
  if (!o) return []
  const p = pipelines.value.find((x) => x.id === o.pipeline_id)
  const stages = p?.stages ?? []
  return [...stages]
    .filter((s) => s.stage_type === 'open')
    .sort((a, b) => a.sort_order - b.sort_order)
})

const movingStage = ref(false)

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

async function loadOpportunity() {
  if (!auth.token) {
    error.value = 'Sessão em falta.'
    loading.value = false
    opportunity.value = null
    return
  }
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!Number.isFinite(id) || id < 1) {
    error.value = 'Identificador de oportunidade inválido.'
    loading.value = false
    opportunity.value = null
    return
  }
  loading.value = true
  error.value = null
  try {
    const [opp, pls] = await Promise.all([
      fetchOpportunity(auth.token, id),
      fetchPipelines(auth.token),
    ])
    opportunity.value = opp
    pipelines.value = pls
  } catch (e) {
    opportunity.value = null
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => void loadOpportunity(),
  { immediate: true },
)

async function openLostDialog() {
  lostError.value = null
  lossReasonId.value = null
  lostDialog.value = true
  const o = opportunity.value
  if (!auth.token || !o) return
  loadingLossReasons.value = true
  try {
    lossReasons.value = await fetchLossReasons(auth.token, o.pipeline_id)
  } catch {
    lossReasons.value = []
  } finally {
    loadingLossReasons.value = false
  }
}

async function confirmLost() {
  const o = opportunity.value
  if (!auth.token || !o) return
  marking.value = true
  lostError.value = null
  try {
    await markOpportunityLost(auth.token, o.id, lossReasonId.value)
    lostDialog.value = false
    await loadOpportunity()
  } catch (e) {
    lostError.value = e instanceof Error ? e.message : 'Erro.'
  } finally {
    marking.value = false
  }
}

async function openEdit() {
  const o = opportunity.value
  if (!o || !auth.token) return
  editError.value = null
  formTitle.value = o.title
  formAmountReais.value = (o.amount_cents / 100).toFixed(2)
  formCurrency.value = o.currency || 'BRL'
  formProbability.value = o.probability
  formExpectedDate.value = o.expected_close_date ? o.expected_close_date.slice(0, 10) : ''
  formCompanyId.value = o.company_id ?? null
  formContactId.value = o.contact_id ?? null
  editOpen.value = true
  loadingEditLists.value = true
  try {
    const [co, ct] = await Promise.all([
      fetchCompanies(auth.token, 1, 200),
      fetchContacts(auth.token, 1, 200),
    ])
    let companies = [...co.data]
    let contacts = [...ct.data]
    const compId = formCompanyId.value
    const contId = formContactId.value
    const extraFetches: Promise<void>[] = []
    if (compId != null && !companies.some((row) => row.id === compId)) {
      extraFetches.push(
        fetchCompany(auth.token, compId)
          .then((row) => {
            companies = [row, ...companies]
          })
          .catch(() => {}),
      )
    }
    if (contId != null && !contacts.some((row) => row.id === contId)) {
      extraFetches.push(
        fetchContact(auth.token, contId)
          .then((row) => {
            contacts = [row, ...contacts]
          })
          .catch(() => {}),
      )
    }
    await Promise.all(extraFetches)
    companiesForSelect.value = companies
    contactsForSelect.value = contacts
  } catch {
    companiesForSelect.value = []
    contactsForSelect.value = []
  } finally {
    loadingEditLists.value = false
  }
}

function contactDisplay(c: ContactRow): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || `#${c.id}`
}

async function saveEdit() {
  const o = opportunity.value
  if (!auth.token || !o || !formTitle.value.trim()) return
  savingEdit.value = true
  editError.value = null
  const parsed = parseReaisToCents(formAmountReais.value)
  if (!parsed.ok) {
    editError.value = parsed.message
    savingEdit.value = false
    return
  }
  const prob = Number(formProbability.value)
  if (!Number.isFinite(prob) || prob < 0 || prob > 100) {
    editError.value = 'Probabilidade deve estar entre 0 e 100.'
    savingEdit.value = false
    return
  }
  const currency = formCurrency.value.trim() || 'BRL'
  if (currency.length !== 3) {
    editError.value = 'Use um código de moeda ISO de 3 letras (ex.: BRL).'
    savingEdit.value = false
    return
  }
  try {
    await patchOpportunity(auth.token, o.id, {
      title: formTitle.value.trim(),
      amount_cents: parsed.cents,
      currency,
      probability: Math.round(prob),
      expected_close_date: formExpectedDate.value.trim() ? formExpectedDate.value.trim() : null,
      company_id: formCompanyId.value,
      contact_id: formContactId.value,
    })
    editOpen.value = false
    await loadOpportunity()
  } catch (e) {
    editError.value = e instanceof Error ? e.message : 'Erro ao guardar.'
  } finally {
    savingEdit.value = false
  }
}

async function changeOpportunityStage(newStageId: number | null) {
  const o = opportunity.value
  if (!auth.token || !o || newStageId == null || newStageId === o.stage_id) return
  movingStage.value = true
  error.value = null
  try {
    await patchOpportunityStage(auth.token, o.id, { stage_id: newStageId })
    await loadOpportunity()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao mudar etapa.'
  } finally {
    movingStage.value = false
  }
}

async function doMarkWon() {
  const o = opportunity.value
  if (!auth.token || !o) return
  marking.value = true
  try {
    await markOpportunityWon(auth.token, o.id)
    await loadOpportunity()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao marcar ganho.'
  } finally {
    marking.value = false
  }
}
</script>

<template>
  <v-container class="py-6" fluid>
    <div class="d-flex align-center flex-wrap gap-2 mb-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        rounded="lg"
        @click="router.push({ name: 'opportunities' })"
      >
        Voltar à lista
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="!loading && opportunity"
        variant="tonal"
        rounded="lg"
        prepend-icon="mdi-pencil-outline"
        @click="openEdit"
      >
        Editar
      </v-btn>
      <template v-if="!loading && opportunity && canMarkOpen">
        <v-btn
          color="success"
          rounded="lg"
          prepend-icon="mdi-trophy-outline"
          :loading="marking"
          @click="doMarkWon"
        >
          Marcar ganho
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-close-circle-outline"
          :loading="marking"
          @click="openLostDialog"
        >
          Marcar perda
        </v-btn>
      </template>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading" type="article" />

    <v-card v-else-if="opportunity" variant="outlined" rounded="lg" class="pa-2">
      <v-card-title class="text-h5 text-wrap">{{ opportunity.title }}</v-card-title>
      <v-card-subtitle class="text-wrap pb-2">Oportunidade #{{ opportunity.id }}</v-card-subtitle>
      <v-divider class="mb-4" />
      <v-row dense>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Valor</p>
          <p class="text-body-1">{{ formatMoney(opportunity.amount_cents, opportunity.currency) }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Probabilidade</p>
          <p class="text-body-1">{{ opportunity.probability }}%</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Pipeline (id)</p>
          <p class="text-body-1">{{ opportunity.pipeline_id }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-1">Etapa</p>
          <v-select
            v-if="canMarkOpen && openStagesInPipeline.length > 0"
            :model-value="opportunity.stage_id"
            :items="openStagesInPipeline"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            hide-details
            :loading="movingStage"
            :disabled="movingStage || marking"
            @update:model-value="changeOpportunityStage"
          />
          <p v-else class="text-body-1 mb-0">
            {{ currentStageMeta?.name ?? '—' }}
            <span class="text-medium-emphasis"> (id {{ opportunity.stage_id }})</span>
          </p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Empresa</p>
          <p class="text-body-1">
            <RouterLink
              v-if="opportunity.company_id != null"
              class="text-primary"
              :to="{ name: 'company-detail', params: { id: String(opportunity.company_id) } }"
            >
              Ver empresa #{{ opportunity.company_id }}
            </RouterLink>
            <template v-else>—</template>
          </p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Contato</p>
          <p class="text-body-1">
            <RouterLink
              v-if="opportunity.contact_id != null"
              class="text-primary"
              :to="{ name: 'contact-detail', params: { id: String(opportunity.contact_id) } }"
            >
              Ver contato #{{ opportunity.contact_id }}
            </RouterLink>
            <template v-else>—</template>
          </p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Previsão de fechamento</p>
          <p class="text-body-1">{{ formatDate(opportunity.expected_close_date) }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Motivo de perda (id)</p>
          <p class="text-body-1">{{ opportunity.loss_reason_id ?? '—' }}</p>
        </v-col>
        <v-col cols="12">
          <p class="text-caption text-medium-emphasis mb-1">Tags</p>
          <ListRowTagsCell
            :tags="opportunity.tags"
            @manage="openEntityTags(opportunity.id, opportunity.title)"
          />
        </v-col>
      </v-row>
    </v-card>

    <EntityTagsDialog
      v-model="tagsDialog"
      entity-type="opportunity"
      :entity-id="tagEntityId"
      :subtitle="tagSubtitle"
      @changed="loadOpportunity"
    />

    <v-dialog v-model="editOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Editar oportunidade</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="editError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ editError }}
          </v-alert>
          <v-text-field v-model="formTitle" label="Título *" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field
            v-model="formAmountReais"
            label="Valor (reais)"
            type="text"
            inputmode="decimal"
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
          <v-skeleton-loader v-if="loadingEditLists" type="list-item-two-line" />
          <template v-else>
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
          <v-btn variant="text" @click="editOpen = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="lg" :loading="savingEdit" :disabled="!formTitle.trim()" @click="saveEdit">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="lostDialog" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Marcar como perda</v-card-title>
        <v-card-text class="pt-4">
          <v-alert v-if="lostError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ lostError }}
          </v-alert>
          <p class="text-body-2 text-medium-emphasis mb-3">Motivo de perda (opcional)</p>
          <v-skeleton-loader v-if="loadingLossReasons" type="list-item" />
          <v-select
            v-else
            v-model="lossReasonId"
            :items="lossReasons"
            item-title="name"
            item-value="id"
            label="Motivo"
            variant="outlined"
            density="comfortable"
            clearable
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="lostDialog = false">Cancelar</v-btn>
          <v-btn color="error" rounded="lg" :loading="marking" @click="confirmLost">Confirmar perda</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
