<template>
  <div class="space-y-6">
    <div v-if="!store.hydrated.value" class="border-2 border-dashed border-ink/30 bg-paper-deep px-4 py-8 text-center text-sm font-semibold text-muted">
      Memuat data festival...
    </div>

    <template v-else>
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in kpis" :key="card.label" class="ink-shadow-sm border-[3px] border-ink p-4" :class="card.bg">
          <div class="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">{{ card.label }}</div>
          <div class="poster-title mt-2 text-4xl">{{ card.value }}</div>
          <div class="mt-1 text-xs font-semibold opacity-80">{{ card.note }}</div>
        </article>
      </section>

      <section id="pendaftaran" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-biru">Verifikasi Bukti Transfer</p>
            <h2 class="poster-title text-3xl">Pendaftaran Masuk</h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <select v-model="filters.category" class="border-2 border-ink bg-paper px-2 py-1.5 text-xs font-bold">
              <option value="Semua">Semua Kategori</option>
              <option v-for="category in store.categoryList" :key="category" :value="category">{{ category }}</option>
            </select>
            <select v-model="filters.branchId" class="border-2 border-ink bg-paper px-2 py-1.5 text-xs font-bold">
              <option value="all">Semua Cabang</option>
              <option v-for="branch in filteredBranches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
            </select>
            <select v-model="filters.type" class="border-2 border-ink bg-paper px-2 py-1.5 text-xs font-bold">
              <option value="Semua">Semua Tipe</option>
              <option value="Putra">Putra</option>
              <option value="Putri">Putri</option>
              <option value="Tim">Tim</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto border-2 border-ink">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-ink text-[11px] uppercase tracking-wider text-paper">
              <tr>
                <th class="px-3 py-2">Peserta / Tim</th>
                <th class="px-3 py-2">Cabang</th>
                <th class="px-3 py-2">Kuota</th>
                <th class="px-3 py-2">Pembayaran</th>
                <th class="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRegistrations" :key="row.id" class="border-t border-ink/15 align-top">
                <td class="px-3 py-3">
                  <div class="font-bold">{{ row.participant?.namaLengkap ?? 'Peserta' }}</div>
                  <div class="text-xs text-muted">{{ row.type === 'team' ? `Tim: ${row.teamName}` : row.participant?.asalSekolah }}</div>
                </td>
                <td class="px-3 py-3">
                  <div class="font-semibold">{{ row.competition?.name }}</div>
                  <div class="text-xs text-muted">{{ row.branch?.date ? formatDate(row.branch.date) : '' }} · {{ row.branch?.startTime }}–{{ row.branch?.endTime }}</div>
                </td>
                <td class="px-3 py-3 text-xs font-bold tabular-nums">{{ row.filled }}/{{ row.competition?.maxQuota ?? MAX_QUOTA }}</td>
                <td class="px-3 py-3">
                  <span class="inline-block px-2 py-1 text-[11px] font-black uppercase" :class="paymentTone(row.paymentStatus)">{{ row.paymentStatus }}</span>
                </td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-1.5">
                    <button type="button" class="border-2 border-ink bg-paper px-2 py-1 text-[11px] font-black uppercase hover:bg-kuning/20" @click="reviewTarget = row.raw">
                      {{ row.proof ? 'Review' : 'Detail' }}
                    </button>
                    <button type="button" class="border-2 border-merah/60 bg-paper px-2 py-1 text-[11px] font-bold uppercase text-merah hover:bg-merah hover:text-paper" @click="deleteRegistration(row.id, row.participant?.namaLengkap ?? 'Peserta')">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredRegistrations.length === 0">
                <td colspan="5" class="px-3 py-8 text-center text-sm text-muted">Tidak ada pendaftaran untuk filter ini.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div id="jadwal-kuota" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-hijau">Jadwal & Kuota</p>
          <h2 class="poster-title mb-4 text-3xl">Atur cabang</h2>
          <div class="space-y-3">
            <div v-for="row in scheduleEditorRows" :key="row.branch.id" class="border-2 border-ink/20 bg-paper-deep p-3">
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div class="font-black">{{ row.branch.name }}</div>
                  <div class="text-xs text-muted">{{ row.branch.category }} · {{ row.divisions }}</div>
                </div>
                <button type="button" class="border-2 border-ink bg-kuning px-2 py-1 text-[11px] font-black uppercase" @click="saveSchedule(row.branch.id)">Simpan</button>
              </div>
              <div class="grid gap-2 sm:grid-cols-4">
                <label class="block sm:col-span-2">
                  <span class="mb-1 block text-[10px] font-black uppercase text-muted">Tanggal (unik per cabang)</span>
                  <input :value="scheduleDraft[row.branch.id]?.date ?? row.branch.date" type="date" class="w-full border-2 border-ink px-2 py-1.5 text-sm" @input="setScheduleField(row.branch.id, 'date', ($event.target as HTMLInputElement).value)">
                </label>
                <label class="block">
                  <span class="mb-1 block text-[10px] font-black uppercase text-muted">Mulai</span>
                  <input :value="scheduleDraft[row.branch.id]?.startTime ?? row.branch.startTime.replace('.', ':')" type="time" class="w-full border-2 border-ink px-2 py-1.5 text-sm" @input="setScheduleField(row.branch.id, 'startTime', ($event.target as HTMLInputElement).value)">
                </label>
                <label class="block">
                  <span class="mb-1 block text-[10px] font-black uppercase text-muted">Selesai</span>
                  <input :value="scheduleDraft[row.branch.id]?.endTime ?? row.branch.endTime.replace('.', ':')" type="time" class="w-full border-2 border-ink px-2 py-1.5 text-sm" @input="setScheduleField(row.branch.id, 'endTime', ($event.target as HTMLInputElement).value)">
                </label>
              </div>
              <div class="mt-3 grid gap-2.5" :class="row.competitions.length > 1 ? 'sm:grid-cols-2' : ''">
                <div v-for="comp in row.competitions" :key="comp.id" class="min-w-0 border-2 border-ink/20 bg-paper p-3 text-xs">
                  <div class="mb-2.5 flex items-center justify-between gap-2">
                    <span class="truncate font-black text-ink">{{ comp.name }}</span>
                    <span
                      class="shrink-0 border border-ink/30 px-1.5 py-0.5 text-[10px] font-black tabular-nums"
                      :class="store.isFull(comp.id) ? 'bg-merah text-paper border-merah' : 'bg-paper-deep text-ink'"
                    >
                      {{ store.filledSlots(comp.id) }}/{{ comp.maxQuota }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <label class="block min-w-0">
                      <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted">Kuota</span>
                      <input
                        :value="getQuotaDraft(comp.id)"
                        type="number"
                        min="1"
                        :max="MAX_QUOTA"
                        class="w-full min-w-0 border-2 border-ink bg-paper px-2 py-1.5 text-xs font-bold tabular-nums outline-none focus:bg-kuning/10"
                        @input="setQuotaDraft(comp.id, Number(($event.target as HTMLInputElement).value))"
                      >
                    </label>
                    <label class="block min-w-0">
                      <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted">Biaya (Rp)</span>
                      <input
                        :value="getFeeDraft(comp.id)"
                        type="number"
                        min="0"
                        step="5000"
                        class="w-full min-w-0 border-2 border-ink bg-paper px-2 py-1.5 text-xs font-bold tabular-nums outline-none focus:bg-kuning/10"
                        @input="setFeeDraft(comp.id, Number(($event.target as HTMLInputElement).value))"
                      >
                    </label>
                  </div>
                  <div class="mt-2.5 flex items-center justify-between gap-2 border-t border-dashed border-ink/15 pt-2">
                    <span class="truncate text-[11px] font-bold text-muted">{{ rupiah(getFeeDraft(comp.id)) }}</span>
                    <button
                      type="button"
                      class="shrink-0 border-2 border-ink bg-kuning px-3 py-1 text-[10px] font-black uppercase hover:bg-kuning/80"
                      @click="saveCompetition(comp.id)"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div id="pemenang-panitia" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-merah">Input Pemenang & Hadiah</p>
            <h2 class="poster-title mb-4 text-3xl">Per cabang</h2>

            <label class="block">
              <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Cabang Lomba</span>
              <select v-model="winnerCompetitionId" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold">
                <option v-for="comp in store.state.value.competitions" :key="comp.id" :value="comp.id">{{ comp.name }}</option>
              </select>
            </label>

            <div class="mt-4 space-y-3">
              <div v-for="rank in ([1, 2, 3] as const)" :key="rank" class="border-2 border-ink/20 bg-paper-deep p-3">
                <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span class="text-[11px] font-black uppercase">Juara {{ rank }}</span>
                  <span v-if="store.winnerFor(winnerCompetitionId, rank)" class="border border-ink bg-hijau px-2 py-0.5 text-[10px] font-black uppercase text-paper">
                    Tersimpan · {{ rupiah(store.winnerFor(winnerCompetitionId, rank)?.prizeAmount ?? 0) }}
                  </span>
                </div>
                <div class="space-y-2">
                  <select v-model="winnerDraft[rank]" class="w-full border-2 border-ink bg-paper px-2 py-1.5 text-sm font-semibold">
                    <option value="">— Pilih pendaftar —</option>
                    <option v-for="reg in winnerCandidates" :key="reg.id" :value="reg.id">{{ reg.label }}</option>
                  </select>
                  <div class="flex flex-wrap items-center gap-2">
                    <label class="flex min-w-0 flex-1 items-center gap-2">
                      <span class="shrink-0 text-[10px] font-black uppercase text-muted">Hadiah (Rp)</span>
                      <input
                        v-model.number="prizeDraft[rank]"
                        type="number"
                        min="0"
                        step="50000"
                        class="w-full min-w-0 border-2 border-ink bg-paper px-2 py-1.5 text-xs font-bold tabular-nums"
                        placeholder="Contoh: 1500000"
                      >
                    </label>
                    <button
                      type="button"
                      class="shrink-0 border-2 border-ink bg-kuning px-3 py-1.5 text-[11px] font-black uppercase hover:bg-kuning/80"
                      @click="saveWinner(rank)"
                    >
                      Simpan
                    </button>
                  </div>
                  <div class="text-[11px] font-semibold text-muted">
                    Nominal hadiah: <strong class="text-ink">{{ rupiah(prizeDraft[rank] || 0) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="notifikasi-panitia" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
            <div class="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.25em] text-biru">Kirim Notifikasi</p>
                <h2 class="poster-title text-3xl">Ke peserta</h2>
              </div>
              <button
                type="button"
                class="border-2 border-ink px-2.5 py-1 text-[10px] font-black uppercase"
                :class="showChannelConfig ? 'bg-ink text-paper' : 'bg-kuning text-ink hover:bg-kuning/80'"
                @click="showChannelConfig = !showChannelConfig"
              >
                {{ showChannelConfig ? 'Tutup Pengaturan' : '⚙ Atur Kirim Otomatis' }}
              </button>
            </div>

            <div v-if="showChannelConfig" class="mb-4 space-y-3 border-2 border-ink bg-paper-deep p-3.5 text-xs">
              <div>
                <div class="font-black uppercase tracking-wider text-hijau">WhatsApp Gateway (Kirim Langsung Tanpa Login WA)</div>
                <p class="mt-1 text-[11px] leading-relaxed text-muted">
                  Agar pesan WA terkirim otomatis dari server tanpa perlu scan QR/login WhatsApp Web di browser, masukkan token gateway (mis. akun gratis <strong>fonnte.com</strong> atau Meta Cloud API).
                </p>
              </div>
              <div class="grid gap-2 sm:grid-cols-2">
                <label class="block">
                  <span class="mb-1 block text-[10px] font-black uppercase text-muted">Provider WA</span>
                  <select v-model="channelForm.whatsappProvider" class="w-full border-2 border-ink bg-paper px-2 py-1.5 text-xs font-semibold" @change="onProviderChange">
                    <option value="fonnte">Fonnte (Cukup 1 Token)</option>
                    <option value="wablas">Wablas</option>
                    <option value="meta">Meta WhatsApp Cloud API</option>
                    <option value="webhook">Custom Webhook</option>
                  </select>
                </label>
                <label class="block">
                  <span class="mb-1 block text-[10px] font-black uppercase text-muted">Token API WhatsApp</span>
                  <input
                    v-model="channelForm.whatsappApiToken"
                    type="password"
                    class="w-full border-2 border-ink bg-paper px-2 py-1.5 text-xs font-semibold"
                    :placeholder="channelForm.hasWhatsappToken ? '•••••• (tersimpan, isi untuk ganti)' : 'Tempel token gateway WA'"
                  >
                </label>
                <label class="block sm:col-span-2">
                  <span class="mb-1 block text-[10px] font-black uppercase text-muted">Endpoint API URL</span>
                  <input
                    v-model="channelForm.whatsappApiUrl"
                    type="url"
                    class="w-full border-2 border-ink bg-paper px-2 py-1.5 text-xs font-semibold"
                    placeholder="https://api.fonnte.com/send"
                  >
                </label>
              </div>

              <div class="border-t border-dashed border-ink/20 pt-3">
                <div class="mb-2 font-black uppercase tracking-wider text-biru">Email SMTP (Opsional — Kirim Otomatis Tanpa Buka Gmail)</div>
                <div class="grid gap-2 sm:grid-cols-2">
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase text-muted">SMTP Host</span>
                    <input v-model="channelForm.smtpHost" type="text" class="w-full border-2 border-ink bg-paper px-2 py-1.5 text-xs font-semibold" placeholder="smtp.gmail.com">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase text-muted">Port</span>
                    <input v-model.number="channelForm.smtpPort" type="number" class="w-full border-2 border-ink bg-paper px-2 py-1.5 text-xs font-semibold" placeholder="587">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase text-muted">Email Pengirim (SMTP User)</span>
                    <input v-model="channelForm.smtpUser" type="email" class="w-full border-2 border-ink bg-paper px-2 py-1.5 text-xs font-semibold" placeholder="panitia@gmail.com">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase text-muted">App Password</span>
                    <input
                      v-model="channelForm.smtpPass"
                      type="password"
                      class="w-full border-2 border-ink bg-paper px-2 py-1.5 text-xs font-semibold"
                      :placeholder="channelForm.hasSmtpPass ? '•••••• (tersimpan)' : 'App Password SMTP'"
                    >
                  </label>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  :disabled="savingConfig"
                  class="pressable border-2 border-ink bg-hijau px-3 py-1.5 text-[11px] font-black uppercase text-paper disabled:opacity-50"
                  @click="saveChannelSettings"
                >
                  {{ savingConfig ? 'Menyimpan...' : 'Simpan Pengaturan' }}
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <label class="block">
                <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Jenis Notifikasi</span>
                <select v-model="notif.type" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold">
                  <option value="Pelunasan Pembayaran">Pelunasan Pembayaran</option>
                  <option value="Stand By Pembagian Trophy">Stand By Pembagian Trophy</option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Penerima</span>
                <select v-model="notif.recipient" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold">
                  <option value="branch">Semua pendaftar cabang</option>
                  <option value="winners">Hanya pemenang cabang</option>
                  <option value="all">Semua peserta terdaftar</option>
                </select>
              </label>
              <label v-if="notif.recipient !== 'all'" class="block">
                <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Target Cabang</span>
                <select v-model="notif.competitionId" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold">
                  <option value="">Pilih cabang...</option>
                  <option v-for="comp in store.state.value.competitions" :key="comp.id" :value="comp.id">{{ comp.name }}</option>
                </select>
              </label>

              <div class="border-2 border-ink/20 bg-paper-deep p-3">
                <div class="mb-2 text-[10px] font-black uppercase tracking-wider text-muted">Saluran Pengiriman</div>
                <div class="grid gap-2 sm:grid-cols-2">
                  <label class="flex cursor-pointer items-center justify-between gap-2 border-2 border-ink bg-paper px-2.5 py-2 text-xs font-bold">
                    <span class="flex items-center gap-2">
                      <input v-model="notif.whatsapp" type="checkbox" class="h-4 w-4 accent-hijau">
                      <span>WhatsApp</span>
                    </span>
                    <span class="px-1.5 py-0.5 text-[9px] font-black uppercase" :class="channelStatus.whatsappConfigured ? 'bg-hijau text-paper' : 'bg-kuning text-ink'">
                      {{ channelStatus.whatsappConfigured ? 'API Aktif' : 'WA Web / App' }}
                    </span>
                  </label>
                  <label class="flex cursor-pointer items-center justify-between gap-2 border-2 border-ink bg-paper px-2.5 py-2 text-xs font-bold">
                    <span class="flex items-center gap-2">
                      <input v-model="notif.email" type="checkbox" class="h-4 w-4 accent-biru">
                      <span>Email</span>
                    </span>
                    <span class="px-1.5 py-0.5 text-[9px] font-black uppercase" :class="channelStatus.smtpConfigured ? 'bg-hijau text-paper' : 'bg-kuning text-ink'">
                      {{ channelStatus.smtpConfigured ? 'SMTP Aktif' : 'Gmail Panitia' }}
                    </span>
                  </label>
                </div>
                <p class="mt-2 text-[11px] text-muted">
                  Pengirim email panitia: <strong class="text-ink">{{ store.session.value.email || 'panitia@menangin.id' }}</strong>.
                  Notifikasi disimpan ke inbox peserta & diteruskan ke <strong>WhatsApp</strong> serta <strong>Email</strong> peserta.
                </p>
              </div>

              <div v-if="notifPreviewRecipients.length > 0" class="border-2 border-ink/15 bg-paper-deep p-2.5 text-xs">
                <div class="mb-1.5 flex items-center justify-between">
                  <span class="text-[10px] font-black uppercase tracking-wider text-muted">Penerima Cocok</span>
                  <span class="bg-ink px-1.5 py-0.5 text-[10px] font-black text-paper">{{ notifPreviewRecipients.length }} peserta</span>
                </div>
                <div class="max-h-28 space-y-1 overflow-y-auto pr-1">
                  <div v-for="target in notifPreviewRecipients" :key="target.id" class="flex flex-wrap items-center justify-between gap-1 border border-ink/10 bg-paper px-2 py-1 text-[11px]">
                    <span class="font-bold">{{ target.namaLengkap }}</span>
                    <span class="truncate text-muted">
                      {{ target.noWhatsapp || 'Tanpa WA' }} · {{ target.email || 'Tanpa Email' }}
                    </span>
                  </div>
                </div>
              </div>

              <label class="block">
                <span class="mb-1 block text-[11px] font-black uppercase tracking-wider text-muted">Pesan (opsional)</span>
                <textarea v-model="notif.message" rows="3" class="w-full border-2 border-ink px-3 py-2 text-sm" :placeholder="notif.type === 'Pelunasan Pembayaran' ? 'Segera lunasi pembayaran...' : 'Harap stand by di area podium...'"></textarea>
              </label>

              <button
                type="button"
                :disabled="sendingNotif"
                class="pressable ink-shadow w-full border-[3px] border-ink bg-biru px-4 py-2.5 text-sm font-black uppercase text-paper disabled:opacity-50"
                @click="sendNotif"
              >
                {{ sendingNotif ? 'Mengirim...' : 'Kirim Notifikasi' }}
              </button>

              <div v-if="deliveryReports.length > 0" class="space-y-2 border-2 border-ink bg-paper-deep p-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-[10px] font-black uppercase tracking-wider text-ink">Pengiriman WhatsApp & Email</span>
                  <a
                    v-if="bulkMailtoUrl"
                    :href="bulkMailtoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="border border-ink bg-biru px-2 py-0.5 text-[10px] font-black uppercase text-paper hover:opacity-90"
                  >
                    Email Semua (BCC)
                  </a>
                </div>
                <div class="max-h-56 space-y-2 overflow-y-auto pr-1">
                  <div v-for="item in deliveryReports" :key="item.participantId" class="border border-ink/20 bg-paper p-2.5 text-xs">
                    <div class="flex flex-wrap items-center justify-between gap-1">
                      <span class="font-black text-ink">{{ item.namaLengkap }}</span>
                      <button
                        v-if="item.whatsapp?.messageText"
                        type="button"
                        class="text-[10px] font-bold uppercase text-muted underline hover:text-ink"
                        @click="copyNotifText(item.whatsapp.messageText)"
                      >
                        Salin Pesan
                      </button>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      <template v-if="item.whatsapp">
                        <template v-if="item.whatsapp.status === 'sent'">
                          <span class="inline-flex items-center gap-1 border-2 border-ink bg-hijau px-2 py-1 text-[10px] font-black uppercase text-paper">
                            ✓ WA Terkirim Otomatis ({{ item.whatsapp.target }})
                          </span>
                        </template>
                        <template v-else-if="item.whatsapp.target">
                          <a
                            :href="item.whatsapp.appUrl || item.whatsapp.url"
                            class="inline-flex items-center gap-1 border-2 border-ink bg-hijau px-2 py-1 text-[10px] font-black uppercase text-paper hover:opacity-90"
                          >
                            <span>Buka WA App</span>
                            <span class="font-semibold opacity-90">({{ item.whatsapp.target }})</span>
                          </a>
                          <a
                            :href="item.whatsapp.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 border-2 border-ink bg-kuning px-2 py-1 text-[10px] font-black uppercase text-ink hover:bg-kuning/80"
                          >
                            WA Web
                          </a>
                        </template>
                        <span v-else class="border border-ink/30 bg-paper-deep px-2 py-1 text-[10px] font-semibold text-muted">
                          WA: {{ item.whatsapp.detail }}
                        </span>
                      </template>
                      <template v-if="item.email">
                        <span
                          v-if="item.email.status === 'sent'"
                          class="inline-flex items-center gap-1 border-2 border-ink bg-hijau px-2 py-1 text-[10px] font-black uppercase text-paper"
                        >
                          ✓ Email Terkirim Otomatis ({{ item.email.target }})
                        </span>
                        <a
                          v-else-if="item.email.gmailUrl || item.email.url"
                          :href="item.email.gmailUrl || item.email.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 border-2 border-ink bg-biru px-2 py-1 text-[10px] font-black uppercase text-paper hover:opacity-90"
                        >
                          <span>Kirim Email</span>
                          <span class="font-semibold opacity-85">({{ item.email.target }})</span>
                        </a>
                        <span v-else class="border border-ink/30 bg-paper-deep px-2 py-1 text-[10px] font-semibold text-muted">
                          Email: {{ item.email.detail }}
                        </span>
                      </template>
                    </div>
                    <p v-if="item.whatsapp?.status === 'failed'" class="mt-1.5 text-[11px] font-semibold text-merah">
                      Gagal kirim WA otomatis: {{ item.whatsapp.detail }}
                    </p>
                  </div>
                </div>
                <div v-if="!channelStatus.whatsappConfigured && notif.whatsapp" class="border border-dashed border-ink/30 bg-kuning/20 p-2 text-[11px] leading-relaxed text-ink">
                  <strong>Ingin kirim WA langsung tanpa login WhatsApp?</strong> Aktifkan Gateway WA (1 token) lewat tombol
                  <button type="button" class="font-black uppercase text-biru underline" @click="showChannelConfig = true">Atur Kirim Otomatis</button>.
                  Tanpa gateway, WhatsApp mewajibkan akun WA aktif di aplikasi atau browser.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- REKAP KESELURUHAN PESERTA & CAPAIAN JUARA PER LOMBA -->
      <section id="rekap" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-hijau">Rekapitulasi Festival</p>
            <h2 class="poster-title text-3xl">Rekap Peserta & Capaian Juara</h2>
            <p class="mt-1 text-xs text-muted">Diurutkan otomatis per cabang lomba dari <strong>Juara 1 → Juara 2 → Juara 3 → Peserta</strong>.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="pressable ink-shadow-sm border-2 border-ink bg-hijau px-3 py-1.5 text-xs font-black uppercase text-paper"
              @click="exportRecapCsv"
            >
              Unduh Rekap (CSV)
            </button>
            <button
              type="button"
              class="border-2 border-ink bg-kuning px-3 py-1.5 text-xs font-black uppercase hover:bg-kuning/80"
              @click="printRecap"
            >
              Cetak Rekap
            </button>
          </div>
        </div>

        <div class="mb-4 grid gap-2 sm:grid-cols-3">
          <select v-model="recapFilter.competitionId" class="border-2 border-ink bg-paper px-3 py-2 text-xs font-bold">
            <option value="all">Semua Cabang Lomba ({{ store.state.value.competitions.length }})</option>
            <option v-for="comp in store.state.value.competitions" :key="comp.id" :value="comp.id">{{ comp.name }}</option>
          </select>
          <select v-model="recapFilter.achievement" class="border-2 border-ink bg-paper px-3 py-2 text-xs font-bold">
            <option value="all">Semua Capaian ({{ allRecapRows.length }})</option>
            <option value="winners">Hanya Pemenang ({{ store.state.value.winners.length }})</option>
            <option value="participants">Peserta Non-Juara</option>
          </select>
          <input
            v-model="recapFilter.search"
            type="text"
            placeholder="Cari nama peserta / sekolah / tim..."
            class="border-2 border-ink bg-paper px-3 py-2 text-xs font-semibold outline-none focus:bg-kuning/10"
          >
        </div>

        <div class="overflow-x-auto border-2 border-ink">
          <table class="min-w-full text-left text-xs sm:text-sm">
            <thead class="bg-ink text-[11px] uppercase tracking-wider text-paper">
              <tr>
                <th class="px-3 py-2">No</th>
                <th class="px-3 py-2">Cabang Lomba</th>
                <th class="px-3 py-2">Peserta / Tim</th>
                <th class="px-3 py-2">Kontak</th>
                <th class="px-3 py-2">Status Bayar</th>
                <th class="px-3 py-2">Capaian</th>
                <th class="px-3 py-2">Hadiah</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in filteredRecapRows"
                :key="row.registrationId"
                class="border-t border-ink/15 align-top"
                :class="row.rank ? 'bg-kuning/15' : ''"
              >
                <td class="px-3 py-2.5 font-bold tabular-nums text-muted">{{ index + 1 }}</td>
                <td class="px-3 py-2.5">
                  <div class="font-bold">{{ row.competitionName }}</div>
                  <div class="text-[11px] text-muted">{{ row.category }} · {{ row.division }}</div>
                </td>
                <td class="px-3 py-2.5">
                  <div class="font-bold text-ink">{{ row.participantName }}</div>
                  <div class="text-[11px] text-muted">
                    {{ row.teamName ? `Tim: ${row.teamName} · ` : '' }}{{ row.school }}
                  </div>
                </td>
                <td class="px-3 py-2.5 text-[11px]">
                  <div class="font-semibold">{{ row.noWhatsapp || '-' }}</div>
                  <div class="truncate text-muted">{{ row.email || '-' }}</div>
                </td>
                <td class="px-3 py-2.5">
                  <span class="inline-block px-2 py-0.5 text-[10px] font-black uppercase" :class="paymentTone(row.paymentStatus)">
                    {{ row.paymentStatus }}
                  </span>
                </td>
                <td class="px-3 py-2.5">
                  <span
                    v-if="row.rank"
                    class="inline-block border border-ink px-2 py-0.5 text-[10px] font-black uppercase"
                    :class="row.rank === 1 ? 'bg-kuning text-ink' : row.rank === 2 ? 'bg-biru text-paper' : 'bg-merah text-paper'"
                  >
                    🏆 Juara {{ row.rank }}
                  </span>
                  <span v-else class="inline-block border border-ink/25 bg-paper-deep px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                    Peserta
                  </span>
                </td>
                <td class="px-3 py-2.5 font-bold tabular-nums">
                  <span v-if="row.rank && row.prizeAmount > 0" class="text-hijau">{{ rupiah(row.prizeAmount) }}</span>
                  <span v-else-if="row.rank" class="text-xs text-muted">Trophy & Sertifikat</span>
                  <span v-else class="text-muted">—</span>
                </td>
              </tr>
              <tr v-if="filteredRecapRows.length === 0">
                <td colspan="7" class="px-3 py-8 text-center text-sm text-muted">Tidak ada data rekap untuk filter ini.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- KONTROL AKTIVASI & PRATINJAU SELURUH SERTIFIKAT (KHUSUS PANITIA) -->
      <section id="sertifikat-panitia" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
        <div class="mb-5 flex flex-wrap items-start justify-between gap-4 border-[3px] border-ink p-4" :class="certificateClaimEnabled ? 'bg-hijau/15' : 'bg-paper-deep'">
          <div class="max-w-2xl">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[10px] font-black uppercase tracking-[0.25em] text-biru">Kontrol & Arsip Sertifikat</span>
              <span
                class="border border-ink px-2 py-0.5 text-[10px] font-black uppercase"
                :class="certificateClaimEnabled ? 'bg-hijau text-paper' : 'bg-ink text-kuning'"
              >
                {{ certificateClaimEnabled ? '✓ Klaim Peserta AKTIF' : '🔒 Klaim Peserta TERKUNCI' }}
              </span>
            </div>
            <h2 class="poster-title mt-1 text-3xl">Pratinjau & Aktivasi Sertifikat</h2>
            <p class="mt-1 text-xs leading-relaxed text-muted">
              Seluruh sertifikat peserta (<strong>{{ allParticipantCerts.length }}</strong>) dan sertifikat pemenang (<strong>{{ allWinnerCerts.length }}</strong>) otomatis bertambah mengikuti pendaftar & penetapan juara di atas.
              Selama belum diaktifkan, peserta <strong>tidak dapat melihat pratinjau maupun mengunduh sertifikat</strong>.
            </p>
          </div>
          <div class="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              :disabled="togglingCert"
              class="pressable ink-shadow border-[3px] border-ink px-4 py-2.5 text-xs font-black uppercase disabled:opacity-50"
              :class="certificateClaimEnabled ? 'bg-merah text-paper' : 'bg-hijau text-paper'"
              @click="handleToggleCertificateClaim"
            >
              {{ togglingCert
                ? 'Menyimpan...'
                : certificateClaimEnabled
                  ? '🔒 Kunci / Nonaktifkan Klaim Sertifikat'
                  : '✓ Aktifkan Klaim Sertifikat untuk Peserta' }}
            </button>
            <span class="text-[11px] font-bold text-muted">
              Total Arsip: <strong class="text-ink">{{ allAdminCertificates.length }} sertifikat</strong>
            </span>
          </div>
        </div>

        <!-- Filter Pratinjau Sertifikat -->
        <div class="mb-4 grid gap-2 sm:grid-cols-3">
          <select v-model="certFilter.kind" class="border-2 border-ink bg-paper px-3 py-2 text-xs font-bold">
            <option value="all">Semua Sertifikat ({{ allAdminCertificates.length }})</option>
            <option value="pemenang">Sertifikat Pemenang ({{ allWinnerCerts.length }})</option>
            <option value="peserta">Sertifikat Peserta ({{ allParticipantCerts.length }})</option>
          </select>
          <select v-model="certFilter.competitionId" class="border-2 border-ink bg-paper px-3 py-2 text-xs font-bold">
            <option value="all">Semua Cabang Lomba</option>
            <option v-for="comp in store.state.value.competitions" :key="comp.id" :value="comp.id">{{ comp.name }}</option>
          </select>
          <input
            v-model="certFilter.search"
            type="text"
            placeholder="Cari nama peserta di sertifikat..."
            class="border-2 border-ink bg-paper px-3 py-2 text-xs font-semibold outline-none focus:bg-kuning/10"
          >
        </div>

        <div v-if="filteredAdminCertificates.length === 0" class="border-2 border-dashed border-ink/25 bg-paper-deep px-4 py-8 text-center text-sm text-muted">
          Belum ada sertifikat yang cocok dengan filter ini.
        </div>

        <template v-else>
          <div class="grid gap-5 lg:grid-cols-2">
            <CertificateCardPreview
              v-for="item in visibleAdminCertificates"
              :key="item.params.serialCode"
              :params="item.params"
            />
          </div>

          <div v-if="filteredAdminCertificates.length > certVisibleLimit" class="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              class="pressable border-2 border-ink bg-kuning px-4 py-2 text-xs font-black uppercase"
              @click="certVisibleLimit += 6"
            >
              Tampilkan 6 Sertifikat Berikutnya ({{ filteredAdminCertificates.length - certVisibleLimit }} tersisa)
            </button>
          </div>
        </template>
      </section>

      <section id="pengumuman-panitia" class="scroll-mt-28 ink-shadow border-[3px] border-ink bg-paper p-5">
        <p class="text-[10px] font-black uppercase tracking-[0.25em] text-kuning">Pengumuman Festival</p>
        <h2 class="poster-title mb-4 text-3xl">Terbitkan info</h2>
        <div class="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div class="space-y-3">
            <input v-model="announcement.tag" type="text" placeholder="Tag (INFO, JADWAL, dll)" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold">
            <input v-model="announcement.title" type="text" placeholder="Judul pengumuman" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold">
            <textarea v-model="announcement.body" rows="4" placeholder="Isi pengumuman..." class="w-full border-2 border-ink px-3 py-2 text-sm"></textarea>
            <button type="button" class="pressable border-[3px] border-ink bg-kuning px-4 py-2 text-sm font-black uppercase" @click="publishAnnouncement">Terbitkan</button>
          </div>
          <div class="space-y-2 border-2 border-ink/15 bg-paper-deep p-3">
            <div class="text-[11px] font-black uppercase text-muted">Pengumuman Aktif</div>
            <article v-for="item in store.state.value.announcements.slice(0,4)" :key="item.id" class="border border-ink/15 bg-paper px-3 py-2">
              <div class="text-[10px] font-black uppercase text-merah">{{ item.tag }} · {{ formatStamp(item.publishedAt) }}</div>
              <div class="font-bold">{{ item.title }}</div>
            </article>
          </div>
        </div>
      </section>
    </template>

    <CommitteeDocReviewModal :open="!!reviewTarget" :registration="reviewTarget" @close="reviewTarget = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { MAX_QUOTA, type Category, type RecipientDeliveryReport, type Registration } from '#shared/types/festival'
import type { CertificateParams } from '~/utils/certificate'

definePageMeta({ layout: 'dashboard' })

const store = useFestivalStore()
const reviewTarget = ref<Registration | null>(null)

const filters = reactive({ category: 'Semua' as 'Semua' | Category, branchId: 'all', type: 'Semua' as 'Semua' | 'Putra' | 'Putri' | 'Tim' })

onMounted(async () => {
  if (!store.hydrated.value) await store.hydrate()
  if (store.session.value.role !== 'panitia') navigateTo('/login?role=panitia')
})

const kpis = computed(() => {
  const total = store.state.value.registrations.length
  const full = store.state.value.competitions.filter(c => store.isFull(c.id)).length
  return [
    { label: 'Total Pendaftaran', value: String(total), note: 'Semua cabang lomba', bg: 'bg-kuning text-ink' },
    { label: 'Cabang Penuh', value: `${full}/${store.state.value.competitions.length}`, note: 'Mencapai batas kuota', bg: 'bg-merah text-paper' },
    { label: 'Perlu Verifikasi', value: String(store.pendingReviews.value), note: 'Bukti transfer menunggu', bg: 'bg-biru text-paper' },
    { label: 'Pemenang Tercatat', value: String(store.state.value.winners.length), note: 'Slot juara terisi', bg: 'bg-hijau text-paper' },
  ]
})

const filteredBranches = computed(() =>
  store.state.value.branches.filter(branch => filters.category === 'Semua' || branch.category === filters.category),
)

watch(() => filters.category, () => { filters.branchId = 'all' })

const filteredRegistrations = computed(() => {
  return store.state.value.registrations
    .map(registration => {
      const competition = store.getCompetition(registration.competitionId)
      const branch = competition ? store.getBranch(competition.branchId) : undefined
      const participant = store.state.value.participants.find(p => p.id === registration.participantId)
      return {
        ...registration,
        raw: registration,
        competition,
        branch,
        participant,
        filled: competition ? store.filledSlots(competition.id) : 0,
      }
    })
    .filter(row => {
      if (!row.competition || !row.branch) return false
      if (filters.category !== 'Semua' && row.competition.category !== filters.category) return false
      if (filters.branchId !== 'all' && row.branch.id !== filters.branchId) return false
      if (filters.type !== 'Semua') {
        const type = row.competition.division === 'Tim' ? 'Tim' : row.competition.division
        if (type !== filters.type) return false
      }
      return true
    })
    .reverse()
})

const scheduleDraft = reactive<Record<string, { date: string; startTime: string; endTime: string }>>({})
const quotaDraft = reactive<Record<string, number>>({})
const feeDraft = reactive<Record<string, number>>({})

function getQuotaDraft(id: string): number { return quotaDraft[id] ?? MAX_QUOTA }
function setQuotaDraft(id: string, value: number) { quotaDraft[id] = value }
function getFeeDraft(id: string): number { return feeDraft[id] ?? 0 }
function setFeeDraft(id: string, value: number) { feeDraft[id] = value }
function ensureScheduleDraft(branchId: string) {
  if (!scheduleDraft[branchId]) {
    const branch = store.getBranch(branchId)
    scheduleDraft[branchId] = {
      date: branch?.date ?? '2026-12-05',
      startTime: (branch?.startTime ?? '09.00').replace('.', ':'),
      endTime: (branch?.endTime ?? '12.00').replace('.', ':'),
    }
  }
  return scheduleDraft[branchId]!
}
function setScheduleField(branchId: string, field: 'date' | 'startTime' | 'endTime', value: string) {
  ensureScheduleDraft(branchId)[field] = value
}

function syncDrafts() {
  for (const branch of store.state.value.branches) {
    scheduleDraft[branch.id] = { date: branch.date, startTime: branch.startTime.replace('.', ':'), endTime: branch.endTime.replace('.', ':') }
  }
  for (const comp of store.state.value.competitions) {
    quotaDraft[comp.id] = comp.maxQuota
    feeDraft[comp.id] = comp.fee
  }
}
watch(() => store.hydrated.value, (value) => { if (value) syncDrafts() }, { immediate: true })
watch(() => store.state.value.branches.length, syncDrafts)

const scheduleEditorRows = computed(() => store.state.value.branches.map(branch => {
  const competitions = store.state.value.competitions.filter(comp => comp.branchId === branch.id)
  const divisions = competitions.length > 1 ? 'Putra & Putri (hari sama)' : competitions[0]?.division ?? 'Umum'
  return { branch, competitions, divisions }
}))

function toDotTime(value: string) { return value.replace(':', '.') }

async function saveSchedule(branchId: string) {
  const draft = scheduleDraft[branchId]
  if (!draft) return
  const result = await store.updateBranch(branchId, { date: draft.date, startTime: toDotTime(draft.startTime), endTime: toDotTime(draft.endTime) })
  store.toast(result.message, result.ok ? 'success' : 'error')
  syncDrafts()
}

async function saveCompetition(compId: string) {
  const result = await store.updateCompetition(compId, { maxQuota: quotaDraft[compId], fee: feeDraft[compId] })
  store.toast(result.message, result.ok ? 'success' : 'error')
  syncDrafts()
}

async function deleteRegistration(registrationId: string, participantName: string) {
  if (import.meta.client && !window.confirm(`Hapus pendaftaran ${participantName}? Slot kuota akan dikembalikan.`)) return
  const result = await store.removeRegistration(registrationId)
  store.toast(result.message, result.ok ? 'success' : 'error')
}

// Winners & Prizes
const DEFAULT_PRIZES: Record<1 | 2 | 3, number> = { 1: 1_500_000, 2: 1_000_000, 3: 500_000 }
const winnerCompetitionId = ref(store.state.value.competitions[0]?.id ?? '')
const winnerDraft = reactive<Record<1 | 2 | 3, string>>({ 1: '', 2: '', 3: '' })
const prizeDraft = reactive<Record<1 | 2 | 3, number>>({ 1: DEFAULT_PRIZES[1], 2: DEFAULT_PRIZES[2], 3: DEFAULT_PRIZES[3] })

watch(() => store.state.value.competitions, (comps) => {
  if (!winnerCompetitionId.value && comps.length > 0) {
    winnerCompetitionId.value = comps[0]!.id
  }
}, { immediate: true })

function syncWinners() {
  for (const rank of [1, 2, 3] as const) {
    const existing = store.winnerFor(winnerCompetitionId.value, rank)
    winnerDraft[rank] = existing?.registrationId ?? ''
    prizeDraft[rank] = existing ? existing.prizeAmount : DEFAULT_PRIZES[rank]
  }
}
watch(winnerCompetitionId, syncWinners, { immediate: true })
watch(() => store.state.value.winners, syncWinners, { deep: true })

const winnerCandidates = computed(() => store.registrationsFor(winnerCompetitionId.value).map(registration => {
  const participant = store.state.value.participants.find(p => p.id === registration.participantId)
  const label = registration.type === 'team' ? `${registration.teamName} (${participant?.namaLengkap ?? 'Tim'})` : (participant?.namaLengkap ?? registration.id)
  return { id: registration.id, label }
}))

async function saveWinner(rank: 1 | 2 | 3) {
  const registrationId = winnerDraft[rank]
  if (!registrationId) {
    const result = await store.removeWinner(winnerCompetitionId.value, rank)
    store.toast(result.message, 'info')
    return
  }
  const prizeAmount = Math.max(0, Math.round(Number(prizeDraft[rank]) || 0))
  const result = await store.upsertWinner(winnerCompetitionId.value, rank, registrationId, prizeAmount)
  store.toast(result.message, result.ok ? 'success' : 'error')
}

// Notifications
const notif = reactive<{
  type: 'Pelunasan Pembayaran' | 'Stand By Pembagian Trophy'
  competitionId: string
  recipient: 'branch' | 'winners' | 'all'
  message: string
  whatsapp: boolean
  email: boolean
}>({
  type: 'Pelunasan Pembayaran',
  competitionId: '',
  recipient: 'branch',
  message: '',
  whatsapp: true,
  email: true,
})

const sendingNotif = ref(false)
const savingConfig = ref(false)
const showChannelConfig = ref(false)
const deliveryReports = ref<RecipientDeliveryReport[]>([])
const channelStatus = reactive({
  smtpConfigured: false,
  whatsappConfigured: false,
  whatsappProvider: 'fonnte',
})

const channelForm = reactive({
  whatsappProvider: 'fonnte' as 'fonnte' | 'wablas' | 'meta' | 'webhook',
  whatsappApiUrl: 'https://api.fonnte.com/send',
  whatsappApiToken: '',
  hasWhatsappToken: false,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  hasSmtpPass: false,
})

function onProviderChange() {
  if (channelForm.whatsappProvider === 'fonnte') {
    channelForm.whatsappApiUrl = 'https://api.fonnte.com/send'
  } else if (channelForm.whatsappProvider === 'wablas') {
    channelForm.whatsappApiUrl = 'https://pati.wablas.com/api/send-message'
  } else if (channelForm.whatsappProvider === 'meta' && channelForm.whatsappApiUrl.includes('fonnte')) {
    channelForm.whatsappApiUrl = 'https://graph.facebook.com/v20.0/<PHONE_NUMBER_ID>/messages'
  }
}

async function loadChannelConfig() {
  try {
    const cfg = await $fetch<{
      whatsappProvider: 'fonnte' | 'wablas' | 'meta' | 'webhook'
      whatsappApiUrl: string
      hasWhatsappToken: boolean
      whatsappConfigured: boolean
      smtpHost: string
      smtpPort: number
      smtpUser: string
      smtpFrom: string
      hasSmtpPass: boolean
      smtpConfigured: boolean
    }>('/api/notifications/config')
    channelForm.whatsappProvider = cfg.whatsappProvider
    channelForm.whatsappApiUrl = cfg.whatsappApiUrl
    channelForm.hasWhatsappToken = cfg.hasWhatsappToken
    channelForm.smtpHost = cfg.smtpHost || 'smtp.gmail.com'
    channelForm.smtpPort = cfg.smtpPort || 587
    channelForm.smtpUser = cfg.smtpUser || store.session.value.email || ''
    channelForm.smtpFrom = cfg.smtpFrom
    channelForm.hasSmtpPass = cfg.hasSmtpPass
    channelStatus.whatsappConfigured = cfg.whatsappConfigured
    channelStatus.smtpConfigured = cfg.smtpConfigured
    channelStatus.whatsappProvider = cfg.whatsappProvider
  } catch {
    try {
      const status = await $fetch<{ smtpConfigured: boolean; whatsappConfigured: boolean; whatsappProvider: string }>('/api/notifications/status')
      Object.assign(channelStatus, status)
    } catch {
      // Keep default mode
    }
  }
}

async function saveChannelSettings() {
  if (savingConfig.value) return
  savingConfig.value = true
  try {
    const res = await $fetch<{ ok: boolean; message: string; config?: typeof channelForm & { whatsappConfigured: boolean; smtpConfigured: boolean } }>('/api/notifications/config', {
      method: 'PUT',
      body: {
        whatsappProvider: channelForm.whatsappProvider,
        whatsappApiUrl: channelForm.whatsappApiUrl,
        whatsappApiToken: channelForm.whatsappApiToken,
        smtpHost: channelForm.smtpHost,
        smtpPort: channelForm.smtpPort,
        smtpUser: channelForm.smtpUser,
        smtpPass: channelForm.smtpPass,
        smtpFrom: channelForm.smtpFrom,
      },
    })
    store.toast(res.message, res.ok ? 'success' : 'error')
    if (res.ok && res.config) {
      channelForm.whatsappApiToken = ''
      channelForm.smtpPass = ''
      channelForm.hasWhatsappToken = res.config.hasWhatsappToken
      channelForm.hasSmtpPass = res.config.hasSmtpPass
      channelStatus.whatsappConfigured = res.config.whatsappConfigured
      channelStatus.smtpConfigured = res.config.smtpConfigured
      channelStatus.whatsappProvider = res.config.whatsappProvider
      if (res.config.whatsappConfigured) showChannelConfig.value = false
    }
  } catch {
    store.toast('Gagal menyimpan pengaturan saluran.', 'error')
  } finally {
    savingConfig.value = false
  }
}

onMounted(() => {
  void loadChannelConfig()
})

const notifPreviewRecipients = computed(() => {
  if (notif.recipient === 'all') {
    return store.state.value.participants
  }
  if (!notif.competitionId) return []
  const ids = new Set<string>()
  if (notif.recipient === 'winners') {
    for (const winner of store.state.value.winners.filter(w => w.competitionId === notif.competitionId)) {
      const reg = store.getRegistration(winner.registrationId)
      if (reg) ids.add(reg.participantId)
    }
  } else {
    for (const reg of store.registrationsFor(notif.competitionId)) {
      ids.add(reg.participantId)
    }
  }
  return store.state.value.participants.filter(p => ids.has(p.id))
})

const bulkMailtoUrl = computed(() => {
  const emails = deliveryReports.value
    .map(item => item.email?.target)
    .filter((value): value is string => Boolean(value))
  if (emails.length < 2) return ''
  const compName = notif.recipient === 'all' ? '' : (store.getCompetition(notif.competitionId)?.name ?? '')
  const subject = `[Menangin! 2026] ${notif.type}${compName ? ` — ${compName}` : ''}`
  const body = notif.message.trim() || (notif.type === 'Pelunasan Pembayaran'
    ? 'Segera lunasi pembayaran pendaftaran dan unggah bukti transfer melalui dashboard peserta.'
    : 'Untuk para pemenang: harap stand by di area podium sebelum pembagian trophy dimulai.')
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    bcc: emails.join(','),
    su: subject,
    body,
  })
  if (store.session.value.email) {
    params.set('authuser', store.session.value.email)
  }
  return `https://mail.google.com/mail/?${params.toString()}`
})

async function copyNotifText(text: string) {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(text)
    store.toast('Pesan notifikasi disalin ke clipboard.', 'success')
  } catch {
    store.toast('Gagal menyalin pesan.', 'error')
  }
}

