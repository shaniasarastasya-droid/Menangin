<template>
  <Teleport to="body">
    <div v-if="open && registration" class="fixed inset-0 z-[85] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Overlay Pembayaran">
      <div class="absolute inset-0 bg-ink/60" @click="$emit('close')" />
      <div class="pop-in relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto border-[3px] border-ink bg-paper ink-shadow-lg">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 border-b-[3px] border-ink bg-kuning px-5 py-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-ink/70">Pembayaran Pendaftaran Lomba</p>
            <h2 class="poster-title mt-1 text-2xl sm:text-3xl">{{ competition?.name ?? 'Cabang Lomba' }}</h2>
            <p class="mt-1 text-xs font-bold text-ink/80">
              ID Pendaftaran: <span class="font-mono uppercase">{{ registration.id }}</span>
              <span v-if="participant"> · {{ participant.namaLengkap }}</span>
            </p>
          </div>
          <button type="button" class="pressable border-2 border-ink bg-paper px-3 py-1 text-sm font-black" @click="$emit('close')">
            Tutup
          </button>
        </div>

        <div class="space-y-5 p-5">
          <!-- Nominal Tagihan Banner -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-ink px-4 py-3.5 text-paper ink-shadow-sm">
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.2em] text-kuning">Total Biaya Pendaftaran</div>
              <div class="poster-title mt-0.5 text-3xl text-paper sm:text-4xl">{{ rupiah(fee) }}</div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="border border-paper/40 px-2 py-1 text-[10px] font-black uppercase" :class="paymentTone(registration.paymentStatus)">
                {{ registration.paymentStatus }}
              </span>
              <button
                type="button"
                class="pressable border-2 border-kuning bg-kuning px-3 py-1.5 text-xs font-black uppercase text-ink"
                @click="copyText(String(fee), 'Nominal pembayaran disalin.')"
              >
                Salin Nominal
              </button>
            </div>
          </div>

          <!-- Method Tabs -->
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              class="border-[3px] border-ink px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-colors sm:text-sm"
              :class="activeTab === 'bank' ? 'bg-biru text-paper ink-shadow-sm' : 'bg-paper text-ink hover:bg-paper-deep'"
              @click="activeTab = 'bank'"
            >
              Transfer Bank
            </button>
            <button
              type="button"
              class="border-[3px] border-ink px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-colors sm:text-sm"
              :class="activeTab === 'ewallet' ? 'bg-hijau text-paper ink-shadow-sm' : 'bg-paper text-ink hover:bg-paper-deep'"
              @click="activeTab = 'ewallet'"
            >
              E-Wallet
            </button>
            <button
              type="button"
              class="border-[3px] border-ink px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-colors sm:text-sm"
              :class="activeTab === 'qris' ? 'bg-merah text-paper ink-shadow-sm' : 'bg-paper text-ink hover:bg-paper-deep'"
              @click="activeTab = 'qris'"
            >
              QRIS
            </button>
          </div>

          <!-- TAB 1: TRANSFER BANK -->
          <div v-if="activeTab === 'bank'" class="space-y-4">
            <div class="border-2 border-ink/25 bg-paper-deep px-3.5 py-2.5 text-xs">
              <span class="font-black uppercase text-biru">Rekening Resmi Panitia:</span>
              Semua rekening bank di bawah terdaftar atas nama yang sama —
              <strong class="text-ink">{{ PAYMENT_ACCOUNT_HOLDER }}</strong>.
            </div>

            <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="bank in BANK_ACCOUNTS"
                :key="bank.id"
                type="button"
                class="pressable border-[3px] p-3 text-left transition-colors"
                :class="selectedBankId === bank.id ? 'border-ink bg-kuning/25 ink-shadow-sm' : 'border-ink/30 bg-paper hover:border-ink'"
                @click="selectedBankId = bank.id"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="border border-ink px-2 py-0.5 text-[10px] font-black uppercase" :class="bank.accent">{{ bank.short }}</span>
                  <span class="text-[10px] font-bold text-muted">Kode {{ bank.code }}</span>
                </div>
                <div class="mt-2 font-mono text-sm font-black tracking-tight text-ink">{{ bank.accountNumber }}</div>
                <div class="mt-0.5 truncate text-[11px] font-semibold text-muted">a.n. {{ bank.accountHolder }}</div>
              </button>
            </div>

            <div v-if="selectedBank" class="ink-shadow-sm border-[3px] border-ink bg-paper p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span class="inline-block border border-ink px-2 py-0.5 text-[10px] font-black uppercase" :class="selectedBank.accent">
                    {{ selectedBank.bank }}
                  </span>
                  <div class="mt-2 font-mono text-2xl font-black tracking-wide text-ink">{{ selectedBank.accountNumber }}</div>
                  <div class="mt-1 text-xs font-bold text-muted">
                    Atas Nama: <span class="text-ink">{{ selectedBank.accountHolder }}</span> · Kode Bank: {{ selectedBank.code }}
                  </div>
                </div>
                <button
                  type="button"
                  class="pressable border-2 border-ink bg-kuning px-3 py-2 text-xs font-black uppercase"
                  @click="copyText(rawDigits(selectedBank.accountNumber), `No. rekening ${selectedBank.short} disalin.`)"
                >
                  Salin Rekening
                </button>
              </div>
              <ol class="mt-3 list-decimal space-y-1 border-t-2 border-dashed border-ink/15 pl-4 pt-3 text-xs text-muted">
                <li>Buka m-Banking / ATM <strong>{{ selectedBank.short }}</strong> atau bank lain (pilih transfer antarbank kode <strong>{{ selectedBank.code }}</strong>).</li>
                <li>Masukkan nomor rekening <strong>{{ selectedBank.accountNumber }}</strong> dan pastikan penerima tertulis <strong>{{ selectedBank.accountHolder }}</strong>.</li>
                <li>Transfer tepat sebesar <strong class="text-merah">{{ rupiah(fee) }}</strong> dan simpan struk / screenshot bukti transfer.</li>
              </ol>
            </div>
          </div>

          <!-- TAB 2: E-WALLET -->
          <div v-else-if="activeTab === 'ewallet'" class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-hijau/15 p-3.5">
              <div>
                <div class="text-[10px] font-black uppercase tracking-wider text-hijau">1 Nomor & Nama Sama untuk Semua E-Wallet</div>
                <div class="mt-1 font-mono text-xl font-black text-ink">{{ PAYMENT_EWALLET_NUMBER }}</div>
                <div class="text-xs font-bold text-muted">a.n. <span class="text-ink">{{ PAYMENT_ACCOUNT_HOLDER }}</span></div>
              </div>
              <button
                type="button"
                class="pressable border-2 border-ink bg-kuning px-3 py-2 text-xs font-black uppercase"
                @click="copyText(rawDigits(PAYMENT_EWALLET_NUMBER), 'Nomor E-Wallet panitia disalin.')"
              >
                Salin Nomor
              </button>
            </div>

            <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="wallet in EWALLET_ACCOUNTS"
                :key="wallet.id"
                type="button"
                class="pressable border-[3px] p-3 text-left transition-colors"
                :class="selectedWalletId === wallet.id ? 'border-ink bg-kuning/25 ink-shadow-sm' : 'border-ink/30 bg-paper hover:border-ink'"
                @click="selectedWalletId = wallet.id"
              >
                <span class="inline-block border border-ink px-2 py-0.5 text-[10px] font-black uppercase" :class="wallet.accent">
                  {{ wallet.provider }}
                </span>
                <div class="mt-2 font-mono text-sm font-black text-ink">{{ wallet.phoneNumber }}</div>
                <div class="mt-0.5 truncate text-[11px] font-semibold text-muted">a.n. {{ wallet.accountHolder }}</div>
              </button>
            </div>

            <div v-if="selectedWallet" class="ink-shadow-sm border-[3px] border-ink bg-paper p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="font-black">Panduan Transfer via {{ selectedWallet.provider }}</div>
                <button
                  type="button"
                  class="border-2 border-ink bg-paper-deep px-2.5 py-1 text-[11px] font-black uppercase hover:bg-kuning/30"
                  @click="copyText(rawDigits(selectedWallet.phoneNumber), `Nomor ${selectedWallet.provider} disalin.`)"
                >
                  Salin {{ selectedWallet.phoneNumber }}
                </button>
              </div>
              <ol class="mt-2.5 list-decimal space-y-1 pl-4 text-xs text-muted">
                <li>Buka aplikasi <strong>{{ selectedWallet.provider }}</strong> di ponsel Anda, lalu pilih menu <strong>Transfer / Kirim</strong>.</li>
                <li>Masukkan nomor tujuan <strong>{{ selectedWallet.phoneNumber }}</strong> atas nama <strong>{{ selectedWallet.accountHolder }}</strong>.</li>
                <li>Masukkan nominal <strong class="text-merah">{{ rupiah(fee) }}</strong>, tulis catatan <strong>{{ registration.id }} - {{ competition?.name }}</strong>, lalu screenshot bukti transaksi.</li>
              </ol>
            </div>
          </div>

          <!-- TAB 3: QRIS -->
          <div v-else class="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
            <div class="flex flex-col items-center border-[3px] border-ink bg-paper p-4 text-center ink-shadow-sm">
              <div class="flex w-full items-center justify-between border-b-2 border-ink pb-2">
                <span class="poster-title text-xl text-merah">QRIS</span>
                <span class="border border-ink bg-kuning px-2 py-0.5 text-[10px] font-black uppercase">Nasional</span>
              </div>
              <div class="mt-3 text-xs font-black uppercase text-ink">{{ PAYMENT_ACCOUNT_HOLDER }}</div>
              <div class="text-[10px] font-mono text-muted">NMID: {{ PAYMENT_QRIS_NMID }}</div>

              <div class="my-3 border-[3px] border-ink bg-white p-3">
                <img :src="qrisDataUrl" alt="Kode QRIS Menangin Festival 2026" class="h-48 w-48 object-contain">
              </div>

              <div class="w-full border-2 border-ink bg-paper-deep px-3 py-2 text-xs font-black">
                Nominal: <span class="text-merah">{{ rupiah(fee) }}</span>
              </div>

              <a
                :href="qrisDataUrl"
                :download="`qris-menangin-${registration.id}.svg`"
                class="pressable mt-3 w-full border-2 border-ink bg-kuning px-3 py-2 text-xs font-black uppercase text-ink"
              >
                Unduh Gambar QRIS
              </a>
            </div>

            <div class="space-y-3 border-[3px] border-ink bg-paper-deep p-4 text-xs">
              <div class="poster-title text-2xl">Cara Bayar QRIS</div>
              <p class="leading-relaxed text-muted">
                Satu kode QRIS mendukung pembayaran instan dari seluruh m-Banking dan E-Wallet berlogo QRIS di Indonesia.
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="app in qrisSupportedApps" :key="app" class="border border-ink bg-paper px-2 py-0.5 text-[10px] font-black uppercase">
                  {{ app }}
                </span>
              </div>
              <ol class="list-decimal space-y-1.5 pl-4 pt-2 text-muted">
                <li>Buka aplikasi m-Banking atau E-Wallet pilihan Anda, lalu pilih menu <strong>Scan QR / QRIS</strong>.</li>
                <li>Arahkan kamera ke kode QRIS di samping (atau klik <strong>Unduh Gambar QRIS</strong> lalu impor dari galeri).</li>
                <li>Pastikan nama merchant tertera <strong>{{ PAYMENT_ACCOUNT_HOLDER }}</strong> dan masukkan nominal <strong class="text-merah">{{ rupiah(fee) }}</strong>.</li>
                <li>Selesaikan transaksi, simpan bukti bayar, lalu klik tombol <strong>Unggah Bukti Transfer</strong> di bawah.</li>
              </ol>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-ink pt-4">
            <p class="max-w-md text-xs text-muted">
              Setelah melakukan transfer, segera unggah bukti pembayaran agar panitia dapat memverifikasi dan mengubah status menjadi <strong>Lunas</strong>.
            </p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="border-2 border-ink bg-paper px-4 py-2.5 text-xs font-black uppercase hover:bg-paper-deep" @click="$emit('close')">
                Nanti Saja
              </button>
              <button
                type="button"
                class="pressable ink-shadow border-[3px] border-ink bg-merah px-5 py-2.5 text-xs font-black uppercase text-paper"
                @click="emitUpload"
              >
                Sudah Bayar? Unggah Bukti →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Competition, ParticipantProfile, Registration } from '#shared/types/festival'
