import { createApp, h } from 'vue'
import { vuetify } from '@/plugins/vuetify'
import BugReporterWidget from './App.vue'

// Styles
// import 'unfonts.css'

declare global {
  interface Window {
    BugReporterWidget: {
      init: (options?: WidgetOptions) => void
    }
  }
}

interface WidgetOptions {
  btnText?: string
  btnColor?: string
}

window.BugReporterWidget = {
  init(options: WidgetOptions = {}) {
    let container = document.getElementById("hubbiz-bug-reporter-widget")
    if (!container) {
      container = document.createElement('div')
      container.id = 'hubbiz-bug-reporter-widget'
      document.body.appendChild(container)
    }

    const app = createApp({
      render: () =>
        h(BugReporterWidget, {
          btnText: options.btnText ?? 'Report Bug',
          btnColor: options.btnColor ?? '#4527A0',
        }),
    })

    app.use(vuetify)

    app.mount(container)
  },
}

// const app = createApp(App)
// app.mount('#app')
