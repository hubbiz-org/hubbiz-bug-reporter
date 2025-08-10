<template>
  <!-- Bug report button (vertical, hidden while modal is open) -->
  <v-btn
    v-if="!showModal"
    id="bug-report-btn"
    class="no-screenshot"
    min-height="auto"
    height="auto"
    variant="tonal"
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
      <div class="card-title-row" style="display: flex; align-items: center; padding: 8px 16px;">
        <v-icon
          class="drag-handle"
          style="cursor: move;"
          @mousedown.stop.prevent="startDrag"
        >
          mdi-cursor-move
        </v-icon>
        <span style="font-weight: 500;">Report Bug</span>
      </div>
      <v-toolbar
        dense
        flat
        color="grey-lighten-4"
      >
        <!-- Tool toggle -->
        <v-btn-toggle v-model="tool" tile dense mandatory>
          <v-btn value="pen" tile icon>
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn value="rect" tile icon>
            <v-icon>mdi-shape-rectangle-plus</v-icon>
          </v-btn>
        </v-btn-toggle>
        <v-divider vertical></v-divider>
        <!-- <v-menu :attach="true" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon>
              <v-icon>mdi-line-scan</v-icon>
            </v-btn>
          </template> -->
            <v-select
              v-model="thickness"
              item-title="label"
              item-value="value"
              hide-details
              flat
              tile
              :items="thicknessOptions"
              :menu-props="{ attach: 'body', zIndex: 20000 }"
            >
              <template #item="{ item, props }">
                <div v-bind="props" style="display: flex; align-items: center;">
                  <span style="width: 48px; height: 24px; display: flex; align-items: center;">
                    <svg width="48" height="24">
                      <line x1="4" y1="12" x2="44" y2="12" :stroke-width="item.value" stroke="black" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span style="margin-left: 8px;">{{ item.label }}</span>
                </div>
              </template>
              <template #selection="{ item }">
                <div style="display: flex; align-items: center;">
                  <span style="width: 48px; height: 24px; display: flex; align-items: center;">
                    <svg width="48" height="24">
                      <line x1="4" y1="12" x2="44" y2="12" :stroke-width="item.value" stroke="black" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span style="margin-left: 8px;">{{ item.label }}</span>
                </div>
              </template>
            </v-select>
        <!-- </v-menu> -->
        <!-- Color picker menu -->
        <v-menu :attach="true">
          <template #activator="{ props }">
            <v-btn v-bind="props" tile icon>
              <v-icon>mdi-palette</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-color-picker
              v-model="selectedColor"
              show-swatches
              :swatches="[
                // Blue
                ['#E3F2FD', '#90CAF9', '#42A5F5', '#1976D2', '#0D47A1'],
                // Red
                ['#FFEBEE', '#EF9A9A', '#E57373', '#E53935', '#B71C1C'],
                // Green
                ['#E8F5E9', '#A5D6A7', '#66BB6A', '#43A047', '#1B5E20'],
                // Purple
                ['#F3E5F5', '#CE93D8', '#AB47BC', '#8E24AA', '#4A148C'],
                // Orange
                ['#FFF3E0', '#FFB74D', '#FF9800', '#FFB300', '#F57C00'],
              ]"
              hide-inputs
              hide-canvas
              hide-sliders
              flat
            />
          </v-card>
        </v-menu>
        <v-divider vertical></v-divider>
        <v-btn tile icon @click="undo" :disabled="!screenshot">
          <v-icon>mdi-undo</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text>
        <v-text-field
          v-model="bugTitle"
          label="Bug title"
          variant="outlined"
          density="compact"
        />
        <v-textarea
          v-model="bugDescription"
          label="Description"
          variant="outlined"
          density="compact"
          class="mt-2"
          rows="3"
        />
      </v-card-text>
      <v-divider/>
      <v-card-actions class="d-flex gap-2">
        <v-btn style="flex: 1;" variant="tonal" color="error" @click="closeModal">Cancel</v-btn>
        <v-btn style="flex: 1;" variant="flat" color="success" @click="submitBugReport">Submit</v-btn>
      </v-card-actions>
      <v-divider/>
      <div class="text-center my-1" style="font-size: 12px; color: #888;">
        Powered by <a href="https://www.hubbiz.be" target="_blank" style="color: #888; text-decoration: underline;">Hubbiz</a>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
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
  { value: 4, label: 'Medium' },
  { value: 6, label: 'Thick' },
  { value: 8, label: 'Extra Thick' },
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
  showModal.value = false
  modalPos.value = { right: 24, bottom: 24 }
}
</script>

<style scoped>
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
</style>
