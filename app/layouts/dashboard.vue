<template>
  <div class="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-[260px_1fr]">
    <aside class="border-b-[3px] border-ink bg-ink text-paper lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r-[3px]">
      <div class="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-6">
        <NuxtLink to="/" class="block">
          <div class="poster-title text-3xl leading-none text-kuning">Menangin!</div>
          <div class="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-paper/60">Dashboard {{ roleLabel }}</div>
        </NuxtLink>
        <button type="button" class="border-2 border-paper/30 px-3 py-1 text-xs font-bold uppercase lg:hidden" @click="open = !open">
          {{ open ? 'Tutup' : 'Menu' }}
        </button>
      </div>

      <div :class="open ? 'block' : 'hidden lg:block'" class="border-t border-paper/15 px-5 py-4 lg:border-t-0 lg:px-6">
        <div class="mb-5 border-2 border-paper/20 bg-paper/5 p-3">
          <div class="text-[10px] font-black uppercase tracking-wider text-kuning">{{ roleLabel }}</div>
          <div class="mt-1 truncate text-sm font-bold">{{ displayName }}</div>
          <div class="truncate text-xs text-paper/60">{{ store.session.value.email }}</div>
        </div>

        <nav class="space-y-1 text-sm font-bold">
          <NuxtLink to="/" class="block border border-transparent px-3 py-2 hover:border-paper/20 hover:bg-paper/5" @click="open = false">
            Beranda Festival
          </NuxtLink>

          <template v-if="store.session.value.role === 'peserta'">
            <NuxtLink
              to="/peserta"
              class="block border px-3 py-2"
              :class="route.path === '/peserta' ? 'border-paper/20 bg-paper/10' : 'border-transparent hover:border-paper/20 hover:bg-paper/5'"
              @click="open = false"
            >
              Dashboard Peserta
            </NuxtLink>
            <NuxtLink
              to="/peserta/sertifikat"
              class="flex items-center justify-between gap-2 border px-3 py-2"
              :class="route.path.startsWith('/peserta/sertifikat') ? 'border-paper/20 bg-paper/10' : 'border-transparent hover:border-paper/20 hover:bg-paper/5'"
              @click="open = false"
            >
              <span>Sertifikat Saya</span>
              <span v-if="hasWinnerAward" class="bg-kuning px-1.5 py-0.5 text-[9px] font-black uppercase text-ink">🏆 Juara</span>
            </NuxtLink>
          </template>

          <NuxtLink
            v-if="store.session.value.role === 'panitia'"
            to="/panitia"
            class="block border border-paper/20 bg-paper/10 px-3 py-2"
            @click="open = false"
          >
            Dashboard Panitia
          </NuxtLink>
        </nav>

        <!-- Sidebar quick section shortcuts -->
        <div v-if="sectionLinks.length > 0" class="mt-5 border-t border-paper/15 pt-4">
          <div class="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-paper/50">Navigasi Cepat</div>
          <div class="space-y-1 text-xs font-bold">
            <NuxtLink
              v-for="item in sectionLinks"
              :key="`side-${item.to}`"
              :to="item.to"
              class="block border border-transparent px-3 py-1.5 text-paper/80 hover:border-paper/20 hover:bg-paper/5 hover:text-kuning"
              @click="open = false"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </div>

        <div v-if="store.session.value.role === 'peserta'" class="mt-5 border-2 border-kuning/40 bg-kuning/10 px-3 py-2 text-xs">
          <span class="font-black text-kuning">{{ store.unreadCount.value }}</span> notifikasi belum dibaca
        </div>

        <button
          type="button"
          class="mt-6 w-full border-2 border-paper/30 px-3 py-2 text-xs font-black uppercase tracking-wider hover:border-merah hover:bg-merah"
          @click="handleLogout"
        >
          Keluar
        </button>
      </div>
    </aside>

    <div class="min-w-0">
      <header class="sticky top-0 z-30 border-b-[3px] border-ink bg-paper/95 backdrop-blur">
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 lg:px-8">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-muted">Menangin! Festival 2026</p>
            <h1 class="poster-title text-2xl sm:text-3xl">{{ pageTitle }}</h1>
          </div>
          <div class="flex items-center gap-2">
            <span class="border-2 border-ink bg-paper px-2 py-1 text-[10px] font-black uppercase">{{ roleLabel }}</span>
            <span class="border-2 border-ink px-2 py-1 text-[10px] font-black uppercase" :class="store.hydrated.value ? 'bg-hijau text-paper' : 'bg-kuning text-ink'">
              {{ store.hydrated.value ? 'Data Siap' : 'Memuat' }}
            </span>
          </div>
        </div>

        <!-- Landing-page style sticky top menu bar for fast navigation -->
        <nav v-if="sectionLinks.length > 0" class="border-t-2 border-ink/15 bg-paper-deep/90 px-5 py-2 lg:px-8">
          <div class="flex items-center gap-2 overflow-x-auto pb-0.5 text-[11px] font-black uppercase tracking-wider">
            <NuxtLink
              v-for="item in sectionLinks"
              :key="`top-${item.to}`"
              :to="item.to"
              class="shrink-0 border-2 border-ink/25 bg-paper px-3 py-1 transition-colors hover:border-ink hover:bg-kuning/40"
              :class="item.highlight ? 'border-ink bg-kuning text-ink' : 'text-ink'"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </nav>
      </header>
      <main class="px-5 py-6 lg:px-8 lg:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const store = useFestivalStore()
