<template>
  <div class="ink-shadow border-[3px] border-ink bg-paper">
    <div class="flex items-center justify-between gap-4 border-b-[3px] border-dashed border-ink bg-kuning px-4 py-3">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.25em]">Festival Pass</p>
        <p class="poster-title text-2xl leading-none">Menangin! 2026</p>
      </div>
      <div class="border-2 border-ink bg-paper px-2 py-1 text-right text-[10px] font-bold uppercase">
        <div>{{ participant.kategori }}</div>
        <div class="text-merah">{{ participant.jenisKelamin }}</div>
      </div>
    </div>

    <div class="grid gap-4 p-4 sm:grid-cols-[1fr_auto]">
      <div class="min-w-0">
        <div class="text-xl font-black leading-tight">{{ participant.namaLengkap }}</div>
        <div class="mt-1 text-sm text-muted">{{ participant.asalSekolah }}</div>
        <div class="mt-3 space-y-1 text-xs font-semibold">
          <div><span class="text-muted">ID:</span> {{ participant.id.toUpperCase() }}</div>
          <div><span class="text-muted">Kontak:</span> {{ participant.noWhatsapp }}</div>
          <div><span class="text-muted">Pendaftaran:</span> {{ registrations.length }} lomba</div>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center border-2 border-ink bg-paper p-2">
        <div class="grid grid-cols-7 gap-[3px]" aria-hidden="true">
          <span
            v-for="(cell, index) in qrCells"
            :key="index"
            class="h-2.5 w-2.5 border border-ink/10"
            :class="cell ? 'bg-ink' : 'bg-paper'"
          />
        </div>
        <div class="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted">Pass Digital</div>
      </div>
    </div>

    <div class="border-t-[3px] border-ink bg-paper-deep px-4 py-3">
      <p class="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Lomba Aktif</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="registration in registrations.slice(0, 4)"
          :key="registration.id"
          class="max-w-full truncate border border-ink px-2 py-1 text-[11px] font-bold"
          :class="paymentTone(registration.paymentStatus)"
        >
          {{ competitionName(registration.competitionId) }}
        </span>
        <span v-if="registrations.length === 0" class="text-xs text-muted">Belum ada pendaftaran. Ayo pilih cabangmu!</span>
        <span v-if="registrations.length > 4" class="border border-ink bg-paper px-2 py-1 text-[11px] font-bold">+{{ registrations.length - 4 }} lagi</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParticipantProfile, Registration } from '#shared/types/festival'

const props = defineProps<{
  participant: ParticipantProfile
  registrations: Registration[]
}>()

const store = useFestivalStore()

function competitionName(id: string) {
  return store.getCompetition(id)?.name ?? 'Lomba'
}

const qrCells = computed(() => {
  const seed = `${props.participant.id}:${props.participant.namaLengkap}:${props.registrations.length}`
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Array.from({ length: 49 }, (_, index) => {
    const row = Math.floor(index / 7)
    const col = index % 7
    const finder = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2)
    if (finder) return true
    const bit = (hash >>> (index % 31)) & 1
    return bit === 1
  })
})
</script>
