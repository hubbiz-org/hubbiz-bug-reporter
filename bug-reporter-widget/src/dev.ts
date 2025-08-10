import { createApp, h } from 'vue'
import { vuetify } from '@/plugins/vuetify'
import BugReporterWidget from './App.vue'

const app = createApp({
  render: () =>
    h(BugReporterWidget, {
      btnText: 'Report Bug (Dev Mode)',
      btnColor: '#4527A0',
    }),
})

app.use(vuetify)
app.mount('#app')
