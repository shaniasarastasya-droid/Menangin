<template>
  <div class="min-h-screen bg-paper text-ink">
    <header class="sticky top-0 z-40 border-b-[3px] border-ink bg-paper/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-6 lg:px-8">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="poster-title text-2xl leading-none sm:text-3xl">Menangin<span class="text-merah">!</span></span>
          <span class="hidden border border-ink bg-kuning px-2 py-0.5 text-[10px] font-black uppercase sm:inline">Festival 2026</span>
        </NuxtLink>

        <nav class="hidden items-center gap-6 text-xs font-black uppercase tracking-wider md:flex">
          <a href="/#kategori" class="transition-colors hover:text-merah">Kategori</a>
          <a href="/#jadwal" class="transition-colors hover:text-merah">Jadwal</a>
          <a href="/#pengumuman" class="transition-colors hover:text-merah">Pengumuman</a>
        </nav>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="border-2 border-ink bg-paper px-2.5 py-1.5 text-[11px] font-black uppercase hover:bg-kuning/30 md:hidden"
            :aria-expanded="mobileMenuOpen"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            {{ mobileMenuOpen ? 'Tutup' : 'Menu' }}
          </button>

          <NuxtLink
            v-if="!store.session.value.role"
            to="/login"
            class="pressable ink-shadow-sm border-2 border-ink bg-merah px-3.5 py-1.5 text-xs font-black uppercase text-paper"
          >
            Masuk
          </NuxtLink>
          <NuxtLink
            v-else
            :to="store.session.value.role === 'panitia' ? '/panitia' : '/peserta'"
            class="pressable ink-shadow-sm border-2 border-ink bg-kuning px-3.5 py-1.5 text-xs font-black uppercase"
          >
            Dashboard
          </NuxtLink>
        </div>
      </div>

      <!-- Mobile quick nav drawer -->
      <div v-if="mobileMenuOpen" class="border-t-2 border-ink bg-paper-deep px-5 py-3 md:hidden">
        <nav class="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wider">
          <a href="/#kategori" class="border-2 border-ink bg-paper px-3 py-1.5 hover:bg-kuning/30" @click="mobileMenuOpen = false">Kategori</a>
          <a href="/#jadwal" class="border-2 border-ink bg-paper px-3 py-1.5 hover:bg-kuning/30" @click="mobileMenuOpen = false">Jadwal</a>
          <a href="/#pengumuman" class="border-2 border-ink bg-paper px-3 py-1.5 hover:bg-kuning/30" @click="mobileMenuOpen = false">Pengumuman</a>
          <NuxtLink
            v-if="!store.session.value.role"
            to="/login?mode=register"
            class="border-2 border-ink bg-kuning px-3 py-1.5"
            @click="mobileMenuOpen = false"
          >
            Daftar Peserta →
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="border-t-[3px] border-ink bg-ink px-6 py-12 text-paper lg:px-8">
      <div class="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto_auto]">
        <div>
          <div class="poster-title text-4xl text-kuning">Menangin!</div>
          <p class="mt-2 max-w-sm text-sm text-paper/70">Festival tahunan seni, olahraga, dan akademik. Kuota terbatas, semangat tidak terbatas.</p>
        </div>
        <div class="text-sm">
          <div class="mb-2 text-xs font-black uppercase tracking-wider text-kuning">Akses</div>
          <div class="space-y-1 text-paper/80">
            <div><NuxtLink to="/login?mode=register" class="hover:text-paper">Daftar Peserta</NuxtLink></div>
            <div><NuxtLink to="/login" class="hover:text-paper">Masuk Akun</NuxtLink></div>
          </div>
        </div>
        <div class="text-sm">
          <div class="mb-2 text-xs font-black uppercase tracking-wider text-kuning">Festival</div>
          <div class="space-y-1 text-paper/80">
            <div>5–16 Desember 2026</div>
            <div>12 cabang · 15 kuota</div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const store = useFestivalStore()
const mobileMenuOpen = ref(false)
</script>
