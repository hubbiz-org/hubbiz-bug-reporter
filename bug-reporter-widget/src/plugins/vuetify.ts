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
  VListItem,
  VMenu,
  VSelect,
  VSpacer,
  VTextarea,
  VTextField,
  VToolbar,
  VToolbarTitle,
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
    VListItem,
    VMenu,
    VSelect,
    VSpacer,
    VTextField,
    VTextarea,
    VToolbar,
    VToolbarTitle,
  },
  icons: {
    defaultSet: 'mdi',
  }
})
