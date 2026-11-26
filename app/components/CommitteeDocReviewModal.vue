<template>
  <Teleport to="body">
    <div v-if="open && registration" class="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Review dokumen">
      <div class="absolute inset-0 bg-ink/55" @click="$emit('close')" />
      <div class="pop-in relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto border-[3px] border-ink bg-paper ink-shadow-lg">
        <div class="flex items-start justify-between gap-4 border-b-[3px] border-ink bg-biru px-5 py-4 text-paper">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-paper/75">Review Bukti Transfer</p>
            <h2 class="poster-title mt-1 text-2xl sm:text-3xl">Verifikasi Pembayaran</h2>
            <p class="mt-1 text-sm text-paper/80">{{ participant?.namaLengkap }} · {{ competition?.name }}</p>
          </div>
          <button type="button" class="pressable border-2 border-paper bg-paper px-3 py-1 text-sm font-black text-ink" @click="$emit('close')">Tutup</button>
        </div>

        <div class="grid gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div class="border-[3px] border-ink bg-paper-deep">
              <div class="border-b-2 border-ink px-3 py-2 text-[11px] font-black uppercase tracking-wider">Bukti Transfer Pendaftaran Lomba</div>
              <div class="flex min-h-[20rem] items-center justify-center bg-ink/5 p-3">
                <img v-if="registration.proof" :src="registration.proof.dataUrl" :alt="registration.proof.name" class="max-h-[60vh] w-full object-contain border-2 border-ink bg-paper">
                <div v-else class="border-2 border-dashed border-ink/30 px-6 py-12 text-center text-sm text-muted">Belum ada bukti transfer yang diunggah.</div>
              </div>
            </div>

            <div v-if="registration.supportingDocs.length" class="mt-4 border-[3px] border-ink bg-paper p-3">
              <div class="mb-2 text-[11px] font-black uppercase tracking-wider text-muted">Dokumen Pendukung</div>
              <div class="grid gap-2 sm:grid-cols-2">
                <img v-for="doc in registration.supportingDocs" :key="doc.id" :src="doc.dataUrl" :alt="doc.name" class="h-32 w-full border-2 border-ink object-cover">
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="ink-shadow-sm border-[3px] border-ink bg-paper p-4 text-sm">
              <div class="grid gap-2">
                <div><span class="text-muted">Peserta:</span> <strong>{{ participant?.namaLengkap }}</strong></div>
                <div><span class="text-muted">Kontak:</span> {{ participant?.noWhatsapp }}</div>
                <div><span class="text-muted">Cabang:</span> <strong>{{ competition?.name }}</strong></div>
                <div><span class="text-muted">Biaya:</span> <strong class="text-merah">{{ rupiah(competition?.fee ?? 0) }}</strong></div>
                <div><span class="text-muted">Status saat ini:</span> <span class="inline-block px-2 py-0.5 text-xs font-black" :class="paymentTone(registration.paymentStatus)">{{ registration.paymentStatus }}</span></div>
                <div v-if="registration.proof"><span class="text-muted">Diambil:</span> {{ formatStamp(registration.proof.capturedAt) }} ({{ registration.proof.source === 'camera' ? 'kamera' : 'unggah' }})</div>
              </div>
            </div>

            <label class="block">
              <span class="mb-1 block text-xs font-black uppercase tracking-wider">Catatan Panitia</span>
              <textarea v-model="note" rows="4" class="w-full border-[3px] border-ink px-3 py-2 text-sm outline-none focus:bg-kuning/10" placeholder="Contoh: Nominal sesuai, nama pengirim jelas. / Foto buram, mohon unggah ulang."></textarea>
            </label>

            <div class="grid gap-2">
              <button type="button" class="pressable ink-shadow border-[3px] border-ink bg-hijau px-4 py-2.5 text-sm font-black uppercase text-paper" @click="setStatus('Lunas')">Terverifikasi / Lunas</button>
              <button type="button" class="pressable border-[3px] border-ink bg-kuning px-4 py-2.5 text-sm font-black uppercase text-ink" @click="setStatus('Perlu Diperbaiki')">Perlu Diperbaiki</button>
              <button type="button" class="pressable border-[3px] border-ink bg-merah px-4 py-2.5 text-sm font-black uppercase text-paper" @click="setStatus('Ditolak')">Tolak Bukti</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PaymentStatus, Registration } from '#shared/types/festival'

const props = defineProps<{ open: boolean; registration: Registration | null }>()
const emit = defineEmits<{ close: [] }>()

const store = useFestivalStore()
const note = ref('')

const participant = computed(() => props.registration ? store.state.value.participants.find(p => p.id === props.registration!.participantId) : null)
const competition = computed(() => props.registration ? store.getCompetition(props.registration.competitionId) : null)

watch(() => props.registration?.id, () => {
  note.value = props.registration?.reviewNote ?? ''
}, { immediate: true })

async function setStatus(status: PaymentStatus) {
  if (!props.registration) return
  const result = await store.reviewProof(props.registration.id, status, note.value)
  store.toast(result.message, result.ok ? 'success' : 'error')
  if (result.ok) emit('close')
}
</script>