import {
  BANK_ACCOUNTS,
  EWALLET_ACCOUNTS,
  PAYMENT_ACCOUNT_HOLDER,
  PAYMENT_EWALLET_NUMBER,
  PAYMENT_QRIS_NMID,
  rawDigits,
} from '~/utils/payment-methods'

const props = defineProps<{
  open: boolean
  registration: Registration | null
  competition: Competition | undefined
  participant: ParticipantProfile | null
}>()

const emit = defineEmits<{
  close: []
  uploadProof: [registration: Registration]
}>()

const store = useFestivalStore()
const activeTab = ref<'bank' | 'ewallet' | 'qris'>('bank')
const selectedBankId = ref(BANK_ACCOUNTS[0]!.id)
const selectedWalletId = ref(EWALLET_ACCOUNTS[0]!.id)

const qrisSupportedApps = ['BCA Mobile', 'BRImo', 'BNI Mobile', 'Livin Mandiri', 'BSI Mobile', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja']

const fee = computed(() => props.competition?.fee ?? 0)
const selectedBank = computed(() => BANK_ACCOUNTS.find(b => b.id === selectedBankId.value) ?? BANK_ACCOUNTS[0])
const selectedWallet = computed(() => EWALLET_ACCOUNTS.find(w => w.id === selectedWalletId.value) ?? EWALLET_ACCOUNTS[0])

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'bank'
  }
})