const route = useRoute()
const open = ref(false)

const roleLabel = computed(() => store.session.value.role === 'panitia' ? 'Panitia' : 'Peserta')
const displayName = computed(() =>
  store.currentParticipant.value?.namaLengkap
  ?? (store.session.value.displayName || (store.session.value.role === 'panitia' ? 'Komite Menangin!' : 'Tamu')),
)
const hasWinnerAward = computed(() => {
  const myIds = new Set(store.myRegistrations.value.map(r => r.id))
  return store.state.value.winners.some(w => myIds.has(w.registrationId))
})
const pageTitle = computed(() =>
  route.path.startsWith('/panitia')
    ? 'Pusat Kendali Panitia'
    : route.path.startsWith('/peserta/sertifikat')
      ? 'Klaim Sertifikat'
      : 'Dashboard Peserta',
)

const sectionLinks = computed<Array<{ label: string; to: string; highlight?: boolean }>>(() => {
  if (store.session.value.role === 'panitia' || route.path.startsWith('/panitia')) {
    return [
      { label: 'Pendaftaran', to: '/panitia#pendaftaran' },
      { label: 'Jadwal & Kuota', to: '/panitia#jadwal-kuota' },
      { label: 'Pemenang', to: '/panitia#pemenang-panitia' },
      { label: 'Notifikasi', to: '/panitia#notifikasi-panitia' },
      { label: 'Rekap Peserta', to: '/panitia#rekap' },
      {
        label: store.state.value.settings.certificateClaimEnabled ? 'Sertifikat (Aktif)' : 'Sertifikat (Terkunci)',
        to: '/panitia#sertifikat-panitia',
        highlight: store.state.value.settings.certificateClaimEnabled,
      },
      { label: 'Pengumuman', to: '/panitia#pengumuman-panitia' },
    ]
  }
  if (store.session.value.role === 'peserta' || route.path.startsWith('/peserta')) {
    return [
      { label: 'Profil', to: '/peserta#profil' },
      { label: 'Lombaku', to: '/peserta#lombaku' },
      { label: 'Pembayaran', to: '/peserta#pembayaran' },
      { label: 'Pemenang', to: '/peserta#pemenang' },
      {
        label: hasWinnerAward.value ? '🏆 Sertifikat' : 'Sertifikat',
        to: '/peserta/sertifikat',
        highlight: route.path.startsWith('/peserta/sertifikat') || store.state.value.settings.certificateClaimEnabled,
      },
      { label: 'Inbox & Info', to: '/peserta#inbox' },
    ]
  }
  return []
})

async function handleLogout() {
  await store.logout()
  await navigateTo('/login')
}
</script>
