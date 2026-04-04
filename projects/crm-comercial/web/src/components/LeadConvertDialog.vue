<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { convertLead, fetchCompanies, fetchPipelines } from '@/api/client'
import type { CompanyRow, LeadRow, PipelineRow } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  modelValue: boolean
  lead: LeadRow | null
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  converted: []
}>()

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const pipelines = ref<PipelineRow[]>([])
const companies = ref<CompanyRow[]>([])

const pipelineId = ref<number | null>(null)
const stageId = ref<number | null>(null)
const opportunityTitle = ref('')
/** Valor em reais (texto), convertido para centavos no envio */
const amountReais = ref('0')
const currency = ref('BRL')
const createCompanyFromLead = ref(false)
const companyId = ref<number | null>(null)

const selectedPipeline = computed(
  () => pipelines.value.find((p) => p.id === pipelineId.value) ?? null,
)

const openStages = computed(() => {
  const st = selectedPipeline.value?.stages ?? []
  return [...st]
    .filter((s) => s.stage_type === 'open')
    .sort((a, b) => a.sort_order - b.sort_order)
})

const canCreateCompanyFromLead = computed(() => Boolean(props.lead?.company_name?.trim()))

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !props.lead || !auth.token) return
    error.value = null
    loading.value = true
    try {
      const [pl, co] = await Promise.all([
        fetchPipelines(auth.token),
        fetchCompanies(auth.token, 1, 200),
      ])
      pipelines.value = pl
      companies.value = co.data
      opportunityTitle.value = props.lead.title
      createCompanyFromLead.value = canCreateCompanyFromLead.value
      companyId.value = null
      amountReais.value = '0'
      currency.value = 'BRL'
      const defPipe = pl.find((p) => p.is_default) ?? pl[0] ?? null
      pipelineId.value = defPipe?.id ?? null
      const firstOpen = defPipe?.stages
        ?.filter((s) => s.stage_type === 'open')
        .sort((a, b) => a.sort_order - b.sort_order)[0]
      stageId.value = firstOpen?.id ?? null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erro ao carregar dados.'
    } finally {
      loading.value = false
    }
  },
)

watch(pipelineId, (pid) => {
  const p = pipelines.value.find((x) => x.id === pid)
  const firstOpen = p?.stages
    ?.filter((s) => s.stage_type === 'open')
    .sort((a, b) => a.sort_order - b.sort_order)[0]
  stageId.value = firstOpen?.id ?? null
})

function close() {
  emit('update:modelValue', false)
}

function parseAmountCents(): number {
  const n = parseFloat(String(amountReais.value).replace(',', '.'))
  if (Number.isNaN(n) || n < 0) return 0
  return Math.round(n * 100)
}

async function submit() {
  if (!auth.token || !props.lead || pipelineId.value == null || stageId.value == null) return
  if (openStages.value.length === 0) {
    error.value = 'Não há etapa «aberta» neste pipeline. Configure etapas na API ou noutro pipeline.'
    return
  }
  loading.value = true
  error.value = null
  try {
    await convertLead(auth.token, props.lead.id, {
      pipeline_id: pipelineId.value,
      stage_id: stageId.value,
      opportunity_title: opportunityTitle.value.trim() || null,
      company_id: createCompanyFromLead.value ? null : companyId.value,
      create_company_from_lead: createCompanyFromLead.value && canCreateCompanyFromLead.value,
      amount_cents: parseAmountCents(),
      currency: currency.value.trim().toUpperCase() || 'BRL',
    })
    emit('update:modelValue', false)
    emit('converted')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro na conversão.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="560" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card rounded="lg">
      <v-card-title class="text-h6">Converter lead em oportunidade</v-card-title>
      <v-card-subtitle v-if="lead" class="text-wrap pb-2">{{ lead.title }}</v-card-subtitle>
      <v-divider />
      <v-card-text class="pt-4">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
          {{ error }}
        </v-alert>

        <v-skeleton-loader v-if="loading && !pipelines.length" type="article" />

        <template v-else>
          <v-select
            v-model="pipelineId"
            :items="pipelines"
            item-title="name"
            item-value="id"
            label="Pipeline"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-select
            v-model="stageId"
            :items="openStages"
            item-title="name"
            item-value="id"
            label="Etapa inicial (aberta)"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :disabled="openStages.length === 0"
          />

          <v-text-field
            v-model="opportunityTitle"
            label="Título da oportunidade"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details
          />

          <v-row dense class="mb-3">
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="amountReais"
                label="Valor (R$)"
                type="text"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="currency"
                label="Moeda"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
          </v-row>

          <v-checkbox
            v-model="createCompanyFromLead"
            label="Criar empresa a partir do nome do lead"
            density="comfortable"
            hide-details
            class="mb-2"
            :disabled="!canCreateCompanyFromLead"
          />

          <v-select
            v-if="!createCompanyFromLead"
            v-model="companyId"
            :items="companies"
            item-title="name"
            item-value="id"
            label="Empresa existente (opcional)"
            variant="outlined"
            density="comfortable"
            clearable
            class="mb-2"
          />
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn
          color="primary"
          rounded="lg"
          :loading="loading"
          :disabled="!lead || pipelineId == null || stageId == null || openStages.length === 0"
          @click="submit"
        >
          Converter
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
