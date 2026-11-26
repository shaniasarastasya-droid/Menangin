<template>
  <div class="mx-auto max-w-6xl px-5 py-10 lg:py-14">
    <div class="mb-8">
      <NuxtLink to="/" class="text-xs font-black uppercase tracking-wider text-muted hover:text-merah">← Kembali ke beranda</NuxtLink>
      <h1 class="poster-title mt-3 text-5xl sm:text-6xl">
        {{ mode === 'login' ? 'Masuk' : 'Daftar' }} <span class="text-merah">Arena</span>
      </h1>
      <p class="mt-2 max-w-xl text-sm text-muted">
        {{ mode === 'login'
          ? 'Masukkan email dan kata sandi akunmu. Sistem otomatis mengenali akun Peserta atau Panitia dan mengarahkan ke dashboard yang sesuai.'
          : 'Buat akun baru khusus Peserta Lomba. Akun Panitia yang sudah terdaftar langsung masuk melalui tab Masuk.' }}
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div class="ink-shadow-lg border-[3px] border-ink bg-paper p-6">
        <div class="mb-5 grid grid-cols-2 border-[3px] border-ink bg-paper-deep p-1">
          <button
            type="button"
            class="px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors"
            :class="mode === 'login' ? 'bg-ink text-paper' : 'text-ink hover:bg-kuning/30'"
            @click="setMode('login')"
          >
            Masuk
          </button>
          <button
            type="button"
            class="px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors"
            :class="mode === 'register' ? 'bg-kuning text-ink' : 'text-ink hover:bg-kuning/30'"
            @click="setMode('register')"
          >
            Daftar Peserta
          </button>
        </div>

        <form v-if="mode === 'login'" class="space-y-4" @submit.prevent="submitLogin">
          <label class="block">
            <span class="mb-1 block text-xs font-black uppercase tracking-wider">Email</span>
            <input v-model="email" type="email" autocomplete="email" class="w-full border-[3px] border-ink bg-paper px-3 py-2.5 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="nama@email.com">
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-black uppercase tracking-wider">Kata Sandi</span>
            <input v-model="password" type="password" autocomplete="current-password" class="w-full border-[3px] border-ink bg-paper px-3 py-2.5 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="Masukkan kata sandi">
          </label>

          <p v-if="error" class="border-2 border-merah bg-merah/10 px-3 py-2 text-sm font-semibold text-merah">{{ error }}</p>

          <button
            type="submit"
            :disabled="submitting"
            class="pressable ink-shadow w-full border-[3px] border-ink bg-merah px-4 py-3 text-sm font-black uppercase text-paper disabled:opacity-50"
          >
            {{ submitting ? 'Memproses...' : 'Masuk' }}
          </button>

          <p class="pt-1 text-center text-xs text-muted">
            Belum punya akun peserta?
            <button type="button" class="font-black uppercase text-merah underline" @click="setMode('register')">Daftar sekarang</button>
          </p>
        </form>

        <form v-else class="space-y-3.5" @submit.prevent="submitRegister">
          <div class="border-2 border-ink bg-merah/10 px-3 py-2 text-xs font-bold text-ink">
            <span class="font-black uppercase text-merah">Khusus Peserta Lomba</span> — lengkapi data diri untuk mendaftar akun peserta.
          </div>

          <label class="block">
            <span class="mb-1 block text-xs font-black uppercase tracking-wider">Nama Lengkap Peserta</span>
            <input v-model="reg.namaLengkap" type="text" autocomplete="name" class="w-full border-[3px] border-ink bg-paper px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="Contoh: Budi Santoso">
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-black uppercase tracking-wider">Email</span>
            <input v-model="reg.email" type="email" autocomplete="email" class="w-full border-[3px] border-ink bg-paper px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="nama@email.com">
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-black uppercase tracking-wider">Asal Sekolah / Instansi</span>
            <input v-model="reg.asalSekolah" type="text" class="w-full border-[3px] border-ink bg-paper px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="Contoh: SMA Negeri 1 Yogyakarta">
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-xs font-black uppercase tracking-wider">No. WhatsApp</span>
              <input v-model="reg.noWhatsapp" type="text" class="w-full border-[3px] border-ink bg-paper px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="0812xxxxxxxx">
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-black uppercase tracking-wider">Kategori</span>
              <select v-model="reg.kategori" class="w-full border-[3px] border-ink bg-paper px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10">
                <option value="Siswa">Siswa</option>
                <option value="Mahasiswa">Mahasiswa</option>
                <option value="Umum">Umum</option>
              </select>
            </label>
          </div>

          <label class="block">
            <span class="mb-1 block text-xs font-black uppercase tracking-wider">Jenis Kelamin</span>
            <select v-model="reg.jenisKelamin" class="w-full border-[3px] border-ink bg-paper px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10">
              <option value="Putra">Putra</option>
              <option value="Putri">Putri</option>
            </select>
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-xs font-black uppercase tracking-wider">Kata Sandi</span>
              <input v-model="reg.password" type="password" autocomplete="new-password" class="w-full border-[3px] border-ink bg-paper px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="Minimal 6 karakter">
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-black uppercase tracking-wider">Konfirmasi Sandi</span>
              <input v-model="reg.confirmPassword" type="password" autocomplete="new-password" class="w-full border-[3px] border-ink bg-paper px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/10" placeholder="Ulangi kata sandi">
            </label>
          </div>

          <p v-if="error" class="border-2 border-merah bg-merah/10 px-3 py-2 text-sm font-semibold text-merah">{{ error }}</p>

          <button
            type="submit"
            :disabled="submitting"
            class="pressable ink-shadow w-full border-[3px] border-ink bg-merah px-4 py-3 text-sm font-black uppercase text-paper disabled:opacity-50"
          >
            {{ submitting ? 'Mendaftarkan...' : 'Daftar sebagai Peserta' }}
          </button>

          <p class="pt-1 text-center text-xs text-muted">
            Sudah punya akun (Peserta / Panitia)?
            <button type="button" class="font-black uppercase text-biru underline" @click="setMode('login')">Masuk di sini</button>
          </p>
        </form>

        <div v-if="mode === 'login'" class="mt-6 border-t-2 border-dashed border-ink/20 pt-5">
          <p class="mb-3 text-[11px] font-black uppercase tracking-wider text-muted">Akun Demo Cepat</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <button type="button" class="pressable border-2 border-ink bg-kuning/30 px-3 py-2 text-left text-xs font-bold" @click="fillDemo('peserta')">
              <div class="uppercase text-merah">Peserta</div>
              <div>peserta@menangin.id</div>
              <div class="text-muted">demo1234</div>
            </button>
            <button type="button" class="pressable border-2 border-ink bg-biru/10 px-3 py-2 text-left text-xs font-bold" @click="fillDemo('panitia')">
              <div class="uppercase text-biru">Panitia</div>
              <div>panitia@menangin.id</div>
              <div class="text-muted">demo1234</div>
            </button>
          </div>
        </div>
      </div>

      <div class="border-[3px] border-ink bg-ink p-6 text-paper ink-shadow-lg">
        <template v-if="mode === 'login'">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-kuning">Satu Pintu Masuk</p>
          <h2 class="poster-title mt-2 text-4xl text-paper">Otomatis ke dashboardmu</h2>
          <ul class="mt-6 space-y-3 text-sm text-paper/85">
            <li class="flex gap-3">
              <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-kuning text-[10px] font-black text-kuning">✓</span>
              <span><strong>Akun Peserta</strong> otomatis diarahkan ke Dashboard Peserta untuk daftar lomba, bayar, dan pantau notifikasi.</span>
            </li>
            <li class="flex gap-3">
              <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-kuning text-[10px] font-black text-kuning">✓</span>
              <span><strong>Akun Panitia</strong> otomatis diarahkan ke Pusat Kendali Panitia untuk verifikasi pembayaran, atur jadwal, dan kirim notifikasi.</span>
            </li>
            <li class="flex gap-3">
              <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-kuning text-[10px] font-black text-kuning">✓</span>
              <span>Cukup masukkan email dan kata sandi yang sudah terdaftar tanpa perlu memilih peran lagi.</span>
            </li>
          </ul>
        </template>
        <template v-else>
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-kuning">Registrasi Peserta</p>
          <h2 class="poster-title mt-2 text-4xl text-paper">Siapkan langkah juaramu</h2>
          <ul class="mt-6 space-y-3 text-sm text-paper/85">
            <li v-for="item in pesertaHighlights" :key="item" class="flex gap-3">
              <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-kuning text-[10px] font-black text-kuning">✓</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </template>

        <div class="mt-8 border-2 border-paper/20 bg-paper/5 p-4 text-xs text-paper/70">
          <strong class="text-kuning">Catatan:</strong> Pendaftaran mandiri pada halaman ini khusus untuk <strong>Peserta Lomba</strong>. Panitia masuk menggunakan akun panitia yang telah terdaftar di tab <strong>Masuk</strong>.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Role } from '#shared/types/festival'

