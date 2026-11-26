<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Dokumen kamera">
      <div class="absolute inset-0 bg-ink/55" @click="close" />
      <div class="pop-in relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto border-[3px] border-ink bg-paper ink-shadow-lg">
        <div class="flex items-start justify-between gap-4 border-b-[3px] border-ink bg-paper-deep px-5 py-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-merah">{{ kindLabel }}</p>
            <h2 class="poster-title mt-1 text-2xl sm:text-3xl">{{ title }}</h2>
            <p class="mt-1 text-sm text-muted">{{ subtitle }}</p>
          </div>
          <button type="button" class="pressable border-2 border-ink bg-paper px-3 py-1 text-sm font-black" @click="close">Tutup</button>
        </div>

        <div class="grid gap-5 p-5 md:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div class="relative overflow-hidden border-[3px] border-ink bg-ink">
              <div class="aspect-[4/3] w-full">
                <video
                  v-show="camera.state.active && !camera.state.capturedDataUrl"
                  ref="camera.video"
                  class="h-full w-full object-cover"
                  autoplay
                  muted
                  playsinline
                />
                <img
                  v-if="camera.state.capturedDataUrl"
                  :src="camera.state.capturedDataUrl"
                  alt="Pratinjau dokumen"
                  class="h-full w-full object-cover"
                />
                <div
                  v-if="!camera.state.active && !camera.state.capturedDataUrl"
                  class="flex h-full flex-col items-center justify-center gap-3 bg-paper-deep px-6 text-center text-ink"
                >
                  <div class="border-2 border-dashed border-ink/40 px-5 py-8">
                    <div class="poster-title text-2xl text-muted">Kamera Siap</div>
                    <p class="mt-2 max-w-xs text-sm text-muted">Nyalakan kamera untuk ambil foto bukti, atau unggah file jika perangkat tidak mendukung kamera.</p>
                  </div>
                </div>
              </div>

              <div v-if="camera.state.active && !camera.state.capturedDataUrl" class="pointer-events-none absolute inset-0 p-6">
                <div class="h-full w-full border-2 border-dashed border-paper/80">
                  <div class="absolute left-8 top-8 h-8 w-8 border-l-4 border-t-4 border-kuning" />
                  <div class="absolute right-8 top-8 h-8 w-8 border-r-4 border-t-4 border-kuning" />
                  <div class="absolute bottom-8 left-8 h-8 w-8 border-b-4 border-l-4 border-kuning" />
                  <div class="absolute bottom-8 right-8 h-8 w-8 border-b-4 border-r-4 border-kuning" />
                  <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ink/75 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-paper">
                    Posisikan {{ kindLabel }} dalam bingkai
                  </div>
                </div>
              </div>
            </div>

            <p v-if="camera.state.error" class="mt-3 border-2 border-merah bg-merah/10 px-3 py-2 text-sm font-semibold text-merah">
              {{ camera.state.error }}
            </p>
            <p v-if="camera.state.capturedDataUrl" class="mt-3 text-xs font-semibold text-hijau">
              Foto siap: {{ camera.state.capturedName }}{{ camera.state.source ? ` · ${camera.state.source === 'camera' ? 'kamera' : 'unggah file'}` : '' }}
            </p>
          </div>

          <div class="flex flex-col gap-3">
            <div class="border-2 border-ink bg-paper-deep p-3 text-sm">
              <div class="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Detail</div>
              <div class="mt-2 font-bold">{{ competitionName }}</div>
              <div class="text-muted">{{ participantName }}</div>
              <div v-if="fee !== undefined" class="mt-2 border-t border-ink/15 pt-2 font-semibold">
                Nominal: <span class="text-merah">{{ rupiah(fee) }}</span>
              </div>
              <div v-if="status" class="mt-1 text-xs">Status: <span class="font-bold">{{ status }}</span></div>
            </div>

            <button
              v-if="!camera.state.active && !camera.state.capturedDataUrl"
              type="button"
              class="pressable ink-shadow border-[3px] border-ink bg-biru px-4 py-3 text-sm font-black uppercase text-paper disabled:opacity-50"
              :disabled="camera.state.busy"
              @click="camera.start()"
            >
              {{ camera.state.busy ? 'Membuka kamera...' : 'Nyalakan Kamera' }}
            </button>

            <button
              v-if="camera.state.active && !camera.state.capturedDataUrl"
              type="button"
              class="pressable ink-shadow border-[3px] border-ink bg-merah px-4 py-3 text-sm font-black uppercase text-paper"
              @click="camera.capture(fileBase)"
            >
              Ambil Foto
            </button>

            <button
              v-if="camera.state.capturedDataUrl"
              type="button"
              class="pressable border-[3px] border-ink bg-paper px-4 py-3 text-sm font-black uppercase"
              @click="retake"
            >
              Foto Ulang
            </button>

            <button
              v-if="camera.state.capturedDataUrl"
              type="button"
              class="pressable ink-shadow border-[3px] border-ink bg-hijau px-4 py-3 text-sm font-black uppercase text-paper"
              @click="confirm"
            >
              Gunakan Foto Ini
            </button>

            <label class="pressable cursor-pointer border-[3px] border-dashed border-ink bg-kuning/30 px-4 py-3 text-center text-sm font-black uppercase">
              Unggah File
              <input type="file" accept="image/*,.pdf" class="hidden" @change="onFileChange">
            </label>

            <button
              v-if="camera.state.active"
              type="button"
              class="border-2 border-ink px-4 py-2 text-xs font-bold uppercase text-muted hover:bg-paper-deep"
              @click="camera.stopTracks()"
            >
              Matikan Kamera
            </button>

            <p class="mt-auto text-[11px] leading-relaxed text-muted">
              Kamera hanya digunakan untuk menangkap bukti dokumen. Tidak ada fitur audio. Stream kamera dimatikan saat modal ditutup.
            </p>
          </div>
        </div>
        <canvas ref="camera.canvas" class="hidden" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PaymentStatus } from '#shared/types/festival'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  subtitle?: string
  kind?: 'bukti-transfer' | 'pendukung'
  competitionName?: string
  participantName?: string
  fee?: number
  status?: PaymentStatus | ''
}>(), {
  title: 'Ambil Bukti Transfer',
  subtitle: 'Gunakan kamera atau unggah file bukti transfer pembayaran pendaftaran lomba.',
  kind: 'bukti-transfer',
  competitionName: '-',
  participantName: '-',
  status: '',
})

const emit = defineEmits<{
  close: []
  confirm: [payload: { dataUrl: string; name: string; source: 'camera' | 'upload' }]
}>()

const camera = useDocumentCamera()

const kindLabel = computed(() => props.kind === 'bukti-transfer' ? 'Bukti Transfer Pembayaran Pendaftaran Lomba' : 'Dokumen Pendukung')
const fileBase = computed(() => props.kind === 'bukti-transfer' ? 'bukti-transfer' : 'dokumen-pendukung')

watch(() => props.open, (open) => {
  if (!open) camera.resetAll()
})

function close() {
  camera.resetAll()
  emit('close')
}

function retake() {
  camera.resetCapture()
  if (!camera.state.active) camera.start()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await camera.readFile(file)
  input.value = ''
}

function confirm() {
  if (!camera.state.capturedDataUrl || !camera.state.source) return
  emit('confirm', {
    dataUrl: camera.state.capturedDataUrl,
    name: camera.state.capturedName || `${fileBase.value}.jpg`,
    source: camera.state.source,
  })
  camera.resetAll()
}
</script>
