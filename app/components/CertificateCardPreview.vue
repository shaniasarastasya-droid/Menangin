<template>
  <article class="ink-shadow flex flex-col border-[3px] border-ink bg-paper">
    <div
      class="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-3"
      :class="params.kind === 'pemenang' ? 'bg-kuning text-ink' : 'bg-biru text-paper'"
    >
      <div>
        <div class="text-[10px] font-black uppercase tracking-[0.2em] opacity-85">
          {{ params.kind === 'pemenang' ? `Sertifikat Pemenang · Juara ${params.rank}` : 'Sertifikat Peserta' }}
        </div>
        <h3 class="poster-title text-xl sm:text-2xl">
          {{ params.competitionName || 'Menangin! Festival 2026' }}
        </h3>
      </div>
      <span
        v-if="params.kind === 'pemenang' && params.prizeAmount"
        class="border-2 border-ink bg-paper px-2.5 py-1 text-xs font-black text-hijau"
      >
        Hadiah {{ rupiah(params.prizeAmount) }}
      </span>
    </div>

    <div class="bg-paper-deep p-3 sm:p-4">
      <button
        type="button"
        class="group relative block w-full overflow-hidden border-[3px] border-ink bg-white text-left"
        title="Klik untuk melihat ukuran penuh"
        @click="zoomOpen = true"
      >
        <img :src="previewUrl" :alt="fileTitle" class="aspect-[1200/848] w-full object-contain">
        <span class="absolute bottom-2 right-2 border-2 border-ink bg-paper/95 px-2 py-1 text-[10px] font-black uppercase opacity-90 transition-opacity group-hover:opacity-100">
          Perbesar ↗
        </span>
      </button>
    </div>

    <div class="mt-auto space-y-3 border-t-[3px] border-ink p-4">
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>Atas nama: <strong class="text-ink">{{ params.participantName }}</strong></span>
        <span class="font-mono text-[11px] text-muted">{{ params.serialCode }}</span>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          :disabled="downloading"
          class="pressable ink-shadow-sm flex-1 border-2 border-ink px-3 py-2 text-xs font-black uppercase disabled:opacity-50"
          :class="params.kind === 'pemenang' ? 'bg-merah text-paper' : 'bg-hijau text-paper'"
          @click="handleDownloadPng"
        >
          {{ downloading ? 'Menyiapkan...' : 'Klaim & Unduh PNG' }}
        </button>
        <button
          type="button"
          class="border-2 border-ink bg-kuning px-3 py-2 text-xs font-black uppercase hover:bg-kuning/80"
          @click="handlePrint"
        >
          Cetak / PDF
        </button>
        <button
          type="button"
          class="border-2 border-ink bg-paper px-3 py-2 text-xs font-bold uppercase hover:bg-paper-deep"
          @click="handleDownloadSvg"
        >
          SVG
        </button>
      </div>
    </div>

    <!-- Fullscreen Zoom Modal -->
    <Teleport to="body">
      <div v-if="zoomOpen" class="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="fileTitle">
        <div class="absolute inset-0 bg-ink/75" @click="zoomOpen = false" />
        <div class="pop-in relative z-10 w-full max-w-5xl border-[3px] border-ink bg-paper p-4 ink-shadow-lg">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="font-black uppercase text-sm">{{ fileTitle }}</div>
            <div class="flex gap-2">
              <button type="button" class="border-2 border-ink bg-hijau px-3 py-1 text-xs font-black uppercase text-paper" @click="handleDownloadPng">
                Unduh PNG
              </button>
              <button type="button" class="border-2 border-ink bg-paper px-3 py-1 text-xs font-black uppercase" @click="zoomOpen = false">
                Tutup
              </button>
            </div>
          </div>
          <img :src="previewUrl" :alt="fileTitle" class="max-h-[78vh] w-full border-2 border-ink object-contain bg-white">
        </div>
      </div>
    </Teleport>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  buildCertificateSvg,
  certificateSvgToDataUrl,
  downloadCertificatePng,
  downloadCertificateSvg,
  printCertificate,
  type CertificateParams,
} from '~/utils/certificate'

const props = defineProps<{
  params: CertificateParams
}>()

const store = useFestivalStore()
const zoomOpen = ref(false)
const downloading = ref(false)

const svgMarkup = computed(() => buildCertificateSvg(props.params))
const previewUrl = computed(() => certificateSvgToDataUrl(svgMarkup.value))

const fileSlug = computed(() => {
  const base = `${props.params.kind === 'pemenang' ? `sertifikat-juara-${props.params.rank}` : 'sertifikat-peserta'}-${props.params.competitionName || 'festival'}-${props.params.participantName}`
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
})

const fileTitle = computed(() =>
  props.params.kind === 'pemenang'
    ? `Sertifikat Pemenang Juara ${props.params.rank} — ${props.params.competitionName || 'Menangin! 2026'}`
    : `Sertifikat Peserta — ${props.params.competitionName || 'Menangin! 2026'}`,
)

async function handleDownloadPng() {
  if (downloading.value) return
  downloading.value = true
  try {
    const ok = await downloadCertificatePng(svgMarkup.value, fileSlug.value)
    store.toast(
      ok ? `Sertifikat berhasil diklaim & diunduh (${fileSlug.value}.png).` : 'Gagal mengunduh PNG sertifikat.',
      ok ? 'success' : 'error',
    )
  } finally {
    downloading.value = false
  }
}

function handleDownloadSvg() {
  downloadCertificateSvg(svgMarkup.value, fileSlug.value)
  store.toast(`Sertifikat SVG diunduh (${fileSlug.value}.svg).`, 'success')
}

function handlePrint() {
  printCertificate(svgMarkup.value, fileTitle.value)
}
</script>
