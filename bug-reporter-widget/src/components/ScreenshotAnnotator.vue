<template>
  <canvas
    ref="canvasRef"
    class="border rounded w-full"
    @mousedown="startDraw"
    @mousemove="draw"
    @mouseup="endDraw"
    @mouseleave="endDraw"
  ></canvas>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import html2canvas from 'html2canvas'

const props = defineProps<{
  color: string
  tool: 'pen' | 'rect'
  thickness: number
}>()

const emit = defineEmits<{
  (e: 'update:screenshot', dataUrl: string): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

const drawing = ref(false)
const startX = ref(0)
const startY = ref(0)
let history: ImageData[] = []
let baseImageData: ImageData | null = null

function getPointerPos(e: MouseEvent) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
  return { x, y }
}

function saveState() {
  if (!ctx.value || !canvasRef.value) return
  // store a copy
  const img = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  history.push(img)
}

function undo() {
  if (!ctx.value || !canvasRef.value) return
  if (history.length <= 1) {
    // restore initial image if present
    if (history.length === 1) {
      ctx.value.putImageData(history[0], 0, 0)
    }
    return
  }
  // drop last and restore previous
  history.pop()
  const last = history[history.length - 1]
  ctx.value.putImageData(last, 0, 0)
  emitScreenshot()
}

function emitScreenshot() {
  if (!canvasRef.value) return
  emit('update:screenshot', canvasRef.value.toDataURL('image/png'))
}

onMounted(async () => {
  await nextTick()

  // Hide the bug button if it exists
  // const bugBtn = document.querySelector('#bug-report-btn') as HTMLElement
  // if (bugBtn) bugBtn.style.display = 'none'

  // Use html2canvas to take screenshot of current page
  const screenshotCanvas = await html2canvas(document.body, {
    ignoreElements: (element) => {
      return element.classList?.contains('no-screenshot')
    }
  })

  // Restore button after screenshot
  // if (bugBtn) bugBtn.style.display = ''

  const canvas = canvasRef.value!
  ctx.value = canvas.getContext('2d')!
  canvas.width = screenshotCanvas.width
  canvas.height = screenshotCanvas.height
  ctx.value.drawImage(screenshotCanvas, 0, 0)

  // Save initial state
  saveState()
  emitScreenshot()

  // Keyboard shortcut listener
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  const isUndo =
    (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'
  if (isUndo) {
    e.preventDefault()
    undo()
  }
}

function startDraw(e: MouseEvent) {
  if (!ctx.value || !canvasRef.value) return
  const { x, y } = getPointerPos(e)
  drawing.value = true
  startX.value = x
  startY.value = y

  if (props.tool === 'pen') {
    ctx.value.beginPath()
    ctx.value.lineCap = 'round'
    ctx.value.moveTo(x, y)
    // save state so we can undo pen stroke
    saveState()
  } else {
    // rect: keep a copy of the current canvas as the base image
    baseImageData = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

function draw(e: MouseEvent) {
  if (!drawing.value || !ctx.value || !canvasRef.value) return
  const { x, y } = getPointerPos(e)

  if (props.tool === 'pen') {
    ctx.value.strokeStyle = props.color
    ctx.value.lineWidth = props.thickness
    ctx.value.lineTo(x, y)
    ctx.value.stroke()
    // keep path open; do not call beginPath/moveTo here because we want continuous stroke
  } else {
    // rect: restore base image (but do NOT mutate history) then draw the temporary rect
    if (baseImageData) {
      ctx.value.putImageData(baseImageData, 0, 0)
      ctx.value.strokeStyle = props.color
      ctx.value.lineWidth = props.thickness
      const w = x - startX.value
      const h = y - startY.value
      ctx.value.strokeRect(startX.value, startY.value, w, h)
    }
  }
}

function endDraw(e: MouseEvent) {
  if (!drawing.value || !ctx.value || !canvasRef.value) return
  drawing.value = false
  const { x, y } = getPointerPos(e)

  if (props.tool === 'pen') {
    ctx.value.closePath()
    // pen stroke already drawn on canvas; save final state
    saveState()
    emitScreenshot()
  } else {
    // rect: draw final rect on top of base image (baseImageData already used during draw),
    // then commit the new canvas snapshot into history
    if (baseImageData) {
      // ensure we remove temp and draw final rectangle on top of base
      ctx.value.putImageData(baseImageData, 0, 0)
      ctx.value.strokeStyle = props.color
      ctx.value.lineWidth = props.thickness
      ctx.value.strokeRect(startX.value, startY.value, x - startX.value, y - startY.value)
      // commit
      saveState()
      baseImageData = null
      emitScreenshot()
    }
  }
}

defineExpose({ undo })
</script>

<style scoped>
canvas {
  /* ensure canvas can shrink in layout but coordinate mapping handles scaling */
  max-width: 100%;
  height: auto;
  display: block;
}
</style>

