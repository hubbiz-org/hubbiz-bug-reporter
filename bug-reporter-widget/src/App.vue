<template>
  <!-- Bug report button (vertical, hidden while modal is open) -->
  <Transition name="fade-btn">
    <v-btn
      v-if="!showModal"
      id="bug-report-btn"
      class="no-screenshot btn-elevated"
      min-height="auto"
      height="auto"
      variant="tonal"
      min-width="0"
      :color="props.btnColor"
      :style="{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%) rotate(180deg)',
        writingMode: 'vertical-rl',
        zIndex: 9999,
      }"
      @click="showModal = true"
    >
      <span class="py-3">{{ props.btnText }}</span>
    </v-btn>
  </Transition>

  <!-- Fullscreen Screenshot Annotator Overlay -->
  <div
    v-if="showModal"
    class="screenshot-overlay"
  >
    <div class="annotator-wrapper">
      <ScreenshotAnnotator
        ref="annotatorRef"
        style="width: 100vw; height: 100vh;"
        :thickness="thickness"
        :color="selectedColor"
        :tool="tool"
        @update:screenshot="screenshot = $event"
      />
    </div>
  </div>

  <!-- Draggable Custom Modal in Bottom Right (outside overlay, not in screenshot) -->
  <Transition name="fade-modal">
    <div
      v-if="showModal"
      class="custom-modal no-screenshot"
      :style="{
        right: modalPos.right + 'px',
        bottom: modalPos.bottom + 'px',
        position: 'fixed',
        zIndex: 10000,
        width: '350px',
        cursor: dragging ? 'move' : 'default'
      }"
    >
      <v-card elevation="14">
        <v-toolbar :color="props.btnColor">
          <template v-slot:prepend>
            <v-icon
              class="drag-handle ml-2"
              style="cursor: move;"
              @mousedown.stop.prevent="startDrag"
            >
              mdi-cursor-move
            </v-icon>
          </template>
          <v-toolbar-title style="font-weight: 500;">Report Bug</v-toolbar-title>
        </v-toolbar>
        <v-toolbar
          density="compact"
          flat
          color="grey-lighten-4"
        >
          <!-- Tool toggle -->
          <v-btn-toggle v-model="tool" tile mandatory>
            <v-btn value="pen" tile icon>
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn value="rect" tile icon>
              <v-icon>mdi-shape-rectangle-plus</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-divider vertical></v-divider>
          <v-select
            v-model="thickness"
            item-title="label"
            item-value="value"
            density="comfortable"
            variant="solo"
            hide-details
            flat
            tile
            :items="thicknessOptions"
            :menu-props="{ attach: 'body', zIndex: 20000 }"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props" title="">
                <div style="display: flex; align-items: center;" class="px-2">
                  <span style="width: 48px; height: 24px; display: flex; align-items: center;">
                    <svg width="48" height="24">
                      <line x1="4" y1="12" x2="44" y2="12" :stroke-width="item.value" stroke="black" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span style="margin-left: 8px;">{{ item.raw.label }}</span>
                </div>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <div style="display: flex; align-items: center;">
                <span style="width: 48px; height: 24px; display: flex; align-items: center;">
                  <svg width="48" height="24">
                    <line x1="4" y1="12" x2="44" y2="12" :stroke-width="item.value" stroke="black" stroke-linecap="round"/>
                  </svg>
                </span>
              </div>
            </template>
          </v-select>
          <!-- Color picker menu -->
          <v-menu :attach="true">
            <template #activator="{ props }">
              <v-btn v-bind="props" tile icon variant="tonal" :color="selectedColor">
                <v-icon>mdi-palette</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-color-picker
                v-model="selectedColor"
                show-swatches
                :swatches="[
                  // Blue
                  ['#BBDEFB', '#64B5F6', '#1E88E5', '#1565C0', '#0D47A1'],
                  // Red
                  ['#FFCDD2', '#E57373', '#E53935', '#C62828', '#B71C1C'],
                  // Green
                  ['#C8E6C9', '#81C784', '#43A047', '#2E7D32', '#1B5E20'],
                  // Purple
                  ['#D1C4E9', '#9575CD', '#5E35B1', '#4527A0', '#311B92'],
                  // Orange
                  ['#FFE0B2', '#FFB74D', '#FB8C00', '#EF6C00', '#E65100'],
                ]"
                hide-inputs
                hide-canvas
                hide-sliders
                flat
              />
            </v-card>
          </v-menu>
          <v-divider vertical></v-divider>
          <v-btn tile icon class="mr-0" :disabled="!screenshot" @click="undo" >
            <v-icon>mdi-undo</v-icon>
          </v-btn>
        </v-toolbar>
        <v-divider/>
        <v-card-text>
          <v-text-field
            v-model="bugTitle"
            label="Title"
            variant="outlined"
            density="compact"
            class="mt-2"
          />
          <v-textarea
            v-model="bugDescription"
            label="Description"
            variant="outlined"
            density="compact"
            class="mt-1"
            rows="3"
            auto-grow
            max-rows="6"
            counter
            persistent-counter
            no-resize
          />
        </v-card-text>
        <v-divider/>
        <v-card-actions class="d-flex gap-2">
          <v-btn style="flex: 1;" variant="tonal" color="error" @click="closeModal">Cancel</v-btn>
          <v-btn style="flex: 1;" variant="flat" color="success" @click="submitBugReport">Submit</v-btn>
        </v-card-actions>
        <div class="text-center mt-1 py-1" style="font-size: 12px; background-color: #363636; color: #e6e6e6">
          Powered by
          <a href="https://www.hubbiz.be" target="_blank" style="display: inline-block; vertical-align: middle;">
            <img :src="hubbizLogo" alt="Hubbiz" style="height: 12px; margin-left: 6px;" />
          </a>
        </div>
      </v-card>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import hubbizLogo from '@/assets/hubbiz-logo-light.png'
