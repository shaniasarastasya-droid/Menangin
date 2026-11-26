<template>
  <div class="space-y-6">
    <div v-if="!store.hydrated.value" class="border-2 border-dashed border-ink/30 bg-paper-deep px-4 py-8 text-center text-sm font-semibold text-muted">
      Memuat data festival...
    </div>

    <template v-else>
      <section id="profil" class="scroll-mt-28 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div class="ink-shadow border-[3px] border-ink bg-paper p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.25em] text-merah">Data Diri Peserta</p>
              <h2 class="poster-title text-3xl">Profilku</h2>
            </div>
            <button type="button" class="pressable border-2 border-ink bg-kuning px-3 py-1.5 text-xs font-black uppercase" @click="saveProfile">Simpan Profil</button>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block sm:col-span-2">
              <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Nama Lengkap</span>
              <input v-model="profile.namaLengkap" type="text" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10">
            </label>
            <label class="block sm:col-span-2">
              <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Asal Sekolah / Instansi</span>
              <input v-model="profile.asalSekolah" type="text" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10">
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">No. WhatsApp / Kontak</span>
              <input v-model="profile.noWhatsapp" type="text" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10">
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Email Notifikasi</span>
              <input v-model="profile.email" type="email" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="nama@email.com">
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Kategori</span>
              <select v-model="profile.kategori" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10">
                <option>Siswa</option><option>Mahasiswa</option><option>Umum</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Jenis Kelamin / Kategori</span>
              <select v-model="profile.jenisKelamin" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10">
                <option>Putra</option><option>Putri</option>
              </select>
            </label>
          </div>
        </div>

        <ParticipantPassCard v-if="store.currentParticipant.value" :participant="store.currentParticipant.value" :registrations="store.myRegistrations.value" />
      </section>

      <section id="lombaku" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-biru">Pendaftaran Lomba</p>
            <h2 class="poster-title text-3xl">Lombaku</h2>
          </div>
          <button type="button" class="pressable ink-shadow-sm border-[3px] border-ink bg-merah px-4 py-2 text-xs font-black uppercase text-paper" @click="regOpen = true">
            + Daftar Cabang
          </button>
        </div>

        <div class="overflow-x-auto border-2 border-ink">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-ink text-[11px] uppercase tracking-wider text-paper">
              <tr>
                <th class="px-3 py-2">Cabang</th>
                <th class="px-3 py-2">Jadwal</th>
                <th class="px-3 py-2">Biaya</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">Bukti Transfer</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="registration in enrichedRegistrations" :key="registration.id" class="border-t border-ink/15 align-top">
                <td class="px-3 py-3">
                  <div class="font-bold">{{ registration.competition?.name }}</div>
                  <div class="text-xs text-muted">{{ registration.type === 'team' ? `Tim: ${registration.teamName}` : 'Individu' }}</div>
                  <div v-if="registration.winnerRank" class="mt-1 inline-block bg-kuning px-1.5 py-0.5 text-[10px] font-black uppercase">Juara {{ registration.winnerRank }}</div>
                </td>
                <td class="px-3 py-3 text-xs">
                  <div class="font-semibold">{{ formatDate(registration.branch?.date ?? '') }}</div>
                  <div class="text-muted">{{ registration.branch?.startTime }}–{{ registration.branch?.endTime }}</div>
                </td>
                <td class="px-3 py-3 font-semibold">{{ rupiah(registration.competition?.fee ?? 0) }}</td>
                <td class="px-3 py-3">
                  <span class="inline-block px-2 py-1 text-[11px] font-black uppercase" :class="paymentTone(registration.paymentStatus)">{{ registration.paymentStatus }}</span>
                  <p v-if="registration.reviewNote" class="mt-1 max-w-[14rem] text-[11px] text-muted">{{ registration.reviewNote }}</p>
                </td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-if="registration.paymentStatus !== 'Lunas'"
                      type="button"
                      class="border-2 border-ink bg-kuning px-2 py-1 text-[11px] font-black uppercase hover:bg-kuning/80"
                      @click="openPayment(registration)"
                    >
                      Bayar
                    </button>
                    <button type="button" class="border-2 border-ink bg-paper px-2 py-1 text-[11px] font-black uppercase hover:bg-kuning/20" @click="openProof(registration, 'bukti-transfer')">
                      {{ registration.proof ? 'Lihat/Ganti' : 'Ambil/Unggah' }}
                    </button>
                    <button type="button" class="border-2 border-ink/40 bg-paper px-2 py-1 text-[11px] font-bold uppercase hover:border-ink" @click="openProof(registration, 'pendukung')">+ Pendukung</button>
                  </div>
                  <div v-if="registration.proof" class="mt-1 text-[11px] text-muted">{{ registration.proof.source === 'camera' ? 'Kamera' : 'Unggah' }} · {{ formatStamp(registration.proof.capturedAt) }}</div>
                </td>
              </tr>
              <tr v-if="enrichedRegistrations.length === 0">
                <td colspan="5" class="px-3 py-8 text-center text-sm text-muted">Belum ada pendaftaran. Klik <strong>+ Daftar Cabang</strong> untuk mulai.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="pembayaran" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-merah">Pembayaran Pendaftaran</p>
            <h2 class="poster-title text-3xl">Bayar Lomba</h2>
            <p class="mt-1 text-xs text-muted">Pilih metode Transfer Bank, E-Wallet, atau QRIS untuk melunasi biaya pendaftaran cabang lombamu.</p>
          </div>
          <div class="flex flex-wrap gap-2 text-xs">
            <div class="border-2 border-ink bg-kuning/25 px-3 py-1.5">
              <span class="block text-[10px] font-black uppercase text-muted">Belum Lunas</span>
              <strong class="text-sm font-black text-merah">{{ rupiah(unpaidTotal) }}</strong>
            </div>
            <div class="border-2 border-ink bg-hijau/15 px-3 py-1.5">
              <span class="block text-[10px] font-black uppercase text-muted">Sudah Lunas</span>
              <strong class="text-sm font-black text-hijau">{{ paidCount }}/{{ enrichedRegistrations.length }} cabang</strong>
            </div>
          </div>
        </div>

        <div v-if="enrichedRegistrations.length === 0" class="border-2 border-dashed border-ink/25 bg-paper-deep px-4 py-7 text-center text-sm text-muted">
          Daftar cabang lomba terlebih dahulu pada bagian <strong>Lombaku</strong> di atas, lalu selesaikan pembayaran di sini.
        </div>

        <div v-else class="grid gap-3 md:grid-cols-2">
          <article
            v-for="reg in enrichedRegistrations"
            :key="`pay-${reg.id}`"
            class="flex flex-col justify-between gap-3 border-[3px] border-ink p-4"
            :class="reg.paymentStatus === 'Lunas' ? 'bg-paper-deep/60' : 'bg-paper ink-shadow-sm'"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="font-black text-base">{{ reg.competition?.name }}</div>
                  <div class="text-xs text-muted">
                    {{ reg.type === 'team' ? `Tim: ${reg.teamName}` : 'Individu' }} · ID <span class="font-mono uppercase">{{ reg.id }}</span>
                  </div>
                </div>
                <span class="shrink-0 px-2 py-0.5 text-[10px] font-black uppercase" :class="paymentTone(reg.paymentStatus)">
                  {{ reg.paymentStatus }}
                </span>
              </div>

              <div class="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-y border-dashed border-ink/20 py-2">
                <span class="text-[11px] font-bold uppercase text-muted">Biaya Pendaftaran</span>
                <span class="poster-title text-2xl text-merah">{{ rupiah(reg.competition?.fee ?? 0) }}</span>
              </div>

              <div class="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase text-muted">
                <span class="border border-ink/30 bg-paper-deep px-1.5 py-0.5">Transfer Bank (6 Bank)</span>
                <span class="border border-ink/30 bg-paper-deep px-1.5 py-0.5">E-Wallet (5 Aplikasi)</span>
                <span class="border border-ink/30 bg-paper-deep px-1.5 py-0.5">QRIS</span>
              </div>
              <p v-if="reg.reviewNote" class="mt-2 border-l-2 border-merah pl-2 text-[11px] text-merah">{{ reg.reviewNote }}</p>
            </div>

            <div class="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                class="pressable flex-1 border-[3px] border-ink px-3 py-2 text-xs font-black uppercase"
                :class="reg.paymentStatus === 'Lunas' ? 'bg-paper text-ink' : 'bg-kuning text-ink ink-shadow-sm'"
                @click="openPayment(reg)"
              >
                {{ reg.paymentStatus === 'Lunas' ? 'Lihat Info Pembayaran' : 'Bayar Sekarang' }}
              </button>
              <button
                type="button"
                class="border-2 border-ink bg-paper px-3 py-2 text-xs font-black uppercase hover:bg-paper-deep"
                @click="openProof(reg, 'bukti-transfer')"
              >
                {{ reg.proof ? 'Bukti' : 'Unggah Bukti' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- PAPAN PEMENANG & HADIAH (TERHUBUNG LANGSUNG DENGAN PANITIA) -->
      <section id="pemenang" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-hijau">Pengumuman Juara & Hadiah</p>
            <h2 class="poster-title text-3xl">Pemenang Lomba</h2>
            <p class="mt-1 text-xs text-muted">Daftar pemenang dan besaran hadiah ditetapkan langsung oleh panitia festival.</p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="border-2 border-ink px-3 py-1.5 text-xs font-black uppercase"
              :class="winnerView === 'mine' ? 'bg-ink text-kuning' : 'bg-paper text-ink hover:bg-paper-deep'"
              @click="winnerView = 'mine'"
            >
              Cabang Kuikuti
            </button>
            <button
              type="button"
              class="border-2 border-ink px-3 py-1.5 text-xs font-black uppercase"
              :class="winnerView === 'all' ? 'bg-ink text-kuning' : 'bg-paper text-ink hover:bg-paper-deep'"
              @click="winnerView = 'all'"
            >
              Seluruh Lomba ({{ allWinnerGroups.length }})
            </button>
          </div>
        </div>

        <div v-if="myWinnerAwards.length > 0" class="mb-4 flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-kuning/35 p-4">
          <div>
            <div class="text-[10px] font-black uppercase tracking-wider text-merah">🏆 Selamat! Kamu Meraih Juara</div>
            <p class="mt-0.5 text-sm font-bold text-ink">
              Kamu memenangkan {{ myWinnerAwards.length }} cabang lomba dengan total hadiah
              <strong class="text-hijau">{{ rupiah(myTotalPrize) }}</strong>.
            </p>
          </div>
          <NuxtLink
            v-if="certificateClaimEnabled"
            to="/peserta/sertifikat"
            class="pressable ink-shadow-sm border-[3px] border-ink bg-merah px-4 py-2 text-xs font-black uppercase text-paper"
          >
            Klaim Sertifikat Pemenang & Peserta →
          </NuxtLink>
          <span v-else class="border-2 border-ink bg-paper px-3 py-1.5 text-[11px] font-black uppercase text-muted">
            🔒 Sertifikat menunggu diaktifkan panitia
          </span>
        </div>

        <div v-if="visibleWinnerGroups.length === 0" class="border-2 border-dashed border-ink/25 bg-paper-deep px-4 py-8 text-center text-sm text-muted">
          {{ winnerView === 'mine'
            ? 'Belum ada pengumuman pemenang untuk cabang lomba yang kamu ikuti.'
            : 'Panitia belum mengumumkan pemenang cabang lomba mana pun.' }}
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <article
            v-for="group in visibleWinnerGroups"
            :key="group.competition.id"
            class="border-[3px] border-ink bg-paper-deep/60 p-4"
            :class="group.isMine ? 'ring-2 ring-kuning' : ''"
          >
            <div class="mb-3 flex flex-wrap items-start justify-between gap-2 border-b-2 border-ink/15 pb-2">
              <div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <h3 class="font-black text-base">{{ group.competition.name }}</h3>
                  <span v-if="group.isMine" class="border border-ink bg-kuning px-1.5 py-0.5 text-[9px] font-black uppercase">Kuikuti</span>
                </div>
                <div class="text-[11px] text-muted">{{ group.competition.category }} · {{ group.competition.division }}</div>
              </div>
              <span class="text-[10px] font-black uppercase text-muted">{{ group.entries.length }} Juara</span>
            </div>

            <div class="space-y-2">
              <div
                v-for="entry in group.entries"
                :key="`${group.competition.id}-${entry.rank}`"
                class="flex flex-wrap items-center justify-between gap-2 border-2 p-2.5 text-xs"
                :class="entry.isCurrentUser ? 'border-ink bg-kuning/30 ink-shadow-sm' : 'border-ink/20 bg-paper'"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span
                      class="px-1.5 py-0.5 text-[10px] font-black uppercase"
                      :class="entry.rank === 1 ? 'bg-kuning text-ink border border-ink' : entry.rank === 2 ? 'bg-biru text-paper' : 'bg-merah text-paper'"
                    >
                      Juara {{ entry.rank }}
                    </span>
                    <strong class="truncate text-ink">{{ entry.winnerLabel }}</strong>
                    <span v-if="entry.isCurrentUser" class="bg-hijau px-1.5 py-0.5 text-[9px] font-black uppercase text-paper">Kamu</span>
                  </div>
                  <div class="mt-0.5 truncate text-[11px] text-muted">{{ entry.school }}</div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] font-black uppercase text-muted">Hadiah</div>
                  <div class="font-black text-hijau">{{ entry.prizeAmount > 0 ? rupiah(entry.prizeAmount) : 'Trophy & Sertifikat' }}</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- KLAIM SERTIFIKAT PESERTA (TERKUNCI SAMPAI PANITIA MENGAKTIFKAN) -->
      <section id="sertifikat" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-biru">Sertifikat Digital Resmi</p>
            <h2 class="poster-title text-3xl">Klaim Sertifikat Peserta</h2>
            <p class="mt-1 text-xs text-muted">
              Sertifikat otomatis terisi atas nama <strong class="text-ink">{{ store.currentParticipant.value?.namaLengkap }}</strong> sesuai profil akunmu.
            </p>
          </div>
          <NuxtLink
            v-if="certificateClaimEnabled"
            to="/peserta/sertifikat"
            class="pressable ink-shadow-sm border-[3px] border-ink px-4 py-2 text-xs font-black uppercase"
            :class="myWinnerAwards.length > 0 ? 'bg-kuning text-ink' : 'bg-biru text-paper'"
          >
            {{ myWinnerAwards.length > 0 ? '🏆 Halaman Sertifikat Pemenang & Peserta →' : 'Buka Semua Sertifikat →' }}
          </NuxtLink>
          <span v-else class="border-2 border-ink bg-ink px-3 py-1.5 text-[10px] font-black uppercase text-kuning">
            🔒 Belum Diaktifkan Panitia
          </span>
        </div>

        <div v-if="!certificateClaimEnabled" class="border-2 border-dashed border-ink/35 bg-paper-deep px-5 py-7 text-center">
          <div class="text-2xl">🔒</div>
          <div class="mt-2 font-black uppercase text-sm text-ink">Klaim & Pratinjau Sertifikat Belum Dibuka</div>
          <p class="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-muted">
            Selama perlombaan belum selesai, pratinjau dan pengunduhan Sertifikat Peserta maupun Sertifikat Pemenang dikunci oleh panitia. Sertifikatmu akan langsung tersedia di sini begitu panitia mengaktifkannya.
          </p>
        </div>

        <div v-else class="grid gap-5 lg:grid-cols-2">
          <CertificateCardPreview
            v-for="cert in participantCertificates.slice(0, 2)"
            :key="cert.serialCode"
            :params="cert"
          />
        </div>
      </section>

      <section id="inbox" class="scroll-mt-28 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="ink-shadow border-[3px] border-ink bg-paper p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.25em] text-hijau">Inbox Notifikasi</p>
              <h2 class="poster-title text-3xl">Pesan untukmu</h2>
            </div>
            <button type="button" class="border-2 border-ink px-3 py-1.5 text-xs font-bold uppercase hover:bg-paper-deep" @click="store.markAllRead()">Tandai semua dibaca</button>
          </div>

          <div class="space-y-3">
            <article
              v-for="item in store.myNotifications.value"
              :key="item.id"
              class="border-2 border-ink p-4"
              :class="item.read ? 'bg-paper opacity-75' : 'bg-kuning/10'"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2 py-0.5 text-[10px] font-black uppercase" :class="notificationTone(item.type)">{{ item.type }}</span>
                  <span v-if="!item.read" class="bg-merah px-1.5 py-0.5 text-[10px] font-black uppercase text-paper">Baru</span>
                </div>
                <span class="text-[11px] text-muted">{{ formatStamp(item.createdAt) }}</span>
              </div>
              <h3 class="mt-2 font-black">{{ item.title }}</h3>
              <p class="mt-1 text-sm text-muted">{{ item.body }}</p>
              <div class="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
                <span>{{ item.competitionId ? store.getCompetition(item.competitionId)?.name : 'Semua peserta' }}</span>
                <button v-if="!item.read" type="button" class="font-bold uppercase text-biru underline" @click="store.markNotificationRead(item.id)">Tandai dibaca</button>
              </div>
            </article>
            <p v-if="store.myNotifications.value.length === 0" class="py-6 text-center text-sm text-muted">Belum ada notifikasi.</p>
          </div>
        </div>

        <div class="ink-shadow border-[3px] border-ink bg-paper p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-merah">Pengumuman Festival</p>
          <h2 class="poster-title mb-4 text-3xl">Info terbaru</h2>
          <div class="space-y-3">
            <article v-for="item in store.state.value.announcements" :key="item.id" class="border-2 border-ink/20 bg-paper-deep p-3">
              <div class="mb-1 flex items-center justify-between gap-2 text-[10px] font-black uppercase">
                <span class="text-merah">{{ item.tag }}</span>
                <span class="text-muted">{{ formatStamp(item.publishedAt) }}</span>
              </div>
              <div class="font-bold">{{ item.title }}</div>
              <p class="mt-1 text-sm text-muted">{{ item.body }}</p>
            </article>
          </div>
        </div>
      </section>
    </template>

    <RegistrationFormModal :open="regOpen" :participant="store.currentParticipant.value" @close="regOpen = false" @registered="onRegistered" />
    <PaymentOverlayModal
      :open="paymentOpen"
      :registration="paymentTarget?.registration ?? null"
      :competition="paymentTarget?.competition"
      :participant="store.currentParticipant.value"
      @close="paymentOpen = false"
      @upload-proof="onUploadFromPayment"
    />
    <DocumentCameraModal
      :open="proofOpen"
      :kind="proofKind"
      :competition-name="proofTarget?.competition?.name"
      :participant-name="store.currentParticipant.value?.namaLengkap"
      :fee="proofTarget?.competition?.fee"
      :status="proofTarget?.registration.paymentStatus"
      :title="proofKind === 'bukti-transfer' ? 'Ambil Bukti Transfer' : 'Unggah Dokumen Pendukung'"
      :subtitle="proofKind === 'bukti-transfer' ? 'Foto/unggah Bukti Transfer Pembayaran Pendaftaran Lomba dengan jelas.' : 'Tambahkan dokumen pendukung opsional untuk pendaftaranmu.'"
      @close="proofOpen = false"
      @confirm="saveProof"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Registration } from '#shared/types/festival'
