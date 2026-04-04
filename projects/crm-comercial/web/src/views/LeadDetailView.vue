<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import EntityTagsDialog from '@/components/EntityTagsDialog.vue'
import LeadConvertDialog from '@/components/LeadConvertDialog.vue'
import ListRowTagsCell from '@/components/ListRowTagsCell.vue'
import { fetchLead, patchLead } from '@/api/client'
import type { LeadRow } from '@/api/types'
import { useEntityTagsDialog } from '@/composables/useEntityTagsDialog'
import { useAuthStore } from '@/stores/auth'
import { leadQualificationStageLabel, leadStatusLabel } from '@/utils/crmLabels'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { tagsDialog, tagEntityId, tagSubtitle, openEntityTags } = useEntityTagsDialog()

const loading = ref(true)
const error = ref<string | null>(null)
const lead = ref<LeadRow | null>(null)
const convertDialog = ref(false)

const editOpen = ref(false)
const saving = ref(false)
const editError = ref<string | null>(null)
const formTitle = ref('')
const formEmail = ref('')
const formPhone = ref('')
const formCompanyName = ref('')
const formSource = ref('')
const formStage = ref<'novo' | 'contato' | 'qualificado' | 'perdido'>('novo')
const formScore = ref(0)

function openEdit() {
  const l = lead.value
  if (!l) return
  editError.value = null
  formTitle.value = l.title
  formEmail.value = l.email ?? ''
  formPhone.value = l.phone ?? ''
  formCompanyName.value = l.company_name ?? ''
  formSource.value = l.source ?? ''
  formStage.value = l.qualification_stage as typeof formStage.value
  formScore.value = l.score
  editOpen.value = true
}

async function saveEdit() {
  const l = lead.value
  if (!auth.token || !l || !formTitle.value.trim()) return
  saving.value = true
  editError.value = null
  try {
    await patchLead(auth.token, l.id, {
      title: formTitle.value.trim(),
      email: formEmail.value.trim() || null,
      phone: formPhone.value.trim() || null,
      company_name: formCompanyName.value.trim() || null,
      source: formSource.value.trim() || null,
      qualification_stage: formStage.value,
      score: formScore.value,
    })
    editOpen.value = false
    await loadLead()
  } catch (e) {
    editError.value = e instanceof Error ? e.message : 'Erro ao guardar.'
  } finally {
    saving.value = false
  }
}

async function loadLead() {
  if (!auth.token) {
    error.value = 'Sessão em falta.'
    loading.value = false
    lead.value = null
    return
  }
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!Number.isFinite(id) || id < 1) {
    error.value = 'Identificador de lead inválido.'
    loading.value = false
    lead.value = null
    return
  }
  loading.value = true
  error.value = null
  try {
    lead.value = await fetchLead(auth.token, id)
  } catch (e) {
    lead.value = null
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => void loadLead(),
  { immediate: true },
)

async function onTagsChanged() {
  await loadLead()
}

async function afterConvert() {
  await loadLead()
  const oid = lead.value?.converted_opportunity_id
  if (oid != null) {
    void router.push({ name: 'opportunity-detail', params: { id: String(oid) } })
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
        @click="router.push({ name: 'leads' })"
      >
        Voltar à lista
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="!loading && lead && lead.status !== 'converted'"
        variant="tonal"
        rounded="lg"
        prepend-icon="mdi-pencil-outline"
        @click="openEdit"
      >
        Editar
      </v-btn>
      <v-btn
        v-if="lead && lead.status === 'open'"
        color="primary"
        rounded="lg"
        prepend-icon="mdi-briefcase-plus-outline"
        @click="convertDialog = true"
      >
        Converter em oportunidade
      </v-btn>
    </div>

    <v-dialog v-model="editOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Editar lead</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="editError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ editError }}
          </v-alert>
          <v-text-field v-model="formTitle" label="Título *" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formEmail" label="E-mail" type="email" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formPhone" label="Telefone" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formCompanyName" label="Empresa (texto)" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formSource" label="Origem" variant="outlined" density="comfortable" class="mb-3" />
          <v-select
            v-model="formStage"
            :items="[
              { title: 'Novo', value: 'novo' },
              { title: 'Contato', value: 'contato' },
              { title: 'Qualificado', value: 'qualificado' },
              { title: 'Perdido', value: 'perdido' },
            ]"
            item-title="title"
            item-value="value"
            label="Etapa de qualificação"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model.number="formScore"
            label="Score"
            type="number"
            min="0"
            max="100"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editOpen = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="lg" :loading="saving" :disabled="!formTitle.trim()" @click="saveEdit">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading" type="article" />

    <v-card v-else-if="lead" variant="outlined" rounded="lg" class="pa-2">
      <v-card-title class="text-h5 text-wrap">{{ lead.title }}</v-card-title>
      <v-card-subtitle class="text-wrap pb-2">
        Lead #{{ lead.id }} · {{ leadStatusLabel(lead.status) }} ·
        {{ leadQualificationStageLabel(lead.qualification_stage) }}
      </v-card-subtitle>
      <v-divider class="mb-4" />
      <v-row dense>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">E-mail</p>
          <p class="text-body-1">{{ lead.email ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Telefone</p>
          <p class="text-body-1">{{ lead.phone ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Empresa (texto)</p>
          <p class="text-body-1">{{ lead.company_name ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Origem</p>
          <p class="text-body-1">{{ lead.source ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Score</p>
          <p class="text-body-1">{{ lead.score }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Oportunidade convertida (id)</p>
          <p class="text-body-1">
            <template v-if="lead.converted_opportunity_id != null">
              <RouterLink
                class="text-primary"
                :to="{
                  name: 'opportunity-detail',
                  params: { id: String(lead.converted_opportunity_id) },
                }"
              >
                {{ lead.converted_opportunity_id }}
              </RouterLink>
            </template>
            <template v-else>—</template>
          </p>
        </v-col>
        <v-col cols="12">
          <p class="text-caption text-medium-emphasis mb-1">Tags</p>
          <ListRowTagsCell :tags="lead.tags" @manage="openEntityTags(lead.id, lead.title)" />
        </v-col>
      </v-row>
    </v-card>

    <EntityTagsDialog
      v-model="tagsDialog"
      entity-type="lead"
      :entity-id="tagEntityId"
      :subtitle="tagSubtitle"
      @changed="onTagsChanged"
    />

    <LeadConvertDialog v-model="convertDialog" :lead="lead" @converted="afterConvert" />
  </v-container>
</template>
