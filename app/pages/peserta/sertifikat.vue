<template>
  <div class="space-y-6">
    <div v-if="!store.hydrated.value" class="border-2 border-dashed border-ink/30 bg-paper-deep px-4 py-8 text-center text-sm font-semibold text-muted">
      Memuat data sertifikat...
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <NuxtLink to="/peserta" class="text-xs font-black uppercase tracking-wider text-muted hover:text-merah">← Kembali ke Dashboard Peserta</NuxtLink>
          <p class="mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-biru">Klaim Sertifikat Resmi</p>
          <h2 class="poster-title text-3xl sm:text-4xl">Sertifikat {{ participantName }}</h2>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <span
            class="border-2 border-ink px-3 py-1.5 font-black uppercase"
            :class="claimEnabled ? 'bg-hijau text-paper' : 'bg-ink text-kuning'"
          >
            {{ claimEnabled ? '✓ Klaim Dibuka Panitia' : '🔒 Belum Diaktifkan Panitia' }}
          </span>
        </div>
      </div>

      <!-- TERKUNCI SAAT PERLOMBAAN BELUM SELESAI / BELUM DIAKTIFKAN PANITIA -->
      <section v-if="!claimEnabled" class="ink-shadow border-[3px] border-ink bg-paper p-6 sm:p-8">
        <div class="mx-auto max-w-2xl border-[3px] border-dashed border-ink/40 bg-paper-deep p-6 text-center sm:p-8">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-kuning text-2xl ink-shadow-sm">
            🔒
          </div>
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-merah">Klaim Sertifikat Belum Dibuka</p>
          <h3 class="poster-title mt-2 text-3xl sm:text-4xl">Perlombaan Masih Berlangsung</h3>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Fitur pratinjau dan pengunduhan <strong>Sertifikat Peserta</strong> maupun <strong>Sertifikat Pemenang</strong> hanya dapat dibuka setelah panitia menyelesaikan perlombaan dan mengaktifkan klaim sertifikat.
          </p>
          <div class="mt-5 flex flex-wrap justify-center gap-2 text-xs">
            <span class="border-2 border-ink bg-paper px-3 py-1.5 font-bold">
              Akun: <strong>{{ participantName }}</strong>
            </span>
            <span v-if="myWinnerAwards.length > 0" class="border-2 border-ink bg-kuning px-3 py-1.5 font-black uppercase">
              🏆 Terdaftar sebagai Juara ({{ myWinnerAwards.length }} cabang)
            </span>
          </div>
          <div class="mt-6">
            <NuxtLink to="/peserta" class="pressable ink-shadow-sm inline-block border-[3px] border-ink bg-biru px-5 py-2.5 text-xs font-black uppercase text-paper">
              ← Kembali ke Dashboard Peserta
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- AKTIF: HANYA TAMPIL SETELAH PANITIA MENGAKTIFKAN KLAIM SERTIFIKAT -->
      <template v-else>
        <!-- KHUSUS PEMENANG: Sertifikat Pemenang -->
        <section v-if="winnerCertificates.length > 0" class="ink-shadow border-[3px] border-ink bg-paper p-5">
          <div class="mb-5 border-[3px] border-ink bg-kuning/30 p-4">
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-merah">Khusus Pemenang Lomba</p>
            <h3 class="poster-title mt-1 text-3xl">Selamat atas prestasimu!</h3>
            <p class="mt-1 text-sm text-ink/80">
              Kamu tercatat sebagai pemenang pada <strong>{{ winnerCertificates.length }} cabang lomba</strong>.
              Silakan klaim dan unduh <strong>Sertifikat Pemenang</strong> serta <strong>Sertifikat Peserta</strong> di halaman ini.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="award in myWinnerAwards"
                :key="`badge-${award.competitionId}-${award.rank}`"
                class="inline-flex items-center gap-1.5 border-2 border-ink bg-paper px-3 py-1 text-xs font-black"
              >
                <span class="bg-merah px-1.5 py-0.5 text-[10px] uppercase text-paper">Juara {{ award.rank }}</span>
                <span>{{ award.competitionName }}</span>
                <span v-if="award.prizeAmount > 0" class="text-hijau">· {{ rupiah(award.prizeAmount) }}</span>
              </span>
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <CertificateCardPreview
              v-for="cert in winnerCertificates"
              :key="cert.serialCode"
              :params="cert"
            />
          </div>
        </section>

        <!-- SERTIFIKAT PESERTA -->
        <section class="ink-shadow border-[3px] border-ink bg-paper p-5">
          <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.25em] text-hijau">Sertifikat Partisipasi</p>
              <h3 class="poster-title text-3xl">Sertifikat Peserta</h3>
              <p class="mt-1 text-xs text-muted">
                Nama pada sertifikat otomatis menyesuaikan nama pemilik akun: <strong class="text-ink">{{ participantName }}</strong>.
                Ubah nama di menu Profilku jika ingin memperbarui ejaan.
              </p>
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <CertificateCardPreview
              v-for="cert in participantCertificates"
              :key="cert.serialCode"
              :params="cert"
            />
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { CertificateParams } from '~/utils/certificate'

definePageMeta({ layout: 'dashboard' })

const store = useFestivalStore()

onMounted(async () => {
  if (!store.hydrated.value) await store.hydrate()
  if (store.session.value.role !== 'peserta') {
    await navigateTo('/login')
  }
})

const claimEnabled = computed(() => store.state.value.settings.certificateClaimEnabled)

const participantName = computed(() =>
  store.currentParticipant.value?.namaLengkap
  || store.session.value.displayName
  || 'Peserta Menangin!',
)

const myWinnerAwards = computed(() => {
  const myRegIds = new Set(store.myRegistrations.value.map(r => r.id))
  return store.state.value.winners
    .filter(w => myRegIds.has(w.registrationId))
    .map(w => {
      const reg = store.getRegistration(w.registrationId)
      const comp = store.getCompetition(w.competitionId)
      return {
        ...w,
        competitionName: comp?.name ?? w.competitionId,
        teamName: reg?.type === 'team' ? reg.teamName : '',
        registrationId: w.registrationId,
      }
    })
    .sort((a, b) => a.rank - b.rank)
})

const winnerCertificates = computed<CertificateParams[]>(() =>
  myWinnerAwards.value.map(award => ({
    kind: 'pemenang',
    participantName: participantName.value,
    competitionName: award.competitionName,
    teamName: award.teamName,
    rank: award.rank,
    prizeAmount: award.prizeAmount,
    serialCode: `MNG-2026-J${award.rank}-${award.registrationId.toUpperCase()}`,
  })),
)

const participantCertificates = computed<CertificateParams[]>(() => {
  const regs = store.myRegistrations.value.filter(r => r.paymentStatus !== 'Ditolak')
  if (regs.length === 0) {
    const pid = (store.currentParticipant.value?.id || 'PESERTA').toUpperCase()
    return [
      {
        kind: 'peserta',
        participantName: participantName.value,
        competitionName: '',
        serialCode: `MNG-2026-PST-${pid}`,
      },
    ]
  }
  return regs.map(reg => {
    const comp = store.getCompetition(reg.competitionId)
    return {
      kind: 'peserta',
      participantName: participantName.value,
      competitionName: comp?.name ?? reg.competitionId,
      teamName: reg.type === 'team' ? reg.teamName : '',
      serialCode: `MNG-2026-PST-${reg.id.toUpperCase()}`,
    }
  })
})
</script>