// Deterministic crisp QR-style SVG matrix seeded by registration ID + amount
const qrisDataUrl = computed(() => {
  const seedStr = `${PAYMENT_QRIS_NMID}-${props.registration?.id ?? 'menangin'}-${fee.value}`
  let hash = 2166136261
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  const size = 21
  const cell = 10
  const pad = 15
  const total = size * cell + pad * 2
  const rects: string[] = []

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)

  const drawFinder = (r0: number, c0: number) => {
    const x = pad + c0 * cell
    const y = pad + r0 * cell
    rects.push(`<rect x="${x}" y="${y}" width="${7 * cell}" height="${7 * cell}" fill="#1c1a17"/>`)
    rects.push(`<rect x="${x + cell}" y="${y + cell}" width="${5 * cell}" height="${5 * cell}" fill="#ffffff"/>`)
    rects.push(`<rect x="${x + 2 * cell}" y="${y + 2 * cell}" width="${3 * cell}" height="${3 * cell}" fill="#1c1a17"/>`)
  }

  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) continue
      if (r >= 8 && r <= 12 && c >= 8 && c <= 12) continue
      hash = Math.imul(hash ^ (r * 31 + c * 17 + 7), 16777619)
      if ((hash >>> 0) % 2 === 0) {
        rects.push(`<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}" fill="#1c1a17"/>`)
      }
    }
  }

  // Center Menangin! badge
  const cx = pad + 8 * cell
  const cy = pad + 8 * cell
  rects.push(`<rect x="${cx}" y="${cy}" width="${5 * cell}" height="${5 * cell}" fill="#ffc93c" stroke="#1c1a17" stroke-width="2"/>`)
  rects.push(`<text x="${cx + 2.5 * cell}" y="${cy + 3.2 * cell}" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="22" font-weight="900" fill="#e8442e">M!</text>`)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}"><rect width="${total}" height="${total}" fill="#ffffff"/>${rects.join('')}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
})

async function copyText(text: string, message: string) {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(text)
    store.toast(message, 'success')
  } catch {
    store.toast('Gagal menyalin ke clipboard.', 'error')
  }
}

function emitUpload() {
  if (!props.registration) return
  emit('uploadProof', props.registration)
}
</script>