import type { CertificateParams } from '~/utils/certificate'

definePageMeta({ layout: 'dashboard' })

const store = useFestivalStore()
const regOpen = ref(false)
const paymentOpen = ref(false)
const paymentTarget = ref<{ registration: Registration; competition: ReturnType<typeof store.getCompetition> } | null>(null)
const proofOpen = ref(false)
const proofKind = ref<'bukti-transfer' | 'pendukung'>('bukti-transfer')
const proofTarget = ref<{ registration: Registration; competition: ReturnType<typeof store.getCompetition> } | null>(null)

const profile = reactive({
  namaLengkap: '',
  asalSekolah: '',
  noWhatsapp: '',
  email: '',
  jenisKelamin: 'Putri' as 'Putra' | 'Putri',
  kategori: 'Siswa' as 'Siswa' | 'Mahasiswa' | 'Umum',
})

function syncProfile() {
  const current = store.currentParticipant.value
  if (!current) return
  profile.namaLengkap = current.namaLengkap
  profile.asalSekolah = current.asalSekolah
  profile.noWhatsapp = current.noWhatsapp
  profile.email = current.email || store.session.value.email || ''
  profile.jenisKelamin = current.jenisKelamin
  profile.kategori = current.kategori
}

watch(() => store.currentParticipant.value?.id, syncProfile, { immediate: true })
watch(() => store.hydrated.value, (value) => { if (value) syncProfile() })

