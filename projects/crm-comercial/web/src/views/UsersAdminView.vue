<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { fetchUsersAdmin } from '@/api/client'
import type { UserListItem } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const error = ref<string | null>(null)
const rows = ref<UserListItem[]>([])
const totalItems = ref(0)

onMounted(async () => {
  if (!auth.token) {
    error.value = 'Sessão em falta.'
    loading.value = false
    return
  }
  try {
    const res = await fetchUsersAdmin(auth.token, 1, 100)
    rows.value = res.data
    totalItems.value = res.meta.totalItems
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-container class="py-6" fluid>
    <div class="d-flex align-center flex-wrap gap-2 mb-2">
      <h1 class="text-h5">Administração</h1>
      <v-spacer />
      <span class="text-body-2 text-medium-emphasis">Total: {{ totalItems }}</span>
    </div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Gestão de utilizadores desta instância (apenas contas com perfil de administrador acedem aqui).
    </p>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading" type="table" />

    <v-data-table
      v-else
      :items="rows"
      :headers="[
        { title: 'E-mail', key: 'email' },
        { title: 'Nome', key: 'full_name' },
        { title: 'Ativo', key: 'is_active' },
        { title: 'Admin', key: 'is_admin' },
      ]"
      class="elevation-1 rounded-lg"
    >
      <template #item.is_active="{ item }">
        {{ item.is_active ? 'Sim' : 'Não' }}
      </template>
      <template #item.is_admin="{ item }">
        {{ item.is_admin ? 'Sim' : 'Não' }}
      </template>
    </v-data-table>
  </v-container>
</template>
