<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import SearchResultsList from '@/components/SearchResultsList.vue'
import { fetchSearch } from '@/api/client'
import type { SearchHit } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const q = ref('')
const hits = ref<SearchHit[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const dropdownOpen = ref(false)
const mobileDialogOpen = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const hasQuery = computed(() => q.value.trim().length >= 1)

watch(q, (v) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const s = v.trim()
  if (s.length < 1) {
    hits.value = []
    error.value = null
    return
  }
  debounceTimer = setTimeout(async () => {
    if (!auth.token) return
    loading.value = true
    error.value = null
    try {
      const res = await fetchSearch(auth.token, s)
      hits.value = res.hits
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erro na pesquisa.'
      hits.value = []
    } finally {
      loading.value = false
    }
  }, 320)
})

function routeNameForHit(h: SearchHit): string | null {
  switch (h.type) {
    case 'lead':
      return 'leads'
    case 'company':
      return 'companies'
    case 'contact':
      return 'contacts'
    case 'opportunity':
      return 'opportunities'
    default:
      return null
  }
}

function openHit(h: SearchHit) {
  dropdownOpen.value = false
  mobileDialogOpen.value = false
  q.value = ''
  hits.value = []
  if (h.type === 'lead') {
    void router.push({ name: 'lead-detail', params: { id: String(h.id) } })
    return
  }
  if (h.type === 'company') {
    void router.push({ name: 'company-detail', params: { id: String(h.id) } })
    return
  }
  if (h.type === 'contact') {
    void router.push({ name: 'contact-detail', params: { id: String(h.id) } })
    return
  }
  if (h.type === 'opportunity') {
    void router.push({ name: 'opportunity-detail', params: { id: String(h.id) } })
    return
  }
  const name = routeNameForHit(h)
  if (!name) return
  void router.push({ name, query: { highlight: String(h.id) } })
}

function onBlurField() {
  window.setTimeout(() => {
    dropdownOpen.value = false
  }, 180)
}
</script>

<template>
  <!-- Desktop: campo + painel -->
  <div class="global-search d-none d-md-flex align-center">
    <v-text-field
      v-model="q"
      density="compact"
      variant="solo-filled"
      flat
      hide-details
      clearable
      placeholder="Buscar…"
      prepend-inner-icon="mdi-magnify"
      autocomplete="off"
      class="global-search-field"
      @focus="dropdownOpen = true"
      @blur="onBlurField"
      @click:clear="hits = []"
    />
    <v-card
      v-show="dropdownOpen && hasQuery"
      class="global-search-panel elevation-8"
      rounded="lg"
      @mousedown.prevent
    >
      <SearchResultsList
        :loading="loading"
        :error="error"
        :hits="hits"
        :has-query="hasQuery"
        @select="openHit"
      />
    </v-card>
  </div>

  <!-- Telemóvel / estreito: ícone abre ecrã de pesquisa -->
  <div class="d-flex d-md-none align-center">
    <v-btn
      icon
      variant="text"
      aria-label="Abrir pesquisa"
      @click="mobileDialogOpen = true"
    >
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
  </div>

  <v-dialog
    v-model="mobileDialogOpen"
    fullscreen
    transition="dialog-bottom-transition"
    scrim
  >
    <v-card class="d-flex flex-column h-100 rounded-0">
      <v-toolbar density="comfortable" color="surface" elevation="1">
        <v-btn icon variant="text" aria-label="Fechar" @click="mobileDialogOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Buscar</v-toolbar-title>
      </v-toolbar>
      <v-card-text class="flex-grow-1 d-flex flex-column pt-4">
        <v-text-field
          v-model="q"
          autofocus
          hide-details
          placeholder="Buscar…"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          autocomplete="off"
          class="mb-2"
          @click:clear="hits = []"
        />
        <div class="search-mobile-results flex-grow-1 overflow-y-auto">
          <SearchResultsList
            :loading="loading"
            :error="error"
            :hits="hits"
            :has-query="hasQuery"
            @select="openHit"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.global-search {
  position: relative;
  max-width: min(320px, 36vw);
  min-width: 200px;
}

.global-search-field :deep(.v-field) {
  border-radius: 999px;
}

.global-search-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 20;
  max-height: min(360px, 50vh);
  overflow-y: auto;
}

.search-mobile-results {
  max-height: calc(100vh - 200px);
}
</style>
