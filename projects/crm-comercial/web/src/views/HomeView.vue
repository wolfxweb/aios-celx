<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { submitPublicContact } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const cName = ref('')
const cEmail = ref('')
const cMessage = ref('')
const cConsent = ref(false)
const contactLoading = ref(false)
const contactError = ref<string | null>(null)
const contactOk = ref(false)

function goLogin() {
  void router.push({ name: 'login' })
}

function goApp() {
  void router.push({ name: 'app' })
}

async function sendContact() {
  contactError.value = null
  contactOk.value = false
  if (!cConsent.value) {
    contactError.value = 'Aceite o consentimento para podermos responder.'
    return
  }
  contactLoading.value = true
  try {
    await submitPublicContact({
      name: cName.value.trim(),
      email: cEmail.value.trim(),
      message: cMessage.value.trim(),
      consent: true,
    })
    contactOk.value = true
    cName.value = ''
    cEmail.value = ''
    cMessage.value = ''
    cConsent.value = false
  } catch (e) {
    contactError.value = e instanceof Error ? e.message : 'Não foi possível enviar.'
  } finally {
    contactLoading.value = false
  }
}
</script>

<template>
  <v-container class="home-page py-12">
    <v-row justify="center">
      <v-col cols="12" xl="10">
        <section class="hero-shell mb-10">
          <div class="hero-orb hero-orb-one" />
          <div class="hero-orb hero-orb-two" />
          <div class="hero-copy">
            <div class="hero-badges mb-4">
              <v-chip color="primary" variant="flat" rounded="pill" size="small">CRM comercial</v-chip>
              <v-chip variant="tonal" rounded="pill" size="small">Leads, pipeline e operação</v-chip>
            </div>
            <h1 class="text-h4 text-md-h3 text-xl-h2 font-weight-medium mb-4">
              Controle a operação comercial com mais contexto, ritmo e previsibilidade.
            </h1>
            <p class="text-body-1 text-medium-emphasis mb-4 hero-lead">
              O CRM AIOS-CELX reúne leads, empresas, contatos, oportunidades, tarefas,
              atividades e relatórios em uma única operação, para o time trabalhar melhor e a
              gestão acompanhar o funil com mais clareza.
            </p>
            <p class="text-body-2 text-medium-emphasis mb-6">
              Em vez de informação espalhada, a equipa passa a ter pipeline, histórico de
              relacionamento, pendências e visão gerencial no mesmo sistema.
            </p>

            <div class="hero-points mb-6">
              <div class="hero-point">
                <strong>Painel operacional</strong>
                <span>Resumo rápido do funil, das prioridades e da atividade comercial.</span>
              </div>
              <div class="hero-point">
                <strong>Histórico rastreável</strong>
                <span>Leads, contatos, empresas, oportunidades e interações ligados entre si.</span>
              </div>
              <div class="hero-point">
                <strong>Execução com acompanhamento</strong>
                <span>Tarefas, atividades e relatórios para transformar rotina em operação.</span>
              </div>
            </div>

            <div v-if="!auth.isAuthenticated" class="hero-actions">
              <v-btn color="primary" size="large" rounded="xl" class="hero-primary-btn" @click="goLogin">
                Entrar no CRM
              </v-btn>
              <v-btn
                variant="outlined"
                size="large"
                rounded="xl"
                class="hero-secondary-btn"
                @click="() => document.getElementById('crm-contact')?.scrollIntoView({ behavior: 'smooth' })"
              >
                Pedir contacto
              </v-btn>
            </div>
            <div v-else class="hero-actions">
              <v-btn color="primary" size="large" rounded="xl" class="hero-primary-btn" @click="goApp">
                Abrir painel
              </v-btn>
              <span class="text-body-2 text-medium-emphasis">
                Sessão ativa para continuar a operação no painel autenticado.
              </span>
            </div>
          </div>

          <v-card class="hero-side" rounded="xl" variant="tonal">
            <v-card-title class="text-h6">O que o CRM organiza</v-card-title>
            <v-card-text>
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Captação</span>
                  <strong>Leads</strong>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Relacionamento</span>
                  <strong>Empresas e contatos</strong>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Pipeline</span>
                  <strong>Oportunidades</strong>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Execução</span>
                  <strong>Tarefas e atividades</strong>
                </div>
              </div>
              <p class="text-body-2 text-medium-emphasis mt-4 mb-0">
                O foco do produto é dar visibilidade ao funil e estruturar a rotina comercial sem
                perder contexto ao longo do processo.
              </p>
            </v-card-text>
          </v-card>
        </section>

        <div v-if="auth.isAuthenticated && auth.user" class="mb-6">
          <v-alert type="success" variant="tonal" border="start">
            Sessão ativa como <strong>{{ auth.user.email }}</strong>
          </v-alert>
        </div>

        <v-row class="mt-2 mb-6" dense>
          <v-col cols="12" md="4">
            <v-card variant="tonal" rounded="xl" class="fill-height feature-card premium-card">
              <v-card-title class="text-h6">Pipeline e oportunidades</v-card-title>
              <v-card-text class="text-medium-emphasis">
                Acompanhe oportunidades por pipeline, etapa, valor, probabilidade e previsão de
                fechamento para priorizar negociações com mais critério.
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card variant="tonal" rounded="xl" class="fill-height feature-card premium-card">
              <v-card-title class="text-h6">Leads, empresas e contatos</v-card-title>
              <v-card-text class="text-medium-emphasis">
                Mantenha a base comercial organizada com relacionamento entre entidades, tags e
                histórico por registo em cada conta.
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card variant="tonal" rounded="xl" class="fill-height feature-card premium-card">
              <v-card-title class="text-h6">Tarefas, atividades e relatórios</v-card-title>
              <v-card-text class="text-medium-emphasis">
                Registre execuções do time, acompanhe pendências e extraia leitura gerencial da
                operação comercial.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card variant="outlined" rounded="xl" class="mb-10 premium-outline-card">
          <v-card-title class="text-h6">Funcionalidades já disponíveis</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12" md="6">
                <ul class="feature-list">
                  <li>Dashboard com resumo operacional do funil</li>
                  <li>Gestão de leads com qualificação e score</li>
                  <li>Empresas e contatos vinculados ao processo comercial</li>
                  <li>Oportunidades com pipeline e mudança de etapa</li>
                </ul>
              </v-col>
              <v-col cols="12" md="6">
                <ul class="feature-list">
                  <li>Tarefas e atividades ligadas às entidades do CRM</li>
                  <li>Tags para organização e segmentação</li>
                  <li>Relatórios para leitura gerencial</li>
                  <li>Administração de utilizadores e preferências</li>
                </ul>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card variant="tonal" rounded="xl" class="mb-10 cta-band">
          <v-card-text class="d-flex flex-column flex-md-row align-md-center justify-space-between ga-4">
            <div>
              <p class="text-overline text-primary font-weight-bold mb-1">Operação comercial</p>
              <h2 class="text-h6 mb-2">Uma base única para acompanhar funil, relacionamento e execução.</h2>
              <p class="text-body-2 text-medium-emphasis mb-0">
                O CRM foi desenhado para o time comercial operar com mais consistência e para a
                gestão acompanhar o pipeline com mais confiança.
              </p>
            </div>
            <div class="hero-actions">
              <v-btn color="primary" rounded="xl" @click="auth.isAuthenticated ? goApp() : goLogin()">
                {{ auth.isAuthenticated ? 'Abrir painel' : 'Entrar agora' }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-divider class="my-10" />

        <section id="crm-contact">
          <div class="contact-shell">
            <div class="contact-copy">
              <p class="text-overline text-primary font-weight-bold mb-2">Contacto</p>
              <h2 class="text-h5 mb-3">Peça uma demonstração ou envie o contexto da sua operação.</h2>
              <p class="text-body-2 text-medium-emphasis mb-4">
                Se quiser avaliar o CRM para o seu processo comercial, envie uma mensagem com o
                cenário da equipa, o tipo de funil e o que precisa de acompanhar com mais clareza.
              </p>
              <div class="contact-notes">
                <div class="contact-note">
                  <strong>Pedido simples</strong>
                  <span>O envio é feito sem iniciar sessão.</span>
                </div>
                <div class="contact-note">
                  <strong>Resposta organizada</strong>
                  <span>Os dados seguem para a API pública do CRM.</span>
                </div>
              </div>
            </div>

            <v-card class="contact-card" rounded="xl" variant="outlined">
              <v-card-text>
                <v-alert v-if="contactOk" type="success" variant="tonal" class="mb-4" density="compact">
                  Pedido enviado. Obrigado.
                </v-alert>
                <v-alert v-if="contactError" type="error" variant="tonal" class="mb-4" density="compact">
                  {{ contactError }}
                </v-alert>

                <v-form @submit.prevent="sendContact" class="max-width-form">
                  <v-text-field
                    v-model="cName"
                    label="Nome"
                    variant="outlined"
                    density="comfortable"
                    class="mb-2"
                    required
                  />
                  <v-text-field
                    v-model="cEmail"
                    label="E-mail"
                    type="email"
                    variant="outlined"
                    density="comfortable"
                    class="mb-2"
                    required
                  />
                  <v-textarea
                    v-model="cMessage"
                    label="Mensagem"
                    variant="outlined"
                    rows="3"
                    class="mb-2"
                    required
                  />
                  <v-checkbox
                    v-model="cConsent"
                    label="Autorizo o contacto comercial relativamente a este pedido."
                    density="compact"
                    hide-details="auto"
                    class="mb-4"
                  />
                  <v-btn
                    type="submit"
                    color="primary"
                    rounded="xl"
                    block
                    :loading="contactLoading"
                    :disabled="contactLoading"
                  >
                    Enviar pedido
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </div>
        </section>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.home-page {
  position: relative;
}

.hero-shell {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(19rem, 0.9fr);
  gap: 1.75rem;
  align-items: stretch;
  padding: 2rem;
  border-radius: 2rem;
  background:
    radial-gradient(circle at top left, rgba(var(--v-theme-primary), 0.18), transparent 28rem),
    linear-gradient(145deg, rgba(var(--v-theme-surface), 0.96), rgba(var(--v-theme-surface-bright), 0.82));
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.08);
}

