<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Form pendaftaran">
      <div class="absolute inset-0 bg-ink/55" @click="$emit('close')" />
      <div class="pop-in relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto border-[3px] border-ink bg-paper ink-shadow-lg">
        <div class="flex items-start justify-between gap-4 border-b-[3px] border-ink bg-kuning px-5 py-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-ink/70">Pendaftaran Lomba</p>
            <h2 class="poster-title mt-1 text-2xl sm:text-3xl">Pilih cabangmu</h2>
            <p class="mt-1 text-sm text-ink/75">Kuota maksimal 15 per lomba. Cabang penuh tidak bisa dipilih.</p>
          </div>
          <button type="button" class="pressable border-2 border-ink bg-paper px-3 py-1 text-sm font-black" @click="$emit('close')">Tutup</button>
        </div>

        <div class="grid gap-5 p-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div class="space-y-4">
            <label class="block">
              <span class="mb-1 block text-xs font-black uppercase tracking-wider">Cabang Lomba</span>
              <select v-model="selectedId" class="w-full border-[3px] border-ink bg-paper px-3 py-2.5 text-sm font-semibold outline-none focus:bg-kuning/20">
                <option v-for="comp in competitions" :key="comp.id" :value="comp.id" :disabled="comp.full || comp.registered">
                  {{ comp.name }} — {{ formatDate(comp.branch.date) }} {{ comp.full ? '(PENUH)' : comp.registered ? '(SUDAH DAFTAR)' : `(${comp.remaining} slot)` }}
                </option>
              </select>
            </label>

            <div v-if="selected" class="ink-shadow-sm border-[3px] border-ink bg-paper-deep p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="poster-title text-2xl">{{ selected.name }}</div>
                  <div class="text-sm font-semibold text-muted">{{ selected.category }} · {{ selected.division }}</div>
                </div>
                <span class="border-2 border-ink px-2 py-1 text-[10px] font-black uppercase" :class="accentBg(selected.branch.accent)">
                  {{ selected.type === 'team' ? 'Tim' : 'Solo' }}
                </span>
              </div>
              <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt class="text-[10px] font-black uppercase tracking-wider text-muted">Tanggal</dt><dd class="font-bold">{{ formatDate(selected.branch.date) }}</dd></div>
                <div><dt class="text-[10px] font-black uppercase tracking-wider text-muted">Waktu</dt><dd class="font-bold">{{ selected.branch.startTime }}–{{ selected.branch.endTime }}</dd></div>
                <div><dt class="text-[10px] font-black uppercase tracking-wider text-muted">Biaya</dt><dd class="font-bold text-merah">{{ rupiah(selected.fee) }}</dd></div>
                <div><dt class="text-[10px] font-black uppercase tracking-wider text-muted">Kuota</dt><dd class="font-bold">{{ selected.filled }}/{{ selected.maxQuota }} <span class="font-normal text-muted">({{ selected.remaining }} sisa)</span></dd></div>
              </dl>
              <p class="mt-3 text-xs leading-relaxed text-muted">{{ selected.branch.description }}</p>
              <div class="mt-3 h-3 overflow-hidden border-2 border-ink bg-paper">
                <div class="h-full bg-merah" :style="{ width: `${Math.min(100, (selected.filled / selected.maxQuota) * 100)}%` }" />
              </div>
            </div>

            <div v-if="selected?.type === 'team'" class="border-[3px] border-ink bg-paper p-4">
              <label class="block">
                <span class="mb-1 block text-xs font-black uppercase tracking-wider">Nama Tim</span>
                <input v-model="teamName" type="text" class="w-full border-2 border-ink px-3 py-2 text-sm font-semibold outline-none focus:bg-kuning/20" placeholder="Contoh: Garuda Muda">
              </label>
            </div>
          </div>

          <div class="space-y-4">
            <div v-if="selected?.type === 'team'" class="border-[3px] border-ink bg-paper p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-black uppercase tracking-wider">Roster Anggota Tim</h3>
                  <p class="text-xs text-muted">Minimal 5 anggota, sertakan kapten/tim inti.</p>
                </div>
                <button type="button" class="pressable border-2 border-ink bg-kuning px-3 py-1.5 text-xs font-black uppercase" @click="addMember">+ Anggota</button>
              </div>

              <div class="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
                <div v-for="(member, index) in members" :key="member.id" class="border-2 border-ink/20 bg-paper-deep p-3">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-[11px] font-black uppercase text-muted">Anggota {{ index + 1 }}</span>
                    <button v-if="members.length > 1" type="button" class="text-[11px] font-bold text-merah underline" @click="removeMember(member.id)">Hapus</button>
                  </div>
                  <div class="grid gap-2 sm:grid-cols-2">
                    <input v-model="member.namaLengkap" type="text" placeholder="Nama lengkap" class="border border-ink/40 px-2 py-1.5 text-sm outline-none focus:border-ink">
                    <input v-model="member.posisi" type="text" placeholder="Posisi/peran" class="border border-ink/40 px-2 py-1.5 text-sm outline-none focus:border-ink">
                    <input v-model="member.asalSekolah" type="text" placeholder="Asal sekolah/instansi" class="border border-ink/40 px-2 py-1.5 text-sm outline-none focus:border-ink sm:col-span-2">
                    <input v-model="member.noWhatsapp" type="text" placeholder="No. WhatsApp" class="border border-ink/40 px-2 py-1.5 text-sm outline-none focus:border-ink sm:col-span-2">
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="border-[3px] border-ink bg-paper-deep p-4 text-sm">
              <h3 class="text-sm font-black uppercase tracking-wider">Pendaftaran Individu</h3>
              <p class="mt-2 text-muted">Data diri akan diambil dari profil peserta. Pastikan profilmu sudah lengkap sebelum mendaftar.</p>
              <div class="mt-3 space-y-1 text-sm">
                <div><span class="text-muted">Nama:</span> <strong>{{ participant?.namaLengkap }}</strong></div>
                <div><span class="text-muted">Kontak:</span> {{ participant?.noWhatsapp }}</div>
              </div>
            </div>

            <p v-if="error" class="border-2 border-merah bg-merah/10 px-3 py-2 text-sm font-semibold text-merah">{{ error }}</p>

            <button
              type="button"
              class="pressable ink-shadow-lg w-full border-[3px] border-ink bg-merah px-4 py-3 text-sm font-black uppercase text-paper disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!selected || selected.full || selected.registered"
              @click="submit"
            >
              {{ selected?.registered ? 'Sudah Terdaftar' : selected?.full ? `Kuota Penuh (${selected.maxQuota}/${selected.maxQuota})` : 'Daftar Sekarang' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MAX_QUOTA, type ParticipantProfile, type TeamMember } from '#shared/types/festival'

const props = defineProps<{ open: boolean; participant: ParticipantProfile | null }>()
const emit = defineEmits<{ close: []; registered: [id: string] }>()

const store = useFestivalStore()
const selectedId = ref('')
const teamName = ref('')
const members = ref<TeamMember[]>([])
const error = ref('')

const competitions = computed(() => store.state.value.competitions.map(competition => {
  const branch = store.getBranch(competition.branchId)!
  const filled = store.filledSlots(competition.id)
  const remaining = store.remainingSlots(competition.id)
  const full = remaining === 0
  const registered = props.participant ? store.isRegistered(props.participant.id, competition.id) : false
  const type: 'solo' | 'team' = competition.division === 'Tim' ? 'team' : 'solo'
  return { ...competition, branch, filled, remaining, full, registered, type, dateLabel: formatDate(branch.date) }
}))

const selected = computed(() => competitions.value.find(competition => competition.id === selectedId.value))

function seedMembers() {
  const base = props.participant
  members.value = Array.from({ length: 6 }, (_, index) => ({
    id: `tm-${index + 1}`,
    namaLengkap: index === 0 ? base?.namaLengkap ?? '' : '',
    asalSekolah: index === 0 ? base?.asalSekolah ?? '' : '',
    noWhatsapp: index === 0 ? base?.noWhatsapp ?? '' : '',
    posisi: index === 0 ? 'Kapten' : '',
  }))
  teamName.value = ''
  error.value = ''
}

watch(() => props.open, (open) => {
  if (open) {
    const first = competitions.value.find(competition => !competition.full && !competition.registered) ?? competitions.value[0]
    selectedId.value = first?.id ?? ''
    seedMembers()
  }
})

watch(selectedId, () => {
  error.value = ''
  if (selected.value?.type === 'team') seedMembers()
})

function addMember() {
  members.value.push({ id: `tm-${Date.now()}-${members.value.length}`, namaLengkap: '', asalSekolah: '', noWhatsapp: '', posisi: '' })
}

function removeMember(id: string) {
  members.value = members.value.filter(member => member.id !== id)
}

async function submit() {
  error.value = ''
  const comp = selected.value
  if (!props.participant || !comp) return
  if (comp.registered) { error.value = 'Kamu sudah terdaftar di cabang ini.'; return }
  if (comp.full) { error.value = 'Kuota cabang ini sudah penuh (15/15).'; return }

  const cleanMembers = members.value
    .map(member => ({ ...member, namaLengkap: member.namaLengkap.trim(), asalSekolah: member.asalSekolah.trim(), noWhatsapp: member.noWhatsapp.trim(), posisi: member.posisi.trim() }))
    .filter(member => member.namaLengkap)

  if (comp.type === 'team') {
    if (!teamName.value.trim()) { error.value = 'Nama tim wajib diisi.'; return }
    if (cleanMembers.length < 5) { error.value = 'Minimal 5 anggota tim harus diisi.'; return }
  }

  const result = await store.register({
    participantId: props.participant.id,
    competitionId: comp.id,
    type: comp.type,
    teamName: teamName.value,
    members: cleanMembers,
  })
  if (!result.ok) { error.value = result.message; return }
  store.toast(result.message, 'success')
  emit('registered', result.registrationId ?? '')
  emit('close')
}
</script>
