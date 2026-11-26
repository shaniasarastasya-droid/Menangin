<template>
  <div>
    <FestivalHero />

    <CategoryShowcase />

    <section id="jadwal" class="relative overflow-hidden bg-paper/75 px-6 py-14 sm:px-8 sm:py-16 lg:py-24">
      <div class="drift-x pointer-events-none absolute -right-12 top-16 hidden h-24 w-24 rounded-full border-2 border-ink/15 bg-hijau/20 md:block" />
      <div class="relative z-10 mx-auto max-w-7xl">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <p class="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-hijau">
              <span class="inline-block h-2 w-2 rounded-full bg-hijau" />
              Jadwal Harian
            </p>
            <h2 class="poster-title text-4xl sm:text-5xl">Satu cabang, satu hari</h2>
          </div>
          <p class="max-w-md text-sm text-muted">Setiap cabang lomba dijadwalkan di hari berbeda. Sprint, Renang, dan Badminton menjalankan divisi Putra & Putri di hari yang sama.</p>
        </div>

        <!-- Interactive schedule category filter -->
        <div class="mb-6 flex flex-wrap gap-2">
          <button
            v-for="tab in scheduleTabs"
            :key="tab"
            type="button"
            class="pressable border-2 border-ink px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors"
            :class="scheduleFilter === tab ? 'bg-hijau text-paper ink-shadow-sm' : 'bg-paper text-ink hover:bg-kuning/25'"
            @click="scheduleFilter = tab"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Mobile airy stacked cards (< md) -->
        <div class="space-y-3 md:hidden">
          <article
            v-for="row in filteredScheduleRows"
            :key="`m-${row.id}`"
            class="ink-shadow-sm border-[3px] border-ink bg-paper p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="text-xs font-black uppercase tracking-wider text-merah">{{ formatDate(row.date) }} · {{ row.startTime }}–{{ row.endTime }}</div>
                <h3 class="mt-0.5 text-base font-black leading-tight">{{ row.name }}</h3>
              </div>
              <span class="shrink-0 border border-ink bg-paper-deep px-2 py-0.5 text-[10px] font-black uppercase">{{ row.category }}</span>
            </div>
            <p class="mt-1.5 text-xs leading-relaxed text-muted">{{ row.description }}</p>
            <div class="mt-3 space-y-1.5 border-t border-dashed border-ink/20 pt-2.5">
              <div v-for="comp in row.competitions" :key="comp.id" class="flex items-center justify-between gap-2 text-xs">
                <span class="font-semibold text-ink">{{ comp.label }}</span>
                <span class="font-black tabular-nums" :class="comp.full ? 'text-merah' : 'text-hijau'">
                  {{ comp.filled }}/{{ comp.maxQuota }}
                  <span v-if="comp.full" class="ml-1 bg-merah px-1 text-[10px] text-paper">PENUH</span>
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- Desktop full table (>= md) -->
        <div class="hidden overflow-x-auto ink-shadow border-[3px] border-ink bg-paper md:block">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b-[3px] border-ink bg-ink text-xs uppercase tracking-wider text-paper">
              <tr>
                <th class="px-4 py-3">Tanggal</th>
                <th class="px-4 py-3">Cabang</th>
                <th class="px-4 py-3">Kategori</th>
                <th class="px-4 py-3">Waktu</th>
                <th class="px-4 py-3">Divisi</th>
                <th class="px-4 py-3">Kuota</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredScheduleRows" :key="row.id" class="border-b border-ink/15 align-top transition-colors last:border-b-0 hover:bg-kuning/10">
                <td class="px-4 py-3 font-bold whitespace-nowrap">{{ formatDate(row.date) }}</td>
                <td class="px-4 py-3">
                  <div class="font-bold">{{ row.name }}</div>
                  <div class="text-xs text-muted">{{ row.description }}</div>
                </td>
                <td class="px-4 py-3"><span class="border border-ink px-2 py-0.5 text-[11px] font-bold">{{ row.category }}</span></td>
                <td class="px-4 py-3 whitespace-nowrap font-semibold">{{ row.startTime }}–{{ row.endTime }}</td>
                <td class="px-4 py-3 text-xs font-semibold">{{ row.divisions }}</td>
                <td class="px-4 py-3">
                  <div class="space-y-1">
                    <div v-for="comp in row.competitions" :key="comp.id" class="flex items-center gap-2 text-xs">
                      <span class="min-w-[7.5rem] truncate text-muted">{{ comp.label }}</span>
                      <span class="font-bold tabular-nums" :class="comp.full ? 'text-merah' : 'text-ink'">{{ comp.filled }}/{{ comp.maxQuota }}</span>
                      <span v-if="comp.full" class="bg-merah px-1 text-[10px] font-black text-paper">PENUH</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <RoleGateCards />

    <section id="pengumuman" class="relative overflow-hidden bg-paper/80 px-6 py-14 sm:px-8 sm:py-16 lg:py-24">
      <div class="float-slow pointer-events-none absolute -left-8 bottom-12 hidden h-20 w-20 rounded-full border-2 border-ink/15 bg-pink/25 md:block" />
      <div class="relative z-10 mx-auto max-w-7xl">
        <p class="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-merah">
          <span class="inline-block h-2 w-2 rounded-full bg-merah" />
          Papan Pengumuman
        </p>
        <h2 class="poster-title mb-8 text-4xl sm:text-5xl">Kabar terbaru</h2>
        <div class="grid gap-5 md:grid-cols-3">
          <article
            v-for="(item, idx) in state.announcements"
            :key="item.id"
            class="ink-shadow-sm border-[3px] border-ink bg-paper p-5 transition-transform duration-200 hover:-translate-y-1"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <span
                class="border border-ink px-2 py-0.5 text-[10px] font-black uppercase"
                :class="idx % 3 === 0 ? 'bg-kuning text-ink' : idx % 3 === 1 ? 'bg-pink text-ink' : 'bg-hijau text-paper'"
              >
                {{ item.tag }}
              </span>
              <span class="text-[11px] text-muted">{{ formatStamp(item.publishedAt) }}</span>
            </div>
            <h3 class="text-lg font-black leading-tight">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">{{ item.body }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Category } from '#shared/types/festival'

const { state, filledSlots, isFull, categoryList } = useFestivalStore()
const scheduleFilter = ref<'Semua' | Category>('Semua')
const scheduleTabs: Array<'Semua' | Category> = ['Semua', ...categoryList]

const scheduleRows = computed(() => state.value.branches.map(branch => {
  const competitions = state.value.competitions
    .filter(competition => competition.branchId === branch.id)
    .map(competition => ({
      id: competition.id,
      label: competition.division === 'Umum' || competition.division === 'Tim' ? competition.name : competition.division,
      filled: filledSlots(competition.id),
      maxQuota: competition.maxQuota,
      full: isFull(competition.id),
    }))
  const divisions = competitions.length > 1 ? 'Putra & Putri (hari sama)' : competitions[0]?.label === branch.name ? 'Umum' : competitions[0]?.label ?? 'Umum'
  return { ...branch, competitions, divisions }
}))

const filteredScheduleRows = computed(() =>
  scheduleFilter.value === 'Semua'
    ? scheduleRows.value
    : scheduleRows.value.filter(row => row.category === scheduleFilter.value),
)
</script>
