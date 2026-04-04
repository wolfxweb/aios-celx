import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { pt } from 'vuetify/locale'
import 'vuetify/styles'

export default createVuetify({
  locale: {
    locale: 'pt',
    fallback: 'en',
    messages: { pt },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1565c0',
          secondary: '#424242',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#90caf9',
          secondary: '#b0bec5',
        },
      },
    },
  },
})