definePageMeta({ layout: 'default' })

const route = useRoute()
const store = useFestivalStore()
const mode = ref<'login' | 'register'>(route.query.mode === 'register' ? 'register' : 'login')
const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

const reg = reactive({
  namaLengkap: '',
  email: '',
  asalSekolah: '',
  noWhatsapp: '',
  jenisKelamin: 'Putra' as 'Putra' | 'Putri',
  kategori: 'Siswa' as 'Siswa' | 'Mahasiswa' | 'Umum',
  password: '',
  confirmPassword: '',
})

const pesertaHighlights = [
  'Lengkapi data diri dan kelola profil festival.',
  'Daftar cabang solo atau tim dengan roster dinamis.',
  'Bayar via Transfer Bank, E-Wallet, atau QRIS lalu unggah bukti.',
  'Pantau status verifikasi, pass digital, dan inbox notifikasi.',
]

function setMode(next: 'login' | 'register') {
  mode.value = next
  error.value = ''
}

watch(() => route.query.mode, (value) => {
  if (value === 'register' || value === 'login') setMode(value)
})

function fillDemo(next: Role) {
  setMode('login')
  email.value = next === 'peserta' ? 'peserta@menangin.id' : 'panitia@menangin.id'
  password.value = 'demo1234'
  error.value = ''
}

