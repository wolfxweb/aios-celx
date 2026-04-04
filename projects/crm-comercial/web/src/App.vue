<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import GlobalSearchBar from '@/components/GlobalSearchBar.vue'
import { patchMe } from '@/api/client'
import { useThemePreference } from '@/composables/useThemePreference'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { preference, setPreference, loadInitial } = useThemePreference()

const display = useDisplay()
const mobile = computed(() => display.mobile.value)
/** Painel lateral visível (mobile: gaveta; desktop: sempre visível com ou sem rail). */
const drawer = ref(false)
/** Desktop: menu estreito só com ícones (rail). Sincronizado com `sidebar_collapsed_default` no servidor. */
const railCollapsed = ref(false)

const isRail = computed(() => !mobile.value && railCollapsed.value)

watch(
  mobile,
  (m) => {
    drawer.value = !m
  },
  { immediate: true },
)

watch(
  () => auth.user?.sidebar_collapsed_default,
  (v) => {
    if (typeof v === 'boolean') {
      railCollapsed.value = v
    }
  },
  { immediate: true },
)

const route = useRoute()
const router = useRouter()

watch(
  () => route.fullPath,
  () => {
    if (mobile.value) drawer.value = false
  },
)

onMounted(async () => {
  await auth.restoreSession()
  loadInitial()
})

function goLogin() {
  void router.push({ name: 'login' })
}

function goHome() {
  void router.push({ name: 'home' })
}

function handleLogout() {
  auth.logout()
  void router.push({ name: 'home' })
}

function onNavIconClick() {
  if (mobile.value) {
    drawer.value = !drawer.value
    return
  }
  void toggleSidebarRail()
}

