import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import ActivitiesListView from '@/views/ActivitiesListView.vue'
import AppDashboardView from '@/views/AppDashboardView.vue'
import CompaniesListView from '@/views/CompaniesListView.vue'
import CompanyDetailView from '@/views/CompanyDetailView.vue'
import ContactsListView from '@/views/ContactsListView.vue'
import ContactDetailView from '@/views/ContactDetailView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import LeadDetailView from '@/views/LeadDetailView.vue'
import LeadsListView from '@/views/LeadsListView.vue'
import OpportunitiesListView from '@/views/OpportunitiesListView.vue'
import OpportunityDetailView from '@/views/OpportunityDetailView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ReportsView from '@/views/ReportsView.vue'
import TagsListView from '@/views/TagsListView.vue'
import TasksListView from '@/views/TasksListView.vue'
import UsersAdminView from '@/views/UsersAdminView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Início' } },
    { path: '/login', name: 'login', component: LoginView, meta: { title: 'Entrar' } },
    {
      path: '/app',
      name: 'app',
      component: AppDashboardView,
      meta: { title: 'Painel', requiresAuth: true },
    },
    {
      path: '/app/leads',
      name: 'leads',
      component: LeadsListView,
      meta: { title: 'Leads', requiresAuth: true },
    },
    {
      path: '/app/leads/:id',
      name: 'lead-detail',
      component: LeadDetailView,
      meta: { title: 'Lead', requiresAuth: true },
    },
    {
      path: '/app/opportunities',
      name: 'opportunities',
      component: OpportunitiesListView,
      meta: { title: 'Oportunidades', requiresAuth: true },
    },
    {
      path: '/app/opportunities/:id',
      name: 'opportunity-detail',
      component: OpportunityDetailView,
      meta: { title: 'Oportunidade', requiresAuth: true },
    },
    {
      path: '/app/tasks',
      name: 'tasks',
      component: TasksListView,
      meta: { title: 'Tarefas', requiresAuth: true },
    },
    {
      path: '/app/activities',
      name: 'activities',
      component: ActivitiesListView,
      meta: { title: 'Atividades', requiresAuth: true },
    },
    {
      path: '/app/companies',
      name: 'companies',
      component: CompaniesListView,
      meta: { title: 'Empresas', requiresAuth: true },
    },
    {
      path: '/app/companies/:id',
      name: 'company-detail',
      component: CompanyDetailView,
      meta: { title: 'Empresa', requiresAuth: true },
    },
    {
      path: '/app/contacts',
      name: 'contacts',
      component: ContactsListView,
      meta: { title: 'Contatos', requiresAuth: true },
    },
    {
      path: '/app/contacts/:id',
      name: 'contact-detail',
      component: ContactDetailView,
      meta: { title: 'Contato', requiresAuth: true },
    },
    {
      path: '/app/reports',
      name: 'reports',
      component: ReportsView,
      meta: { title: 'Relatórios', requiresAuth: true },
    },
    {
      path: '/app/tags',
      name: 'tags',
      component: TagsListView,
      meta: { title: 'Tags', requiresAuth: true },
    },
    {
      path: '/app/users',
      name: 'users-admin',
      component: UsersAdminView,
      meta: { title: 'Administração', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/app/profile',
      name: 'profile',
      component: ProfileView,
      meta: { title: 'Perfil', requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to: RouteLocationNormalized) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth) {
    if (!auth.token) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (!auth.user) {
      await auth.restoreSession()
    }
    if (!auth.user) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }
  if (to.meta.requiresAdmin && !auth.user?.is_admin) {
    return { name: 'app' }
  }
  return true
})

router.afterEach((to: RouteLocationNormalized) => {
  const base = 'CRM AIOS-CELX'
  document.title = to.meta.title ? `${base} — ${String(to.meta.title)}` : base
})

export default router
