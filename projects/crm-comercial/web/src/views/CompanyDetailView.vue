<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EntityTagsDialog from '@/components/EntityTagsDialog.vue'
import ListRowTagsCell from '@/components/ListRowTagsCell.vue'
import { fetchCompany, patchCompany } from '@/api/client'
import type { CompanyRow } from '@/api/types'
import { useEntityTagsDialog } from '@/composables/useEntityTagsDialog'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { tagsDialog, tagEntityId, tagSubtitle, openEntityTags } = useEntityTagsDialog()

const loading = ref(true)
const error = ref<string | null>(null)
const company = ref<CompanyRow | null>(null)

const editOpen = ref(false)
const saving = ref(false)
const editError = ref<string | null>(null)
const formName = ref('')
const formLegalName = ref('')
const formTaxId = ref('')
const formEmail = ref('')
const formPhone = ref('')
const formWebsite = ref('')

function openEdit() {
  const c = company.value
  if (!c) return
  editError.value = null
  formName.value = c.name
  formLegalName.value = c.legal_name ?? ''
  formTaxId.value = c.tax_id ?? ''
  formEmail.value = c.email ?? ''
  formPhone.value = c.phone ?? ''
  formWebsite.value = c.website ?? ''
  editOpen.value = true
}

async function saveEdit() {
  const c = company.value
  if (!auth.token || !c || !formName.value.trim()) return
  saving.value = true
  editError.value = null
  try {
    await patchCompany(auth.token, c.id, {
      name: formName.value.trim(),
      legal_name: formLegalName.value.trim() || null,
      tax_id: formTaxId.value.trim() || null,
      email: formEmail.value.trim() || null,
      phone: formPhone.value.trim() || null,
      website: formWebsite.value.trim() || null,
    })
    editOpen.value = false
    await loadCompany()
  } catch (e) {
    editError.value = e instanceof Error ? e.message : 'Erro ao guardar.'
  } finally {
    saving.value = false
  }
}

async function loadCompany() {
  if (!auth.token) {
    error.value = 'Sessão em falta.'
    loading.value = false
    company.value = null
    return
  }
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!Number.isFinite(id) || id < 1) {
    error.value = 'Identificador de empresa inválido.'
    loading.value = false
    company.value = null
    return
  }
  loading.value = true
  error.value = null
  try {
    company.value = await fetchCompany(auth.token, id)
  } catch (e) {
    company.value = null
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => void loadCompany(),
  { immediate: true },
)
</script>

<template>
  <v-container class="py-6" fluid>
    <div class="d-flex align-center flex-wrap gap-2 mb-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        rounded="lg"
        @click="router.push({ name: 'companies' })"
      >
        Voltar à lista
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="!loading && company"
        variant="tonal"
        rounded="lg"
        prepend-icon="mdi-pencil-outline"
        @click="openEdit"
      >
        Editar
      </v-btn>
    </div>

    <v-dialog v-model="editOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Editar empresa</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="editError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ editError }}
          </v-alert>
          <v-text-field v-model="formName" label="Nome *" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formLegalName" label="Razão social" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formTaxId" label="CNPJ / ID fiscal" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formEmail" label="E-mail" type="email" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formPhone" label="Telefone" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formWebsite" label="Website" variant="outlined" density="comfortable" hide-details />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editOpen = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="lg" :loading="saving" :disabled="!formName.trim()" @click="saveEdit">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading" type="article" />

    <v-card v-else-if="company" variant="outlined" rounded="lg" class="pa-2">
      <v-card-title class="text-h5 text-wrap">{{ company.name }}</v-card-title>
      <v-card-subtitle class="text-wrap pb-2">Empresa #{{ company.id }}</v-card-subtitle>
      <v-divider class="mb-4" />
      <v-row dense>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Razão social</p>
          <p class="text-body-1">{{ company.legal_name ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">CNPJ / ID fiscal</p>
          <p class="text-body-1">{{ company.tax_id ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">E-mail</p>
          <p class="text-body-1">{{ company.email ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Telefone</p>
          <p class="text-body-1">{{ company.phone ?? '—' }}</p>
        </v-col>
        <v-col cols="12">
          <p class="text-caption text-medium-emphasis mb-0">Website</p>
          <p class="text-body-1">
            <a
              v-if="company.website"
              :href="company.website"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary"
            >
              {{ company.website }}
            </a>
            <template v-else>—</template>
          </p>
        </v-col>
        <v-col cols="12">
          <p class="text-caption text-medium-emphasis mb-1">Tags</p>
          <ListRowTagsCell
            :tags="company.tags"
            @manage="openEntityTags(company.id, company.name)"
          />
        </v-col>
      </v-row>
    </v-card>

    <EntityTagsDialog
      v-model="tagsDialog"
      entity-type="company"
      :entity-id="tagEntityId"
      :subtitle="tagSubtitle"
      @changed="loadCompany"
    />
  </v-container>
</template>
