<template>
  <section class="relative overflow-hidden border-y-[3px] border-ink bg-paper-deep/90 px-6 py-14 sm:px-8 sm:py-16 lg:py-20">
    <div class="float-slow pointer-events-none absolute -right-10 -top-10 hidden h-28 w-28 rounded-full border-2 border-ink/15 bg-kuning/40 md:block" />
    <div class="float-reverse pointer-events-none absolute -left-8 bottom-8 hidden h-20 w-20 rotate-12 border-2 border-ink/15 bg-biru/20 md:block" />
    <div class="relative z-10 mx-auto max-w-7xl">
      <div class="mb-8 text-center">
        <p class="mb-2 text-xs font-black uppercase tracking-[0.25em] text-biru">Pilih Aksesmu</p>
        <h2 class="poster-title text-4xl sm:text-5xl">Masuk ke arena</h2>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <NuxtLink to="/login?mode=register" class="group pressable ink-shadow-lg relative overflow-hidden border-[3px] border-ink bg-paper p-6 sm:p-7">
          <div class="absolute right-0 top-0 border-b-[3px] border-l-[3px] border-ink bg-merah px-4 py-2 text-xs font-black uppercase text-paper">
            Peserta
          </div>
          <div class="mb-4 flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-kuning text-2xl ink-shadow-sm">🎫</div>
          <h3 class="poster-title text-2xl sm:text-3xl">Daftar / Masuk Peserta</h3>
          <p class="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Kelola data diri, daftar lomba solo/tim, bayar via Bank/E-Wallet/QRIS, unggah bukti transfer, dan terima notifikasi panitia.
          </p>
          <div class="mt-5 flex flex-wrap gap-2 text-[11px] font-bold uppercase">
            <span class="border border-ink px-2 py-1">Profil</span>
            <span class="border border-ink px-2 py-1">Registrasi</span>
            <span class="border border-ink px-2 py-1">Pembayaran</span>
            <span class="border border-ink px-2 py-1">Inbox</span>
          </div>
          <div class="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase text-merah">
            Buka area peserta <span class="transition-transform group-hover:translate-x-1">→</span>
          </div>
        </NuxtLink>

        <NuxtLink to="/login" class="group pressable ink-shadow-lg relative overflow-hidden border-[3px] border-ink bg-ink p-6 text-paper sm:p-7">
          <div class="absolute right-0 top-0 border-b-[3px] border-l-[3px] border-paper bg-biru px-4 py-2 text-xs font-black uppercase text-paper">
            Panitia
          </div>
          <div class="mb-4 flex h-14 w-14 items-center justify-center border-[3px] border-paper bg-paper text-2xl text-ink ink-shadow-sm">📋</div>
          <h3 class="poster-title text-2xl text-kuning sm:text-3xl">Masuk sebagai Panitia</h3>
          <p class="mt-3 max-w-sm text-sm leading-relaxed text-paper/75">
            Verifikasi bukti transfer, atur jadwal & kuota, input pemenang per cabang, dan kirim notifikasi Pelunasan/Trophy Stand By.
          </p>
          <div class="mt-5 flex flex-wrap gap-2 text-[11px] font-bold uppercase text-paper/85">
            <span class="border border-paper/40 px-2 py-1">Verifikasi</span>
            <span class="border border-paper/40 px-2 py-1">Jadwal</span>
            <span class="border border-paper/40 px-2 py-1">Pemenang</span>
            <span class="border border-paper/40 px-2 py-1">Notifikasi</span>
          </div>
          <div class="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase text-kuning">
            Buka dashboard panitia <span class="transition-transform group-hover:translate-x-1">→</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
