<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import { patchMe } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const fullName = ref('')
const phone = ref('')
const sidebarCollapsed = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

function syncFromUser() {
  const u = auth.user
  if (!u) return
  fullName.value = u.full_name
  phone.value = u.phone ?? ''
  sidebarCollapsed.value = u.sidebar_collapsed_default
}

onMounted(() => {
  syncFromUser()
})

watch(
  () => auth.user,
  () => syncFromUser(),
  { deep: true },
)

async function save() {
  if (!auth.token) return
  error.value = null
  success.value = false
  saving.value = true
  try {
    const p = phone.value.trim()
    const u = await patchMe(auth.token, {
      full_name: fullName.value.trim(),
      phone: p ? p : null,
      sidebar_collapsed_default: sidebarCollapsed.value,
    })
    auth.setUser(u)
    success.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível guardar.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container class="py-8" style="max-width: 32rem">
    <h1 class="text-h5 mb-2">Perfil</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Dados da conta e preferências de interface (tema: secção «Aparência» no menu lateral).
    </p>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>
    <v-alert v-if="success" type="success" variant="tonal" class="mb-4" density="compact">
      Alterações guardadas.
    </v-alert>

    <v-card rounded="lg" elevation="1">
      <v-card-text>
        <v-text-field
          :model-value="auth.user?.email ?? ''"
          label="E-mail"
          variant="outlined"
          density="comfortable"
          readonly
          disabled
          class="mb-4"
        />
        <v-text-field
          v-model="fullName"
          label="Nome completo"
          variant="outlined"
          density="comfortable"
          autocomplete="name"
          class="mb-4"
        />
        <v-text-field
          v-model="phone"
          label="Telefone"
          variant="outlined"
          density="comfortable"
          autocomplete="tel"
          class="mb-4"
        />
        <v-switch
          v-model="sidebarCollapsed"
          label="Menu lateral retraído por defeito"
          color="primary"
          density="comfortable"
          hide-details
          class="mb-2"
        />
        <p class="text-caption text-medium-emphasis mb-4">
          Em ecrã largo, também podes recolher o menu pelo ícone do menu na barra superior; esta opção define o estado ao iniciar sessão.
        </p>
        <v-btn color="primary" rounded="lg" :loading="saving" @click="save"> Guardar </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>
