<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { fetchDashboardSummary } from '@/api/client'
import type { DashboardSummary } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const error = ref<string | null>(null)
const summary = ref<DashboardSummary | null>(null)

onMounted(async () => {
  if (!auth.token) {
    loading.value = false
    return
  }
  try {
    summary.value = await fetchDashboardSummary(auth.token, 30)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao carregar resumo.'
  } finally {
    loading.value = false
  }
})

function goOpp() {
  void router.push({ name: 'opportunities' })
}

function goTasks() {
  void router.push({ name: 'tasks' })
}

function goLeads() {
  void router.push({ name: 'leads' })
}

function goReports() {
  void router.push({ name: 'reports' })
}

function goUsersAdmin() {
  void router.push({ name: 'users-admin' })
}

function goCompanies() {
  void router.push({ name: 'companies' })
}

function goContacts() {
  void router.push({ name: 'contacts' })
}

function goActivities() {
  void router.push({ name: 'activities' })
}
</script>

<template>
  <!-- Largura total da área útil (sem max-width do v-container padrão) -->
  <div class="app-dashboard py-8 px-4 px-sm-6 w-100">
    <h1 class="text-h5 mb-4">Painel</h1>

    <v-alert v-if="error" type="warning" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <p v-if="summary?.period" class="text-caption text-medium-emphasis mb-4">
      Resumo (últimos 30 dias, UTC):
      {{ new Date(summary.period.from).toLocaleString('pt-BR') }} —
      {{ new Date(summary.period.to).toLocaleString('pt-BR') }}
    </p>

    <v-row v-if="!loading && summary" class="mb-6" dense>
      <v-col cols="6" sm="4" md="2">
        <v-card
          variant="tonal"
          color="primary"
          rounded="lg"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          @click="goLeads"
          @keydown.enter="goLeads"
        >
          <v-card-text class="text-center pa-3">
            <div class="text-h6">{{ summary.open_leads }}</div>
            <div class="text-caption">Leads abertos</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          variant="tonal"
          color="teal"
          rounded="lg"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          @click="goOpp"
          @keydown.enter="goOpp"
        >
          <v-card-text class="text-center pa-3">
            <div class="text-h6">{{ summary.open_opportunities }}</div>
            <div class="text-caption">Oportunidades (etapa aberta)</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          variant="tonal"
          color="orange"
          rounded="lg"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          @click="goTasks"
          @keydown.enter="goTasks"
        >
          <v-card-text class="text-center pa-3">
            <div class="text-h6">{{ summary.pending_tasks }}</div>
            <div class="text-caption">Tarefas pendentes</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          variant="tonal"
          color="purple"
          rounded="lg"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          @click="goActivities"
          @keydown.enter="goActivities"
        >
          <v-card-text class="text-center pa-3">
            <div class="text-h6">{{ summary.activities_in_period }}</div>
            <div class="text-caption">Atividades no período</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          variant="tonal"
          rounded="lg"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          @click="goCompanies"
          @keydown.enter="goCompanies"
        >
          <v-card-text class="text-center pa-3">
            <div class="text-h6">{{ summary.companies }}</div>
            <div class="text-caption">Empresas</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          variant="tonal"
          rounded="lg"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          @click="goContacts"
          @keydown.enter="goContacts"
        >
          <v-card-text class="text-center pa-3">
            <div class="text-h6">{{ summary.contacts }}</div>
            <div class="text-caption">Contatos</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-skeleton-loader v-else-if="loading" type="card" class="mb-6" />

    <p class="text-body-1 text-medium-emphasis mb-4">
      Módulos: navegue pelos botões abaixo.
    </p>
    <div class="d-flex flex-wrap align-center">
      <v-btn class="me-3 mb-2" color="primary" variant="flat" rounded="lg" @click="goLeads">
        Leads
      </v-btn>
      <v-btn class="me-3 mb-2" color="primary" variant="tonal" rounded="lg" @click="goOpp">
        Oportunidades
      </v-btn>
      <v-btn class="me-3 mb-2" color="secondary" variant="tonal" rounded="lg" @click="goTasks">
        Tarefas
      </v-btn>
      <v-btn class="me-3 mb-2" color="purple" variant="tonal" rounded="lg" @click="goActivities">
        Atividades
      </v-btn>
      <v-btn class="me-3 mb-2" color="brown" variant="tonal" rounded="lg" @click="goCompanies">
        Empresas
      </v-btn>
      <v-btn class="me-3 mb-2" color="indigo" variant="tonal" rounded="lg" @click="goContacts">
        Contatos
      </v-btn>
      <v-btn class="me-3 mb-2" color="teal" variant="tonal" rounded="lg" @click="goReports">
        Relatórios
      </v-btn>
      <v-btn
        v-if="auth.user?.is_admin"
        class="mb-2"
        color="deep-purple"
        variant="tonal"
        rounded="lg"
        @click="goUsersAdmin"
      >
        Administração
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.app-dashboard {
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}
</style>