async function sendNotif() {
  if (sendingNotif.value) return
  if (notif.recipient !== 'all' && !notif.competitionId) {
    store.toast('Pilih cabang lomba tujuan notifikasi.', 'error')
    return
  }
  sendingNotif.value = true
  try {
    const result = await store.sendNotification({
      type: notif.type,
      competitionId: notif.recipient === 'all' ? '' : notif.competitionId,
      recipient: notif.recipient,
      message: notif.message,
      channels: { whatsapp: notif.whatsapp, email: notif.email },
    })
    store.toast(result.message, result.ok ? 'success' : 'error')
    if (result.ok) {
      deliveryReports.value = result.deliveries ?? []
      if (result.integration) Object.assign(channelStatus, result.integration)
      notif.message = ''
    }
  } finally {
    sendingNotif.value = false
  }
}

// Announcements
const announcement = reactive({ tag: 'INFO', title: '', body: '' })

async function publishAnnouncement() {
  const result = await store.publishAnnouncement({ ...announcement })
  store.toast(result.message, result.ok ? 'success' : 'error')
  if (result.ok) { announcement.title = ''; announcement.body = ''; announcement.tag = 'INFO' }
}

// Rekap Keseluruhan Peserta & Capaian Juara (diurutkan per cabang dari Juara 1 -> 2 -> 3 -> Peserta)
const recapFilter = reactive({
  competitionId: 'all',
  achievement: 'all' as 'all' | 'winners' | 'participants',
  search: '',
})

