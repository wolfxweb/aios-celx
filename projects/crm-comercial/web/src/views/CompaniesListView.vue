<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import EntityTagsDialog from '@/components/EntityTagsDialog.vue'
import ListRowTagsCell from '@/components/ListRowTagsCell.vue'
import { createCompany, fetchCompanies } from '@/api/client'
import type { CompanyRow } from '@/api/types'
import { useEntityTagsDialog } from '@/composables/useEntityTagsDialog'
import { useSearchHighlightRowProps } from '@/composables/useSearchHighlightRowProps'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { highlightRowProps } = useSearchHighlightRowProps<CompanyRow>()
const { tagsDialog, tagEntityId, tagSubtitle, openEntityTags } = useEntityTagsDialog()
const loading = ref(true)
const error = ref<string | null>(null)
const rows = ref<CompanyRow[]>([])
const totalItems = ref(0)

const createOpen = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const formName = ref('')
const formLegalName = ref('')
const formTaxId = ref('')
const formEmail = ref('')
const formPhone = ref('')

async function openCreate() {
  createError.value = null
  formName.value = ''
  formLegalName.value = ''
  formTaxId.value = ''
  formEmail.value = ''
  formPhone.value = ''
  createOpen.value = true
}

async function submitCreate() {
  if (!auth.token || !formName.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    await createCompany(auth.token, {
      name: formName.value.trim(),
      legal_name: formLegalName.value.trim() || null,
      tax_id: formTaxId.value.trim() || null,
      email: formEmail.value.trim() || null,
      phone: formPhone.value.trim() || null,
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
    const res = await fetchCompanies(auth.token, 1, 50)
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
      <h1 class="text-h5">Empresas</h1>
      <v-spacer />
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate"> Nova empresa </v-btn>
      <span class="text-body-2 text-medium-emphasis">Total: {{ totalItems }}</span>
    </div>

    <v-dialog v-model="createOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Nova empresa</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="createError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ createError }}
          </v-alert>
          <v-text-field v-model="formName" label="Nome *" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formLegalName" label="Razão social" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formTaxId" label="CNPJ / ID fiscal" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formEmail" label="E-mail" type="email" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formPhone" label="Telefone" variant="outlined" density="comfortable" />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createOpen = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="lg" :loading="creating" :disabled="!formName.trim()" @click="submitCreate">
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
        { title: 'Nome', key: 'name' },
        { title: 'CNPJ / ID fiscal', key: 'tax_id' },
        { title: 'E-mail', key: 'email' },
        { title: 'Telefone', key: 'phone' },
        { title: 'Tags', key: 'tags', sortable: false, minWidth: '220px' },
      ]"
      class="elevation-1 rounded-lg"
    >
      <template #item.name="{ item }">
        <RouterLink
          class="text-primary text-decoration-none font-weight-medium"
          :to="{ name: 'company-detail', params: { id: String(item.id) } }"
        >
          {{ item.name }}
        </RouterLink>
      </template>
      <template #item.tax_id="{ item }">
        {{ item.tax_id ?? '—' }}
      </template>
      <template #item.email="{ item }">
        {{ item.email ?? '—' }}
      </template>
      <template #item.phone="{ item }">
        {{ item.phone ?? '—' }}
      </template>
      <template #item.tags="{ item }">
        <ListRowTagsCell :tags="item.tags" @manage="openEntityTags(item.id, item.name)" />
      </template>
    </v-data-table>

    <EntityTagsDialog
      v-model="tagsDialog"
      entity-type="company"
      :entity-id="tagEntityId"
      :subtitle="tagSubtitle"
      @changed="loadRows"
    />
  </v-container>
</template>
