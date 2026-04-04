import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

import { patchMe } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEY = 'crm_theme_preference'

export type ThemePref = 'light' | 'dark' | 'system'

function isPref(v: string | undefined | null): v is ThemePref {
  return v === 'light' || v === 'dark' || v === 'system'
}

export function useThemePreference() {
  const vuetifyTheme = useTheme()
  const auth = useAuthStore()
  const preference = ref<ThemePref>('light')

  function apply() {
    const mode =
      preference.value === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : preference.value
    vuetifyTheme.change(mode)
  }

  function loadInitial() {
    if (auth.user?.theme_preference && isPref(auth.user.theme_preference)) {
      preference.value = auth.user.theme_preference
    } else {
      const s = localStorage.getItem(STORAGE_KEY)
      preference.value = isPref(s) ? s : 'light'
    }
    apply()
  }

  const themeIcon = computed(() => {
    if (preference.value === 'system') return 'mdi-brightness-auto'
    if (preference.value === 'dark') return 'mdi-weather-night'
    return 'mdi-weather-sunny'
  })

  let mql: MediaQueryList | null = null
  function onOsThemeChange() {
    if (preference.value === 'system') apply()
  }

  onMounted(() => {
    mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', onOsThemeChange)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', onOsThemeChange)
  })

  watch(
    () => auth.user?.theme_preference,
    (tp) => {
      if (tp && isPref(tp)) {
        preference.value = tp
        localStorage.setItem(STORAGE_KEY, tp)
        apply()
      }
    },
  )

  loadInitial()

  async function setPreference(p: ThemePref) {
    preference.value = p
    localStorage.setItem(STORAGE_KEY, p)
    apply()
    if (auth.token) {
      try {
        const u = await patchMe(auth.token, { theme_preference: p })
        auth.setUser(u)
      } catch {
        /* mantém preferência local */
      }
    }
  }

  return {
    preference,
    themeIcon,
    setPreference,
    loadInitial,
  }
}