.hero-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(10px);
  opacity: 0.48;
  pointer-events: none;
}

.hero-orb-one {
  width: 14rem;
  height: 14rem;
  top: -4rem;
  right: 18rem;
  background: rgba(var(--v-theme-primary), 0.18);
}

.hero-orb-two {
  width: 10rem;
  height: 10rem;
  right: -2rem;
  bottom: 1rem;
  background: rgba(var(--v-theme-secondary), 0.12);
}

.hero-copy {
  position: relative;
  z-index: 1;
  padding: 0.5rem 0;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hero-lead {
  max-width: 50rem;
}

.hero-points {
  display: grid;
  gap: 0.9rem;
}

.hero-point {
  display: grid;
  gap: 0.2rem;
}

.hero-point span {
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.hero-primary-btn {
  min-width: 10.5rem;
  box-shadow: 0 16px 36px rgba(var(--v-theme-primary), 0.22);
}

.hero-secondary-btn {
  backdrop-filter: blur(10px);
}

.hero-side {
  position: relative;
  z-index: 1;
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  background: rgba(var(--v-theme-surface), 0.76);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.stat-card {
  padding: 0.95rem;
  border-radius: 1rem;
  background: rgba(var(--v-theme-surface-bright), 0.82);
  border: 1px solid rgba(var(--v-theme-outline), 0.14);
  display: grid;
  gap: 0.2rem;
}

.stat-label {
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.62);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.feature-card {
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.premium-card {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface-bright), 0.88), rgba(var(--v-theme-surface), 0.96));
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.05);
}

.premium-outline-card {
  border: 1px solid rgba(var(--v-theme-outline), 0.14);
  background: rgba(var(--v-theme-surface), 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.04);
}

.cta-band {
  background:
    linear-gradient(140deg, rgba(var(--v-theme-primary), 0.1), rgba(var(--v-theme-surface), 0.94));
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.max-width-form {
  max-width: 32rem;
}

.feature-list {
  margin: 0;
  padding-left: 1.1rem;
  color: rgba(var(--v-theme-on-surface), 0.78);
  display: grid;
  gap: 0.7rem;
}

.contact-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 32rem);
  gap: 1.5rem;
  align-items: start;
}

.contact-copy {
  padding-top: 0.25rem;
}

.contact-notes {
  display: grid;
  gap: 0.85rem;
}

.contact-note {
  display: grid;
  gap: 0.18rem;
}

.contact-note span {
  color: rgba(var(--v-theme-on-surface), 0.66);
}

.contact-card {
  background: rgba(var(--v-theme-surface), 0.96);
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.05);
}

@media (max-width: 960px) {
  .hero-shell {
    grid-template-columns: 1fr;
    padding: 1.35rem;
  }

  .contact-shell {
    grid-template-columns: 1fr;
  }
}
</style>