onMounted(async () => {
  if (!store.hydrated.value) await store.hydrate()
  if (store.session.value.role !== 'peserta') navigateTo('/login?role=peserta')
})

const enrichedRegistrations = computed(() => store.myRegistrations.value.map(registration => {
  const competition = store.getCompetition(registration.competitionId)
  const branch = competition ? store.getBranch(competition.branchId) : undefined
  return { ...registration, competition, branch }
}).reverse())

const unpaidTotal = computed(() =>
  enrichedRegistrations.value
    .filter(reg => reg.paymentStatus !== 'Lunas' && reg.paymentStatus !== 'Terverifikasi')
    .reduce((sum, reg) => sum + (reg.competition?.fee ?? 0), 0),
)

const paidCount = computed(() =>
  enrichedRegistrations.value.filter(reg => reg.paymentStatus === 'Lunas' || reg.paymentStatus === 'Terverifikasi').length,
)

const winnerView = ref<'mine' | 'all'>('all')
const certificateClaimEnabled = computed(() => store.state.value.settings.certificateClaimEnabled)

const myCompetitionIds = computed(() => new Set(store.myRegistrations.value.map(r => r.competitionId)))
const myRegistrationIds = computed(() => new Set(store.myRegistrations.value.map(r => r.id)))

const allWinnerGroups = computed(() => {
  return store.state.value.competitions
    .map(competition => {
      const entries = store.state.value.winners
        .filter(w => w.competitionId === competition.id)
        .sort((a, b) => a.rank - b.rank)
        .map(w => {
          const reg = store.getRegistration(w.registrationId)
          const participant = reg ? store.state.value.participants.find(p => p.id === reg.participantId) : undefined
          const winnerLabel = reg?.type === 'team'
            ? `${reg.teamName} (${participant?.namaLengkap ?? 'Tim'})`
            : (participant?.namaLengkap ?? 'Peserta')
          return {
            rank: w.rank,
            prizeAmount: w.prizeAmount ?? 0,
            winnerLabel,
            school: participant?.asalSekolah ?? '',
            isCurrentUser: myRegistrationIds.value.has(w.registrationId),
          }
        })
      return {
        competition,
        entries,
        isMine: myCompetitionIds.value.has(competition.id),
      }
    })
    .filter(group => group.entries.length > 0)
})

