<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import { createTag, fetchTags, patchTag } from '@/api/client'
import type { TagRow } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const error = ref<string | null>(null)
const rows = ref<TagRow[]>([])
const includeArchived = ref(false)

const dialogOpen = ref(false)
const newName = ref('')
const newColor = ref('')
const saving = ref(false)
const formError = ref<string | null>(null)

async function load() {
  if (!auth.token) return
  loading.value = true
  error.value = null
  try {
    rows.value = await fetchTags(auth.token, includeArchived.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})

watch(includeArchived, () => {
  void load()
})

function openDialog() {
  formError.value = null
  newName.value = ''
  newColor.value = ''
  dialogOpen.value = true
}

async function submitCreate() {
  if (!auth.token) return
  const name = newName.value.trim()
  if (!name) {
    formError.value = 'Indique o nome da tag.'
    return
  }
  saving.value = true
  formError.value = null
  try {
    const c = newColor.value.trim()
    await createTag(auth.token, {
      name,
      color_hex: c ? c : null,
    })
    dialogOpen.value = false
    await load()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Erro ao criar.'
  } finally {
    saving.value = false
  }
}

async function setArchived(id: number, archived: boolean) {
  if (!auth.token) return
  error.value = null
  try {
    await patchTag(auth.token, id, { is_archived: archived })
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao atualizar.'
  }
}
</script>

<template>
  <v-container class="py-6" fluid>
    <div class="d-flex flex-wrap align-center gap-2 mb-4">
      <h1 class="text-h5">Tags</h1>
      <v-spacer />
      <v-switch
        v-model="includeArchived"
        label="Mostrar arquivadas"
        color="primary"
        density="compact"
        hide-details
        class="me-2"
      />
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-tag-plus-outline" @click="openDialog">
        Nova tag
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <v-skeleton-loader v-if="loading" type="table" />

    <v-data-table
      v-else
      :items="rows"
      :headers="[
        { title: 'Nome', key: 'name' },
        { title: 'Cor', key: 'color_hex', sortable: false },
        { title: 'Estado', key: 'is_archived' },
        { title: 'Ações', key: 'actions', sortable: false, width: '200px' },
      ]"
      class="elevation-1 rounded-lg"
    >
      <template #item.color_hex="{ item }">
        <span v-if="item.color_hex" class="d-inline-flex align-center">
          <span
            class="tag-swatch me-2"
            :style="{ backgroundColor: item.color_hex }"
            aria-hidden="true"
          />
          {{ item.color_hex }}
        </span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>
      <template #item.is_archived="{ item }">
        <v-chip v-if="item.is_archived" size="small" variant="tonal">Arquivada</v-chip>
        <v-chip v-else size="small" color="success" variant="tonal">Ativa</v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="!item.is_archived"
          size="small"
          variant="text"
          color="warning"
          @click="setArchived(item.id, true)"
        >
          Arquivar
        </v-btn>
        <v-btn v-else size="small" variant="text" color="primary" @click="setArchived(item.id, false)">
          Restaurar
        </v-btn>
      </template>
    </v-data-table>

    <v-dialog v-model="dialogOpen" max-width="480">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Nova tag</v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" variant="tonal" class="mb-4" density="compact">
            {{ formError }}
          </v-alert>
          <v-text-field
            v-model="newName"
            label="Nome"
            variant="outlined"
            density="comfortable"
            maxlength="128"
            class="mb-2"
          />
          <v-text-field
            v-model="newColor"
            label="Cor (hex, opcional)"
            placeholder="#1976d2"
            variant="outlined"
            density="comfortable"
            maxlength="16"
            hint="Ex.: #1976d2"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="submitCreate">Criar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.tag-swatch {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
