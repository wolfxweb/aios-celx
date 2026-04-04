import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { loginRequest, meRequest } from '@/api/client'
import type { UserPublic } from '@/api/types'

const TOKEN_KEY = 'crm_comercial_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<UserPublic | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))

  function setToken(t: string | null) {
    token.value = t
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const data = await loginRequest(email, password)
      setToken(data.accessToken)
      user.value = data.user
      return data
    } finally {
      loading.value = false
    }
  }

  async function restoreSession() {
    if (!token.value) return
    loading.value = true
    try {
      user.value = await meRequest(token.value)
    } catch {
      setToken(null)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  function logout() {
    setToken(null)
    user.value = null
  }

  function setUser(u: UserPublic) {
    user.value = u
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    restoreSession,
    setUser,
  }
})