const allRecapRows = computed(() => {
  const compOrder = new Map(store.state.value.competitions.map((c, idx) => [c.id, idx]))
  const winnerByReg = new Map(store.state.value.winners.map(w => [w.registrationId, w]))

  return store.state.value.registrations
    .map(reg => {
      const comp = store.getCompetition(reg.competitionId)
      const participant = store.state.value.participants.find(p => p.id === reg.participantId)
      const winner = winnerByReg.get(reg.id)
      const rank = winner?.rank ?? reg.winnerRank ?? null
      return {
        registrationId: reg.id,
        competitionId: reg.competitionId,
        competitionOrder: compOrder.get(reg.competitionId) ?? 999,
        competitionName: comp?.name ?? reg.competitionId,
        category: comp?.category ?? '',
        division: comp?.division ?? '',
        participantName: participant?.namaLengkap ?? 'Peserta',
        teamName: reg.type === 'team' ? reg.teamName : '',
        school: participant?.asalSekolah ?? '',
        noWhatsapp: participant?.noWhatsapp ?? '',
        email: participant?.email ?? '',
        paymentStatus: reg.paymentStatus,
        rank,
        prizeAmount: winner?.prizeAmount ?? 0,
      }
    })
    .sort((a, b) => {
      if (a.competitionOrder !== b.competitionOrder) return a.competitionOrder - b.competitionOrder
      const rankA = a.rank ?? 99
      const rankB = b.rank ?? 99
      if (rankA !== rankB) return rankA - rankB
      return a.participantName.localeCompare(b.participantName, 'id')
    })
})