const visibleWinnerGroups = computed(() =>
  winnerView.value === 'mine'
    ? allWinnerGroups.value.filter(group => group.isMine)
    : allWinnerGroups.value,
)

const myWinnerAwards = computed(() =>
  store.state.value.winners.filter(w => myRegistrationIds.value.has(w.registrationId)),
)

const myTotalPrize = computed(() =>
  myWinnerAwards.value.reduce((sum, w) => sum + (w.prizeAmount ?? 0), 0),
)

const participantCertificates = computed<CertificateParams[]>(() => {
  const name = store.currentParticipant.value?.namaLengkap || store.session.value.displayName || 'Peserta Menangin!'
  const regs = store.myRegistrations.value.filter(r => r.paymentStatus !== 'Ditolak')
  if (regs.length === 0) {
    const pid = (store.currentParticipant.value?.id || 'PESERTA').toUpperCase()
    return [
      {
        kind: 'peserta',
        participantName: name,
        competitionName: '',
        serialCode: `MNG-2026-PST-${pid}`,
      },
    ]
  }
  return regs.map(reg => {
    const comp = store.getCompetition(reg.competitionId)
    return {
      kind: 'peserta',
      participantName: name,
      competitionName: comp?.name ?? reg.competitionId,
      teamName: reg.type === 'team' ? reg.teamName : '',
      serialCode: `MNG-2026-PST-${reg.id.toUpperCase()}`,
    }
  })
})

