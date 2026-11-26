<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <div class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-2.5" role="status" aria-live="polite">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pop-in ink-shadow pointer-events-auto flex items-start gap-3 border-[3px] border-ink px-4 py-3 text-sm"
      :class="toast.tone === 'error'
        ? 'bg-merah text-paper'
        : toast.tone === 'success'
          ? 'bg-hijau text-paper'
          : 'bg-kuning text-ink'"
    >
      <span
        class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border-2 text-xs font-black"
        :class="toast.tone === 'info' ? 'border-ink bg-paper text-ink' : 'border-paper/80 bg-ink/20 text-paper'"
      >
        {{ toast.tone === 'error' ? '!' : toast.tone === 'success' ? '✓' : 'i' }}
      </span>
      <div class="min-w-0 flex-1">
        <div class="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">
          {{ toast.tone === 'error' ? 'Gagal / Perhatian' : toast.tone === 'success' ? 'Berhasil' : 'Informasi' }}
        </div>
        <p class="mt-0.5 text-xs font-bold leading-snug sm:text-sm">{{ toast.message }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 px-1 text-xs font-black uppercase opacity-80 hover:opacity-100"
        aria-label="Tutup notifikasi"
        @click="dismissToast(toast.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toasts, dismissToast } = useFestivalStore()
</script>
