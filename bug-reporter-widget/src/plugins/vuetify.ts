import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import {
  VBtn,
  VBtnToggle,
  VCard,
  VCardActions,
  VCardText,
  VColorPicker,
  VDivider,
  VIcon,
  // VMenu,
  VSelect,
  VSpacer,
  VTextarea,
  VTextField,
  VToolbar,
} from 'vuetify/components'

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
  },
  components: {
    VBtn,
    VBtnToggle,
    VCard,
    VCardActions,
    VCardText,
    VColorPicker,
    VDivider,
    VIcon,
    // VMenu,
    VSelect,
    VSpacer,
    VTextField,
    VTextarea,
    VToolbar,
  },
  icons: {
    defaultSet: 'mdi',
  }
})
