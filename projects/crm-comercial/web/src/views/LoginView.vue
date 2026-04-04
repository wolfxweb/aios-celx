<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('admin@example.com')
const password = ref('')
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  try {
    await auth.login(email.value.trim(), password.value)
    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/app'
    await router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro inesperado.'
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card rounded="lg" elevation="4">
          <v-card-title class="text-h6">Entrar</v-card-title>
          <v-card-subtitle>Use a conta de desenvolvimento da API</v-card-subtitle>
          <v-card-text>
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
              {{ error }}
            </v-alert>
            <v-form @submit.prevent="submit">
              <v-text-field
                v-model="email"
                label="E-mail"
                type="email"
                autocomplete="username"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model="password"
                label="Senha"
                type="password"
                autocomplete="current-password"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />
              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="auth.loading"
                rounded="lg"
              >
                Continuar
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
        <p class="text-caption text-center text-medium-emphasis mt-4">
          Demo: admin@example.com / admin123 (API em <code>http://127.0.0.1:8000</code>)
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>