async function toggleSidebarRail() {
  if (mobile.value) return
  railCollapsed.value = !railCollapsed.value
  if (!auth.token || !auth.user) return
  try {
    const u = await patchMe(auth.token, {
      sidebar_collapsed_default: railCollapsed.value,
    })
    auth.setUser(u)
  } catch {
    /* mantém estado local mesmo se PATCH falhar */
  }
}
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-if="auth.isAuthenticated && auth.user"
      v-model="drawer"
      :temporary="mobile"
      :permanent="!mobile"
      :rail="isRail"
      expand-on-hover
      width="260"
    >
      <v-list density="comfortable" nav class="pa-2">
        <v-list-subheader v-if="!isRail" class="text-high-emphasis">Navegação</v-list-subheader>
        <v-list-item :to="{ name: 'app' }" title="Painel" prepend-icon="mdi-view-dashboard-outline" rounded="lg" />
        <v-list-item :to="{ name: 'leads' }" title="Leads" prepend-icon="mdi-account-arrow-right-outline" rounded="lg" />
        <v-list-item
          :to="{ name: 'opportunities' }"
          title="Oportunidades"
          prepend-icon="mdi-briefcase-outline"
          rounded="lg"
        />
        <v-list-item :to="{ name: 'tasks' }" title="Tarefas" prepend-icon="mdi-checkbox-marked-circle-outline" rounded="lg" />
        <v-list-item :to="{ name: 'activities' }" title="Atividades" prepend-icon="mdi-timeline-text-outline" rounded="lg" />
        <v-list-item :to="{ name: 'companies' }" title="Empresas" prepend-icon="mdi-office-building-outline" rounded="lg" />
        <v-list-item :to="{ name: 'contacts' }" title="Contatos" prepend-icon="mdi-account-multiple-outline" rounded="lg" />
        <v-list-item :to="{ name: 'tags' }" title="Tags" prepend-icon="mdi-tag-outline" rounded="lg" />
        <v-list-item :to="{ name: 'reports' }" title="Relatórios" prepend-icon="mdi-chart-box-outline" rounded="lg" />
        <v-list-item :to="{ name: 'profile' }" title="Perfil" prepend-icon="mdi-account-cog-outline" rounded="lg" />
        <v-list-item
          v-if="auth.user.is_admin"
          :to="{ name: 'users-admin' }"
          title="Administração"
          prepend-icon="mdi-shield-account-outline"
          rounded="lg"
        />

        <v-divider class="my-3 border-opacity-25" />

        <v-menu location="end" :close-on-content-click="true">
          <template #activator="{ props: themeMenuProps }">
            <v-list-item
              v-bind="themeMenuProps"
              rounded="lg"
              prepend-icon="mdi-palette-outline"
              title="Tema"
              :append-icon="isRail ? undefined : 'mdi-chevron-down'"
            />
          </template>
          <v-list density="compact" min-width="220">
            <v-list-subheader class="text-high-emphasis">Escolher tema</v-list-subheader>
            <v-list-item @click="() => void setPreference('system')">
              <template #prepend><v-icon size="small">mdi-brightness-auto</v-icon></template>
              <v-list-item-title>Automático</v-list-item-title>
              <template v-if="preference === 'system'" #append>
                <v-icon size="small" color="primary">mdi-check</v-icon>
              </template>
            </v-list-item>
            <v-list-item @click="() => void setPreference('light')">
              <template #prepend><v-icon size="small">mdi-weather-sunny</v-icon></template>
              <v-list-item-title>Claro</v-list-item-title>
              <template v-if="preference === 'light'" #append>
                <v-icon size="small" color="primary">mdi-check</v-icon>
              </template>
            </v-list-item>
            <v-list-item @click="() => void setPreference('dark')">
              <template #prepend><v-icon size="small">mdi-weather-night</v-icon></template>
              <v-list-item-title>Escuro</v-list-item-title>
              <template v-if="preference === 'dark'" #append>
                <v-icon size="small" color="primary">mdi-check</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider class="my-3 border-opacity-25" />

        <div v-if="auth.user && !isRail" class="px-3 py-1 text-caption text-medium-emphasis text-truncate">
          {{ auth.user.full_name }}
        </div>
        <v-list-item
          rounded="lg"
          prepend-icon="mdi-logout"
          title="Sair"
          class="text-error"
          @click="handleLogout"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="surface" elevation="1" density="comfortable" class="border-b">
      <v-app-bar-nav-icon
        v-if="auth.isAuthenticated && auth.user"
        :aria-label="
          mobile ? (drawer ? 'Fechar menu' : 'Abrir menu') : railCollapsed ? 'Expandir menu' : 'Recolher menu'
        "
        @click="onNavIconClick"
      />
      <v-app-bar-title class="cursor-pointer text-primary font-weight-medium" @click="goHome">CRM AIOS-CELX</v-app-bar-title>
      <v-spacer />
      <GlobalSearchBar v-if="auth.isAuthenticated && auth.token" class="mx-2" />
      <v-menu v-if="!auth.isAuthenticated || !auth.user" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn
            variant="text"
            class="text-medium-emphasis"
            v-bind="menuProps"
            append-icon="mdi-chevron-down"
            aria-haspopup="menu"
            :aria-label="'Tema: ' + preference"
          >
            Tema
          </v-btn>
        </template>
        <v-list density="compact" min-width="220">
          <v-list-subheader class="text-high-emphasis">Escolher tema</v-list-subheader>
          <v-list-item @click="() => void setPreference('system')">
            <template #prepend><v-icon size="small">mdi-brightness-auto</v-icon></template>
            <v-list-item-title>Automático</v-list-item-title>
            <template v-if="preference === 'system'" #append>
              <v-icon size="small" color="primary">mdi-check</v-icon>
            </template>
          </v-list-item>
          <v-list-item @click="() => void setPreference('light')">
            <template #prepend><v-icon size="small">mdi-weather-sunny</v-icon></template>
            <v-list-item-title>Claro</v-list-item-title>
            <template v-if="preference === 'light'" #append>
              <v-icon size="small" color="primary">mdi-check</v-icon>
            </template>
          </v-list-item>
          <v-list-item @click="() => void setPreference('dark')">
            <template #prepend><v-icon size="small">mdi-weather-night</v-icon></template>
            <v-list-item-title>Escuro</v-list-item-title>
            <template v-if="preference === 'dark'" #append>
              <v-icon size="small" color="primary">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn v-if="!auth.isAuthenticated" variant="text" class="text-medium-emphasis" @click="goLogin">Entrar</v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