import ScreenshotAnnotator from '@/components/ScreenshotAnnotator.vue'

interface Props {
  btnText: string
  btnColor: string
}
const props = defineProps<Props>()

const showModal = ref(false)
const bugTitle = ref('')
const bugDescription = ref('')
const selectedColor = ref('#ff0000')
const tool = ref<'pen' | 'rect'>('pen')
const thickness = ref(4)
const screenshot = ref<string | null>(null)
const annotatorRef = ref<InstanceType<typeof ScreenshotAnnotator> | null>(null)

const thicknessOptions = [
  { value: 2, label: 'Thin' },
  { value: 4, label: 'Normal' },
  { value: 6, label: 'Medium' },
  { value: 8, label: 'Thick' },
]

// --- Draggable modal state ---
const modalPos = ref({ right: 24, bottom: 24 })
const dragging = ref(false)
let dragStart = { x: 0, y: 0, right: 24, bottom: 24 }

function startDrag(e: MouseEvent) {
  dragging.value = true
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    right: modalPos.value.right,
    bottom: modalPos.value.bottom
  }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!dragging.value) return
  const dx = dragStart.x - e.clientX
  const dy = dragStart.y - e.clientY
  modalPos.value.right = Math.max(0, dragStart.right + dx)
  modalPos.value.bottom = Math.max(0, dragStart.bottom + dy)
}

function stopDrag() {
  dragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

onMounted(() => {
  window.addEventListener('mouseup', stopDrag)
})
onBeforeUnmount(() => {
  window.removeEventListener('mouseup', stopDrag)
})

function undo() {
  annotatorRef.value?.undo()
}

function closeModal() {
  showModal.value = false
  // Reset modal position for next open
  modalPos.value = { right: 24, bottom: 24 }
}

function submitBugReport() {
  const meta = {
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewPort: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  }
  alert('Bug report submitted!')
  const body = {
    name: bugTitle.value,
    description: bugDescription.value,
    meta,
    screenshot: screenshot.value
  }
  console.dir(body)
  if (screenshot.value) {
    console.log('%c ', `font-size:1px; padding:60px 120px; background:url(${screenshot.value}) no-repeat; background-size:contain;`);
  }
  showModal.value = false
  modalPos.value = { right: 24, bottom: 24 }
}
</script>

<style scoped>
.fade-btn-enter-active,
.fade-btn-leave-active {
  transition: opacity 0.25s, transform 0.1s;
}
.fade-btn-enter-from,
.fade-btn-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.98);
}
.fade-btn-enter-to,
.fade-btn-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
.fade-modal-enter-to,
.fade-modal-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.screenshot-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.15);
  pointer-events: none;
}
.annotator-wrapper {
  width: 100vw;
  height: 100vh;
  pointer-events: auto;
  position: fixed;
  inset: 0;
}
.custom-modal {
  position: fixed;
  width: 350px;
  pointer-events: auto;
}
.drag-handle {
  cursor: move;
  user-select: none;
}
.btn-elevated {
  box-shadow: 4px 0 16px rgba(0,0,0,0.30)
}
</style>
