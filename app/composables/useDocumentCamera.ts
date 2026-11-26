import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { ProofSource } from '#shared/types/festival'

export type CaptureKind = 'bukti-transfer' | 'pendukung'

interface CameraState {
  active: boolean
  ready: boolean
  error: string
  capturedDataUrl: string
  capturedName: string
  source: ProofSource | ''
  busy: boolean
  previewSize: { width: number; height: number }
}

export const useDocumentCamera = () => {
  const video = ref<HTMLVideoElement | null>(null)
  const canvas = ref<HTMLCanvasElement | null>(null)
  const stream = ref<MediaStream | null>(null)
  const started = ref(false)

  const state = reactive<CameraState>({
    active: false,
    ready: false,
    error: '',
    capturedDataUrl: '',
    capturedName: '',
    source: '',
    busy: false,
    previewSize: { width: 0, height: 0 },
  })

  async function start() {
    if (!import.meta.client) return
    state.error = ''
    state.busy = true
    try {
      if (stream.value) stopTracks()
      if (!navigator.mediaDevices?.getUserMedia) {
        state.error = 'Kamera tidak tersedia di browser ini. Gunakan unggah file.'
        return
      }
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 }, height: { ideal: 1000 } },
        audio: false,
      })
      stream.value = media
      state.active = true
      state.ready = false
      if (video.value) {
        video.value.srcObject = media
        await video.value.play().catch(() => {})
        state.ready = true
      }
    } catch {
      state.error = 'Izin kamera ditolak atau perangkat tidak ditemukan. Gunakan unggah file sebagai alternatif.'
      state.active = false
      stopTracks()
    } finally {
      state.busy = false
    }
  }

  function stopTracks() {
    const current = stream.value
    if (current) {
      for (const track of current.getTracks()) track.stop()
    }
    if (video.value) {
      try {
        ;(video.value as HTMLVideoElement).srcObject = null
      } catch {
        // ignore cleanup errors
      }
    }
    stream.value = null
    state.active = false
    state.ready = false
  }

  function capture(fileBase = 'bukti-transfer') {
    if (!import.meta.client || !video.value) return
    const element = video.value
    const sourceWidth = element.videoWidth || 1280
    const sourceHeight = element.videoHeight || 720
    const maxWidth = 1200
    const ratio = sourceWidth > maxWidth ? maxWidth / sourceWidth : 1
    const width = Math.round(sourceWidth * ratio)
    const height = Math.round(sourceHeight * ratio)

    const target = canvas.value ?? document.createElement('canvas')
    target.width = width
    target.height = height
    const context = target.getContext('2d')
    if (!context) {
      state.error = 'Gagal memproses foto. Coba unggah file.'
      return
    }
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(element, 0, 0, width, height)
    state.capturedDataUrl = target.toDataURL('image/jpeg', 0.72)
    state.capturedName = `${fileBase}-${width}x${height}.jpg`
    state.source = 'camera'
    state.previewSize = { width, height }
  }

  async function readFile(file: File): Promise<void> {
    if (!import.meta.client) return
    state.error = ''
    state.busy = true
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('read-failed'))
        reader.readAsDataURL(file)
      })
      state.capturedDataUrl = dataUrl
      state.capturedName = file.name
      state.source = 'upload'
      state.previewSize = { width: 0, height: 0 }
    } catch {
      state.error = 'Gagal membaca file. Coba file lain.'
    } finally {
      state.busy = false
    }
  }

  function resetCapture() {
    state.capturedDataUrl = ''
    state.capturedName = ''
    state.source = ''
    state.previewSize = { width: 0, height: 0 }
  }

  function resetAll() {
    resetCapture()
    state.error = ''
    stopTracks()
  }

  onMounted(() => {
    started.value = true
  })

  onBeforeUnmount(() => {
    stopTracks()
  })

  return {
    video,
    canvas,
    state,
    started,
    start,
    capture,
    stopTracks,
    readFile,
    resetCapture,
    resetAll,
  }
}
