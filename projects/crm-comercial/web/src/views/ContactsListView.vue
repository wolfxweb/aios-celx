<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import EntityTagsDialog from '@/components/EntityTagsDialog.vue'
import ListRowTagsCell from '@/components/ListRowTagsCell.vue'
import { createContact, fetchCompanies, fetchContacts } from '@/api/client'
import type { CompanyRow, ContactRow } from '@/api/types'
import { useEntityTagsDialog } from '@/composables/useEntityTagsDialog'
import { useSearchHighlightRowProps } from '@/composables/useSearchHighlightRowProps'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { highlightRowProps } = useSearchHighlightRowProps<ContactRow>()
const { tagsDialog, tagEntityId, tagSubtitle, openEntityTags } = useEntityTagsDialog()
const loading = ref(true)
const error = ref<string | null>(null)
const rows = ref<ContactRow[]>([])
const totalItems = ref(0)

function contactName(item: ContactRow): string {
  return [item.first_name, item.last_name].filter(Boolean).join(' ')
}

const createOpen = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const companiesForSelect = ref<CompanyRow[]>([])
const formFirst = ref('')
const formLast = ref('')
const formEmail = ref('')
const formPhone = ref('')
const formCompanyId = ref<number | null>(null)

async function openCreate() {
  createError.value = null
  formFirst.value = ''
  formLast.value = ''
  formEmail.value = ''
  formPhone.value = ''
  formCompanyId.value = null
  if (auth.token) {
    try {
      const c = await fetchCompanies(auth.token, 1, 200)
      companiesForSelect.value = c.data
    } catch {
      companiesForSelect.value = []
    }
  }
  createOpen.value = true
}

async function submitCreate() {
  if (!auth.token || !formFirst.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    await createContact(auth.token, {
      first_name: formFirst.value.trim(),
      last_name: formLast.value.trim() || null,
      email: formEmail.value.trim() || null,
      phone: formPhone.value.trim() || null,
      company_id: formCompanyId.value,
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
    const res = await fetchContacts(auth.token, 1, 50)
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
      <h1 class="text-h5">Contatos</h1>
      <v-spacer />
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openCreate"> Novo contato </v-btn>
      <span class="text-body-2 text-medium-emphasis">Total: {{ totalItems }}</span>
    </div>

    <v-dialog v-model="createOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Novo contato</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="createError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ createError }}
          </v-alert>
          <v-text-field v-model="formFirst" label="Primeiro nome *" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formLast" label="Apelido" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formEmail" label="E-mail" type="email" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formPhone" label="Telefone" variant="outlined" density="comfortable" class="mb-3" />
          <v-select
            v-model="formCompanyId"
            :items="companiesForSelect"
            item-title="name"
            item-value="id"
            label="Empresa (opcional)"
            variant="outlined"
            density="comfortable"
            clearable
          />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createOpen = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="lg" :loading="creating" :disabled="!formFirst.trim()" @click="submitCreate">
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
        { title: 'Nome', key: 'first_name' },
        { title: 'E-mail', key: 'email' },
        { title: 'Telefone', key: 'phone' },
        { title: 'Empresa (id)', key: 'company_id' },
        { title: 'Tags', key: 'tags', sortable: false, minWidth: '220px' },
      ]"
      class="elevation-1 rounded-lg"
    >
      <template #item.first_name="{ item }">
        {{ contactName(item) }}
      </template>
      <template #item.email="{ item }">
        {{ item.email ?? '—' }}
      </template>
      <template #item.phone="{ item }">
        {{ item.phone ?? '—' }}
      </template>
      <template #item.company_id="{ item }">
        <RouterLink
          v-if="item.company_id != null"
          class="text-primary text-decoration-none"
          :to="{ name: 'company-detail', params: { id: String(item.company_id) } }"
        >
          {{ item.company_id }}
        </RouterLink>
        <template v-else>—</template>
      </template>
      <template #item.tags="{ item }">
        <ListRowTagsCell
          :tags="item.tags"
          @manage="openEntityTags(item.id, contactName(item))"
        />
      </template>
    </v-data-table>

    <EntityTagsDialog
      v-model="tagsDialog"
      entity-type="contact"
      :entity-id="tagEntityId"
      :subtitle="tagSubtitle"
      @changed="loadRows"
    />
  </v-container>
</template>