async function saveProfile() {
  if (!profile.namaLengkap.trim() || !profile.asalSekolah.trim() || !profile.noWhatsapp.trim()) {
    store.toast('Lengkapi semua field data diri.', 'error')
    return
  }
  await store.updateProfile({ ...profile })
}

function openPayment(registration: Registration) {
  paymentTarget.value = { registration, competition: store.getCompetition(registration.competitionId) }
  paymentOpen.value = true
}

function onUploadFromPayment(registration: Registration) {
  paymentOpen.value = false
  openProof(registration, 'bukti-transfer')
}

function openProof(registration: Registration, kind: 'bukti-transfer' | 'pendukung') {
  proofKind.value = kind
  proofTarget.value = { registration, competition: store.getCompetition(registration.competitionId) }
  proofOpen.value = true
}

async function saveProof(payload: { dataUrl: string; name: string; source: 'camera' | 'upload' }) {
  if (!proofTarget.value) return
  const result = await store.saveProof(proofTarget.value.registration.id, payload.dataUrl, payload.name, payload.source, proofKind.value)
  store.toast(result.message, result.ok ? 'success' : 'error')
  if (result.ok) proofOpen.value = false
}

function onRegistered(registrationId: string) {
  regOpen.value = false
  const created = store.getRegistration(registrationId)
  if (import.meta.client) {
    document.getElementById('pembayaran')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  if (created) {
    openPayment(created)
  }
}
</script>
