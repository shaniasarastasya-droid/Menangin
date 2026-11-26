<template>
  <section id="kategori" class="relative overflow-hidden bg-paper/75 px-6 py-14 sm:px-8 sm:py-16 lg:py-24">
    <div class="float-slow pointer-events-none absolute -left-10 top-12 hidden h-24 w-24 rounded-full border-2 border-ink/15 bg-kuning/30 md:block" />
    <div class="float-reverse pointer-events-none absolute -right-8 bottom-14 hidden h-20 w-20 rotate-12 border-2 border-ink/15 bg-pink/25 md:block" />

    <div class="relative z-10 mx-auto max-w-7xl">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <p class="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-merah">
            <span class="inline-block h-2 w-2 rounded-full bg-merah" />
            Bidang & Kuota
          </p>
          <h2 class="poster-title text-4xl sm:text-5xl lg:text-6xl">Pilih medanmu</h2>
        </div>
        <p class="max-w-sm text-sm leading-relaxed text-muted">
          Setiap lomba memiliki kuota <strong class="text-ink">maksimal 15</strong>. Putra & Putri pada cabang yang sama berjalan di hari yang sama.
        </p>
      </div>

      <!-- Interactive category filter pills -->
      <div class="mb-7 flex flex-wrap gap-2">
        <button
          v-for="tab in filterTabs"
          :key="tab"
          type="button"
          class="pressable border-2 border-ink px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-colors"
          :class="selectedCategory === tab ? 'bg-ink text-kuning ink-shadow-sm' : 'bg-paper text-ink hover:bg-kuning/25'"
          @click="selectedCategory = tab"
        >
          {{ tab }}
        </button>
      </div>

      <div
        class="grid gap-5"
        :class="visibleCards.length === 1 ? 'max-w-xl' : 'md:grid-cols-2 xl:grid-cols-4'"
      >
        <article
          v-for="category in visibleCards"
          :key="category.name"
          class="ink-shadow flex flex-col border-[3px] border-ink bg-paper transition-transform duration-200 hover:-translate-y-1"
        >
          <div class="border-b-[3px] border-ink px-4 py-3.5" :class="category.header">
            <div class="flex items-center justify-between gap-2">
              <h3 class="poster-title text-2xl sm:text-3xl">{{ category.name }}</h3>
              <span class="shrink-0 border-2 border-ink bg-paper px-2 py-0.5 text-[10px] font-black uppercase text-ink">
                {{ category.items.length }} lomba
              </span>
            </div>
            <p class="mt-1 text-xs font-semibold opacity-90">{{ category.tagline }}</p>
          </div>

          <div class="flex-1 divide-y-2 divide-ink/15 p-4">
            <div v-for="comp in category.items" :key="comp.id" class="py-3.5 first:pt-0 last:pb-0">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-bold leading-tight">{{ comp.name }}</div>
                  <div class="mt-0.5 text-xs text-muted">
                    {{ formatDate(comp.branch?.date ?? '') }} · {{ comp.branch?.startTime ?? '' }}–{{ comp.branch?.endTime ?? '' }}
                  </div>
                </div>
                <span v-if="comp.full" class="shrink-0 border border-ink bg-merah px-1.5 py-0.5 text-[10px] font-black uppercase text-paper">Penuh</span>
              </div>

              <div class="mt-2.5 flex items-center gap-2">
                <div class="h-2.5 flex-1 overflow-hidden border border-ink bg-paper-deep">
                  <div class="h-full border-r border-ink transition-all duration-500" :class="category.bar" :style="{ width: `${Math.min(100, (comp.filled / comp.maxQuota) * 100)}%` }" />
                </div>
                <span class="text-[11px] font-bold tabular-nums text-muted">{{ comp.filled }}/{{ comp.maxQuota }}</span>
              </div>
              <div class="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold">
                <span :class="comp.full ? 'text-merah' : 'text-hijau'">
                  {{ comp.full ? '0 slot tersisa' : `${Math.max(0, comp.maxQuota - comp.filled)} slot tersisa` }}
                </span>
                <span class="font-bold text-ink">{{ rupiah(comp.fee) }}</span>
              </div>
            </div>
          </div>

          <div class="border-t-2 border-ink/15 bg-paper-deep/60 px-4 py-2.5">
            <NuxtLink
              to="/login?mode=register"
              class="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-ink hover:text-merah"
            >
              Daftar cabang {{ category.name }} <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '#shared/types/festival'

const store = useFestivalStore()
const { state, filledSlots, isFull, getBranch } = store
const selectedCategory = useState<'Semua' | Category>('menangin:landingCategory', () => 'Semua')

const filterTabs: Array<'Semua' | Category> = ['Semua', ...store.categoryList]

const config: Record<Category, { header: string; bar: string; tagline: string }> = {
  Seni: { header: 'bg-merah text-paper', bar: 'bg-merah', tagline: 'Panggung untuk suara & melodi.' },
  'Olahraga Individu': { header: 'bg-biru text-paper', bar: 'bg-biru', tagline: 'Putra & Putri satu hari yang sama.' },
  'Olahraga Tim': { header: 'bg-hijau text-paper', bar: 'bg-hijau', tagline: 'Satu tim, satu strategi.' },
  Akademik: { header: 'bg-kuning text-ink', bar: 'bg-kuning', tagline: 'Adu logika dan gagasan.' },
}

const categoryCards = computed(() => store.categoryList.map(name => ({
  name,
  ...config[name],
  items: state.value.competitions
    .filter(competition => competition.category === name)
    .map(competition => {
      const branch = getBranch(competition.branchId)!
      const filled = filledSlots(competition.id)
      return { ...competition, branch, filled, full: isFull(competition.id) }
    }),
})))

const visibleCards = computed(() =>
  selectedCategory.value === 'Semua'
    ? categoryCards.value
    : categoryCards.value.filter(card => card.name === selectedCategory.value),
)
</script>
