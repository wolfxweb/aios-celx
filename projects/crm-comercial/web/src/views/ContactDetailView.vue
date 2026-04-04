<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import EntityTagsDialog from '@/components/EntityTagsDialog.vue'
import ListRowTagsCell from '@/components/ListRowTagsCell.vue'
import { fetchCompanies, fetchCompany, fetchContact, patchContact } from '@/api/client'
import type { CompanyRow, ContactRow } from '@/api/types'
import { useEntityTagsDialog } from '@/composables/useEntityTagsDialog'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { tagsDialog, tagEntityId, tagSubtitle, openEntityTags } = useEntityTagsDialog()

const loading = ref(true)
const error = ref<string | null>(null)
const contact = ref<ContactRow | null>(null)
const companiesForSelect = ref<CompanyRow[]>([])
const loadingCompanies = ref(false)

const editOpen = ref(false)
const saving = ref(false)
const editError = ref<string | null>(null)
const formFirst = ref('')
const formLast = ref('')
const formEmail = ref('')
const formPhone = ref('')
const formCompanyId = ref<number | null>(null)

function displayName(c: ContactRow): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ')
}

async function openEdit() {
  const c = contact.value
  if (!c || !auth.token) return
  editError.value = null
  formFirst.value = c.first_name
  formLast.value = c.last_name ?? ''
  formEmail.value = c.email ?? ''
  formPhone.value = c.phone ?? ''
  formCompanyId.value = c.company_id ?? null
  editOpen.value = true
  loadingCompanies.value = true
  try {
    const page = await fetchCompanies(auth.token, 1, 200)
    let list = [...page.data]
    const cid = formCompanyId.value
    if (cid != null && !list.some((row) => row.id === cid)) {
      try {
        const extra = await fetchCompany(auth.token, cid)
        list = [extra, ...list]
      } catch {
        /* mantém lista parcial */
      }
    }
    companiesForSelect.value = list
  } catch {
    companiesForSelect.value = []
  } finally {
    loadingCompanies.value = false
  }
}

async function saveEdit() {
  const c = contact.value
  if (!auth.token || !c || !formFirst.value.trim()) return
  saving.value = true
  editError.value = null
  try {
    await patchContact(auth.token, c.id, {
      first_name: formFirst.value.trim(),
      last_name: formLast.value.trim() || null,
      email: formEmail.value.trim() || null,
      phone: formPhone.value.trim() || null,
      company_id: formCompanyId.value,
    })
    editOpen.value = false
    await loadContact()
  } catch (e) {
    editError.value = e instanceof Error ? e.message : 'Erro ao guardar.'
  } finally {
    saving.value = false
  }
}

async function loadContact() {
  if (!auth.token) {
    error.value = 'Sessão em falta.'
    loading.value = false
    contact.value = null
    return
  }
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!Number.isFinite(id) || id < 1) {
    error.value = 'Identificador de contato inválido.'
    loading.value = false
    contact.value = null
    return
  }
  loading.value = true
  error.value = null
  try {
    contact.value = await fetchContact(auth.token, id)
  } catch (e) {
    contact.value = null
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => void loadContact(),
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
        @click="router.push({ name: 'contacts' })"
      >
        Voltar à lista
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="!loading && contact"
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
        <v-card-title class="text-h6">Editar contato</v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="editError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ editError }}
          </v-alert>
          <v-text-field v-model="formFirst" label="Primeiro nome *" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formLast" label="Apelido" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formEmail" label="E-mail" type="email" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model="formPhone" label="Telefone" variant="outlined" density="comfortable" class="mb-3" />
          <v-skeleton-loader v-if="loadingCompanies" type="list-item" />
          <v-select
            v-else
            v-model="formCompanyId"
            :items="companiesForSelect"
            item-title="name"
            item-value="id"
            label="Empresa"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editOpen = false">Cancelar</v-btn>
          <v-btn color="primary" rounded="lg" :loading="saving" :disabled="!formFirst.trim()" @click="saveEdit">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading" type="article" />

    <v-card v-else-if="contact" variant="outlined" rounded="lg" class="pa-2">
      <v-card-title class="text-h5 text-wrap">{{ displayName(contact) }}</v-card-title>
      <v-card-subtitle class="text-wrap pb-2">Contato #{{ contact.id }}</v-card-subtitle>
      <v-divider class="mb-4" />
      <v-row dense>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Primeiro nome</p>
          <p class="text-body-1">{{ contact.first_name }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Apelido</p>
          <p class="text-body-1">{{ contact.last_name ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">E-mail</p>
          <p class="text-body-1">{{ contact.email ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Telefone</p>
          <p class="text-body-1">{{ contact.phone ?? '—' }}</p>
        </v-col>
        <v-col cols="12" md="6">
          <p class="text-caption text-medium-emphasis mb-0">Empresa</p>
          <p class="text-body-1">
            <RouterLink
              v-if="contact.company_id != null"
              class="text-primary"
              :to="{ name: 'company-detail', params: { id: String(contact.company_id) } }"
            >
              Ver empresa #{{ contact.company_id }}
            </RouterLink>
            <template v-else>—</template>
          </p>
        </v-col>
        <v-col cols="12">
          <p class="text-caption text-medium-emphasis mb-1">Tags</p>
          <ListRowTagsCell
            :tags="contact.tags"
            @manage="openEntityTags(contact.id, displayName(contact))"
          />
        </v-col>
      </v-row>
    </v-card>

    <EntityTagsDialog
      v-model="tagsDialog"
      entity-type="contact"
      :entity-id="tagEntityId"
      :subtitle="tagSubtitle"
      @changed="loadContact"
    />
  </v-container>
</template>
