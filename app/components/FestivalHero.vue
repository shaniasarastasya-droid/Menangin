<template>
  <section class="relative overflow-hidden border-b-[3px] border-ink bg-paper/90">
    <!-- Decorative shapes: subtle on mobile (airy whitespace), playful on desktop margins -->
    <div class="float-slow pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full border-[3px] border-ink bg-kuning/55 sm:h-48 sm:w-48 lg:-right-20 lg:-top-20 lg:h-64 lg:w-64" />
    <div class="float-reverse pointer-events-none absolute right-20 top-32 hidden h-16 w-16 rotate-12 border-[3px] border-ink bg-pink/35 halftone lg:block" />
    <div class="drift-x pointer-events-none absolute -left-5 bottom-16 hidden h-12 w-12 rounded-full border-2 border-ink/40 bg-biru/20 xl:block" />
    <div class="float-slow pointer-events-none absolute left-[48%] top-8 hidden h-5 w-5 rotate-45 border-2 border-ink bg-hijau/45 lg:block" />
    <div class="spin-slow pointer-events-none absolute bottom-12 right-[48%] hidden text-xl font-black text-merah/70 lg:block" aria-hidden="true">✦</div>
    <div class="float-reverse pointer-events-none absolute left-5 top-20 hidden h-3.5 w-3.5 rounded-full border-2 border-ink bg-pink/70 xl:block" />

    <div class="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-8 lg:px-8 lg:py-20 xl:gap-10">
      <div class="relative z-10 min-w-0">
        <div class="mb-5 inline-flex items-center gap-2.5 border-2 border-ink bg-paper ink-shadow-sm px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] sm:mb-6 sm:text-xs">
          <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-merah" />
          Festival Tahunan · 5–16 Desember 2026
        </div>

        <!-- Balanced desktop headline: bold & commanding while leaving comfortable room for the postcard -->
        <h1 class="poster-title text-[clamp(3rem,11vw,4.5rem)] text-ink lg:text-[clamp(4.4rem,6.3vw,6.2rem)]">
          MENANGIN<span class="text-merah">!</span>
        </h1>
        <div class="mt-2 inline-block -rotate-1 border-[3px] border-ink bg-kuning px-3.5 py-1.5 text-sm font-black uppercase tracking-tight ink-shadow sm:px-4 sm:py-2 sm:text-lg lg:text-xl">
          Satu kota, tiga medan juara
        </div>

        <p class="mt-6 max-w-xl text-sm leading-relaxed text-ink/80 sm:mt-7 sm:text-base lg:text-lg">
          Seni yang berani, olahraga yang bikin lapangan ramai, dan akademik yang mengasah kepala.
          Daftar per cabang, kuota hanya <strong class="bg-kuning px-1">15 peserta</strong> per lomba.
        </p>

        <div class="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
          <NuxtLink
            to="/login?mode=register"
            class="pressable ink-shadow-lg inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-merah px-6 py-3 text-sm font-black uppercase tracking-wide text-paper"
          >
            Daftar sebagai Peserta
            <span aria-hidden="true">→</span>
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="pressable ink-shadow inline-flex items-center justify-center gap-2 border-[3px] border-ink bg-paper px-6 py-3 text-sm font-black uppercase tracking-wide text-ink hover:bg-kuning/25"
          >
            Masuk Akun
            <span aria-hidden="true">↗</span>
          </NuxtLink>
        </div>

        <div class="mt-8 grid grid-cols-2 gap-x-5 gap-y-2.5 text-[11px] font-bold uppercase tracking-wider text-muted sm:mt-10 sm:flex sm:flex-wrap sm:gap-x-5 sm:text-xs">
          <span><strong class="mr-1 text-merah">12</strong>cabang lomba</span>
          <span><strong class="mr-1 text-biru">12</strong>hari festival</span>
          <span><strong class="mr-1 text-hijau">15</strong>kuota per cabang</span>
          <span><strong class="mr-1 text-ink">3</strong>bidang utama</span>
        </div>
      </div>

      <div class="relative z-10 flex min-w-0 items-center justify-center px-3 py-6 sm:px-4 lg:px-2">
        <div class="relative w-full max-w-[23rem] sm:max-w-[26.5rem] lg:max-w-[29rem]">
          <div class="rotate-1 border-[3px] border-ink bg-paper ink-shadow-lg transition-transform duration-300 hover:rotate-0">
            <div class="flex items-center justify-between border-b-[3px] border-ink bg-biru px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-paper sm:text-xs">
              <span class="inline-flex items-center gap-2">
                <span class="inline-flex gap-1">
                  <span class="h-2 w-2 rounded-full border border-ink bg-merah" />
                  <span class="h-2 w-2 rounded-full border border-ink bg-kuning" />
                  <span class="h-2 w-2 rounded-full border border-ink bg-hijau" />
                </span>
                Kartu Pos Festival
              </span>
              <span>No. 026</span>
            </div>
            <div class="halftone relative flex h-48 items-center justify-center border-b-[3px] border-ink bg-gradient-to-br from-paper-deep via-kuning/20 to-pink/20 sm:h-56">
              <span class="spin-slow pointer-events-none absolute left-5 top-4 text-lg font-black text-biru" aria-hidden="true">✦</span>
              <span class="float-slow pointer-events-none absolute bottom-4 right-5 text-lg font-black text-hijau" aria-hidden="true">★</span>
              <NuxtLink
                to="/login?mode=register"
                class="sticker-wiggle block -rotate-6 border-[3px] border-ink bg-merah px-6 py-3.5 text-center text-paper ink-shadow transition-transform hover:scale-105 sm:px-7 sm:py-4"
                title="Mulai daftar lomba sekarang"
              >
                <div class="poster-title text-2xl sm:text-3xl">Sign · Play ·</div>
                <div class="poster-title text-4xl text-kuning sm:text-5xl">Win!</div>
              </NuxtLink>
            </div>
            <div class="grid grid-cols-[0.8fr_1.1fr_1.1fr] divide-x-[3px] divide-ink text-center">
              <button
                type="button"
                class="cursor-pointer px-1.5 py-4 transition-colors hover:bg-merah/15 focus:bg-merah/15"
                @click="jumpToCategory('Seni')"
              >
                <div class="poster-title whitespace-nowrap text-xs leading-tight tracking-tight text-merah sm:text-sm">Seni</div>
                <div class="mt-1 text-[10px] font-bold uppercase text-muted">2 cabang</div>
              </button>
              <button
                type="button"
                class="cursor-pointer px-1.5 py-4 transition-colors hover:bg-biru/15 focus:bg-biru/15"
                @click="jumpToCategory('Olahraga Individu')"
              >
                <div class="poster-title whitespace-nowrap text-xs leading-tight tracking-tight text-biru sm:text-sm">Olahraga</div>
                <div class="mt-1 text-[10px] font-bold uppercase text-muted">7 cabang</div>
              </button>
              <button
                type="button"
                class="cursor-pointer px-1.5 py-4 transition-colors hover:bg-hijau/15 focus:bg-hijau/15"
                @click="jumpToCategory('Akademik')"
              >
                <div class="poster-title whitespace-nowrap text-xs leading-tight tracking-tight text-hijau sm:text-sm">Akademik</div>
                <div class="mt-1 text-[10px] font-bold uppercase text-muted">3 cabang</div>
              </button>
            </div>
          </div>

          <div class="bob-badge absolute -bottom-7 left-3 z-20 border-[3px] border-ink bg-hijau px-3 py-1 text-[11px] font-black uppercase text-paper ink-shadow-sm sm:text-xs">
            Kuota terbatas!
          </div>
          <div class="float-slow absolute -right-1 -top-3.5 z-20 rotate-6 border-2 border-ink bg-pink px-2.5 py-1 text-[10px] font-black uppercase text-ink ink-shadow-sm sm:-right-2">
            2026 Edition ✦
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-hidden border-t-[3px] border-ink bg-kuning py-2.5">
      <div class="marquee-track">
        <span v-for="index in 2" :key="index" class="flex shrink-0 whitespace-nowrap text-xs font-black uppercase tracking-[0.2em] sm:text-sm">
          <span v-for="branch in state.branches" :key="`${index}-${branch.id}`" class="mx-5 inline-flex items-center gap-3">
            {{ branch.name }} · {{ formatDate(branch.date) }}
            <span class="text-merah">✦</span>
          </span>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Category } from '#shared/types/festival'

const { state } = useFestivalStore()
const selectedCategory = useState<'Semua' | Category>('menangin:landingCategory', () => 'Semua')

function jumpToCategory(category: Category) {
  selectedCategory.value = category
  if (import.meta.client) {
    document.getElementById('kategori')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>