const filteredRecapRows = computed(() => {
  const q = recapFilter.search.trim().toLowerCase()
  return allRecapRows.value.filter(row => {
    if (recapFilter.competitionId !== 'all' && row.competitionId !== recapFilter.competitionId) return false
    if (recapFilter.achievement === 'winners' && !row.rank) return false
    if (recapFilter.achievement === 'participants' && row.rank) return false
    if (q) {
      const hay = `${row.participantName} ${row.teamName} ${row.school} ${row.competitionName}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

function exportRecapCsv() {
  if (!import.meta.client) return
  const esc = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`
  const header = ['No', 'Cabang Lomba', 'Kategori', 'Divisi', 'Nama Peserta', 'Nama Tim', 'Asal Sekolah/Instansi', 'No. WhatsApp', 'Email', 'Status Pembayaran', 'Capaian', 'Hadiah (Rp)']
  const lines = [
    header.map(esc).join(','),
    ...filteredRecapRows.value.map((row, idx) => [
      idx + 1,
      row.competitionName,
      row.category,
      row.division,
      row.participantName,
      row.teamName || '-',
      row.school,
      row.noWhatsapp,
      row.email,
      row.paymentStatus,
      row.rank ? `Juara ${row.rank}` : 'Peserta',
      row.rank ? row.prizeAmount : 0,
    ].map(esc).join(',')),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rekap-peserta-menangin-2026.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  store.toast(`Rekap CSV (${filteredRecapRows.value.length} baris) berhasil diunduh.`, 'success')
}

function printRecap() {
  if (!import.meta.client) return
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const rowsHtml = filteredRecapRows.value.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${esc(r.competitionName)}</strong><br><small>${esc(r.category)} · ${esc(r.division)}</small></td>
      <td><strong>${esc(r.participantName)}</strong>${r.teamName ? `<br><small>Tim: ${esc(r.teamName)}</small>` : ''}<br><small>${esc(r.school)}</small></td>
      <td>${esc(r.paymentStatus)}</td>
      <td><strong>${r.rank ? `Juara ${r.rank}` : 'Peserta'}</strong></td>
      <td>${r.rank && r.prizeAmount > 0 ? esc(rupiah(r.prizeAmount)) : '—'}</td>
    </tr>
  `).join('')

  const win = window.open('', '_blank', 'width=1050,height=800')
  if (!win) return
  win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Rekap Peserta Menangin! Festival 2026</title>
  <style>body{font-family:Arial,sans-serif;padding:24px;color:#1c1a17}h1{margin:0 0 4px}p{margin:0 0 16px;color:#555;font-size:13px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #1c1a17;padding:6px 8px;text-align:left;vertical-align:top}th{background:#1c1a17;color:#fff}</style>
  </head><body><h1>Rekap Keseluruhan Peserta & Capaian — Menangin! Festival 2026</h1>
  <p>Total data: ${filteredRecapRows.value.length} pendaftaran (diurutkan per lomba dari Juara 1 → 2 → 3 → Peserta)</p>
  <table><thead><tr><th>No</th><th>Cabang Lomba</th><th>Peserta / Tim</th><th>Pembayaran</th><th>Capaian</th><th>Hadiah</th></tr></thead><tbody>${rowsHtml}</tbody></table>
  </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 250)
}

// Kontrol Klaim & Pratinjau Seluruh Sertifikat (Panitia)
const togglingCert = ref(false)
const certificateClaimEnabled = computed(() => store.state.value.settings.certificateClaimEnabled)
const certFilter = reactive({
  kind: 'all' as 'all' | 'pemenang' | 'peserta',
  competitionId: 'all',
  search: '',
})
const certVisibleLimit = ref(6)

watch(() => [certFilter.kind, certFilter.competitionId, certFilter.search], () => {
  certVisibleLimit.value = 6
})

async function handleToggleCertificateClaim() {
  if (togglingCert.value) return
  togglingCert.value = true
  try {
    const next = !certificateClaimEnabled.value
    const result = await store.toggleCertificateClaim(next)
    store.toast(result.message, result.ok ? 'success' : 'error')
  } finally {
    togglingCert.value = false
  }
}

const allWinnerCerts = computed<Array<{ competitionId: string; params: CertificateParams }>>(() => {
  const compOrder = new Map(store.state.value.competitions.map((c, idx) => [c.id, idx]))
  return store.state.value.winners
    .slice()
    .sort((a, b) => {
      const ca = compOrder.get(a.competitionId) ?? 999
      const cb = compOrder.get(b.competitionId) ?? 999
      if (ca !== cb) return ca - cb
      return a.rank - b.rank
    })
    .map(w => {
      const reg = store.getRegistration(w.registrationId)
      const participant = reg ? store.state.value.participants.find(p => p.id === reg.participantId) : undefined
      const comp = store.getCompetition(w.competitionId)
      return {
        competitionId: w.competitionId,
        params: {
          kind: 'pemenang' as const,
          participantName: participant?.namaLengkap ?? 'Pemenang Menangin!',
          competitionName: comp?.name ?? w.competitionId,
          teamName: reg?.type === 'team' ? reg.teamName : '',
          rank: w.rank,
          prizeAmount: w.prizeAmount ?? 0,
          serialCode: `MNG-2026-J${w.rank}-${w.registrationId.toUpperCase()}`,
        },
      }
    })
})

const allParticipantCerts = computed<Array<{ competitionId: string; params: CertificateParams }>>(() => {
  return allRecapRows.value
    .filter(row => row.paymentStatus !== 'Ditolak')
    .map(row => ({
      competitionId: row.competitionId,
      params: {
        kind: 'peserta' as const,
        participantName: row.participantName,
        competitionName: row.competitionName,
        teamName: row.teamName,
        serialCode: `MNG-2026-PST-${row.registrationId.toUpperCase()}`,
      },
    }))
})

const allAdminCertificates = computed(() => [
  ...allWinnerCerts.value,
  ...allParticipantCerts.value,
])

const filteredAdminCertificates = computed(() => {
  const q = certFilter.search.trim().toLowerCase()
  return allAdminCertificates.value.filter(item => {
    if (certFilter.kind !== 'all' && item.params.kind !== certFilter.kind) return false
    if (certFilter.competitionId !== 'all' && item.competitionId !== certFilter.competitionId) return false
    if (q) {
      const hay = `${item.params.participantName} ${item.params.competitionName || ''} ${item.params.teamName || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const visibleAdminCertificates = computed(() =>
  filteredAdminCertificates.value.slice(0, certVisibleLimit.value),
)
</script>
