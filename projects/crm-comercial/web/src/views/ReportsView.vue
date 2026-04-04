<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { fetchReportsCatalog, runReport } from '@/api/client'
import type { ReportCatalogItem, ReportRunResponse } from '@/api/types'
import { useAuthStore } from '@/stores/auth'
import { downloadReportAsCsv } from '@/utils/reportCsv'

const auth = useAuthStore()
const loading = ref(true)
const running = ref<string | null>(null)
const error = ref<string | null>(null)
const catalog = ref<ReportCatalogItem[]>([])
const lastResult = ref<ReportRunResponse | null>(null)

onMounted(async () => {
  if (!auth.token) {
    error.value = 'Sessão em falta.'
    loading.value = false
    return
  }
  try {
    catalog.value = await fetchReportsCatalog(auth.token)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar.'
  } finally {
    loading.value = false
  }
})

async function execute(id: string) {
  if (!auth.token) return
  running.value = id
  lastResult.value = null
  error.value = null
  try {
    lastResult.value = await runReport(auth.token, id, {})
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao executar.'
  } finally {
    running.value = null
  }
}

function exportCsv() {
  if (lastResult.value) {
    downloadReportAsCsv(lastResult.value)
  }
}
</script>

<template>
  <v-container class="py-6" fluid>
    <h1 class="text-h5 mb-4">Relatórios</h1>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <v-skeleton-loader v-if="loading" type="article" />

    <v-list v-else lines="three" class="rounded-lg border">
      <v-list-item v-for="item in catalog" :key="item.id" :title="item.title" :subtitle="item.description">
        <template #append>
          <v-btn
            color="primary"
            variant="tonal"
            rounded="lg"
            :loading="running === item.id"
            :disabled="running !== null && running !== item.id"
            @click="execute(item.id)"
          >
            Executar
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-card v-if="lastResult" class="mt-6" rounded="lg" elevation="1">
      <v-card-title class="d-flex align-center flex-wrap gap-2">
        <span class="text-subtitle-1">{{ lastResult.report_id }}</span>
        <v-spacer />
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-file-download-outline"
          @click="exportCsv"
        >
          CSV
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-table density="compact">
          <thead>
            <tr>
              <th v-for="(c, i) in lastResult.columns" :key="i" class="text-left">
                {{ c }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in lastResult.rows" :key="ri">
              <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