async function submitLogin() {
  if (submitting.value) return
  error.value = ''
  submitting.value = true
  try {
    const result = await store.login(email.value, password.value)
    if (!result.ok) {
      error.value = result.message
      return
    }
    store.toast(result.message, 'success')
    await navigateTo(result.role === 'panitia' ? '/panitia' : '/peserta')
  } finally {
    submitting.value = false
  }
}

async function submitRegister() {
  if (submitting.value) return
  error.value = ''

  if (!reg.namaLengkap.trim()) {
    error.value = 'Nama lengkap wajib diisi.'
    return
  }
  if (!reg.email.trim()) {
    error.value = 'Email wajib diisi.'
    return
  }
  if (!reg.asalSekolah.trim() || !reg.noWhatsapp.trim()) {
    error.value = 'Asal sekolah/instansi dan nomor WhatsApp wajib diisi untuk peserta.'
    return
  }
  if (reg.password.length < 6) {
    error.value = 'Kata sandi minimal 6 karakter.'
    return
  }
  if (reg.password !== reg.confirmPassword) {
    error.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  submitting.value = true
  try {
    const result = await store.registerAccount({
      role: 'peserta',
      email: reg.email,
      password: reg.password,
      namaLengkap: reg.namaLengkap,
      asalSekolah: reg.asalSekolah,
      noWhatsapp: reg.noWhatsapp,
      jenisKelamin: reg.jenisKelamin,
      kategori: reg.kategori,
    })
    if (!result.ok) {
      error.value = result.message
      return
    }
    store.toast(result.message, 'success')
    await navigateTo('/peserta')
  } finally {
    submitting.value = false
  }
}
</script>
