import { computed } from 'vue'
import {
  MAX_QUOTA,
  type Announcement,
  type Category,
  type Competition,
  type Division,
  type DocumentProof,
  type FestivalBranch,
  type FestivalSettings,
  type FestivalState,
  type NotificationItem,
  type NotificationType,
  type ParticipantProfile,
  type PaymentStatus,
  type ProofSource,
  type RecipientDeliveryReport,
  type Registration,
  type Role,
  type Session,
  type TeamMember,
  type ToastItem,
  type WinnerRecord,
} from '#shared/types/festival'

export { MAX_QUOTA }

function createEmptyState(): FestivalState {
  return {
    version: 1,
    branches: [],
    competitions: [],
    participants: [],
    registrations: [],
    winners: [],
    notifications: [],
    announcements: [],
    settings: { certificateClaimEnabled: false },
    session: { role: null, email: '', participantId: null },
    counters: { toast: 1 },
  }
}

interface RegisterInput {
  participantId: string
  competitionId: string
  type: 'solo' | 'team'
  teamName: string
  members: TeamMember[]
}

export interface RegisterAccountInput {
  role?: 'peserta'
  email: string
  password: string
  namaLengkap: string
  asalSekolah: string
  noWhatsapp: string
  jenisKelamin: 'Putra' | 'Putri'
  kategori: 'Siswa' | 'Mahasiswa' | 'Umum'
}

interface ActionResult {
  ok: boolean
  message: string
  registrationId?: string
}

interface StateApiResponse {
  ok?: boolean
  error?: string
  version: 1
  branches: FestivalBranch[]
  competitions: Competition[]
  participants: ParticipantProfile[]
  registrations: Registration[]
  winners: WinnerRecord[]
  notifications: NotificationItem[]
  announcements: Announcement[]
  settings?: FestivalSettings
  session: Session
}

export const useFestivalStore = () => {
  const requestFetch = useRequestFetch()
  const state = useState<FestivalState>('menangin:state', () => createEmptyState())
  const hydrated = useState<boolean>('menangin:hydrated', () => false)
  const loading = useState<boolean>('menangin:loading', () => false)
  const dbError = useState<string>('menangin:dbError', () => '')
  const toasts = useState<ToastItem[]>('menangin:toasts', () => [])

  const session = computed(() => state.value.session)
  const currentParticipant = computed<ParticipantProfile | null>(() =>
    state.value.participants.find(participant => participant.id === state.value.session.participantId) ?? null,
  )
  const myRegistrations = computed<Registration[]>(() =>
    state.value.registrations.filter(registration => registration.participantId === state.value.session.participantId),
  )
  const myNotifications = computed<NotificationItem[]>(() =>
    state.value.notifications
      .filter(item => item.participantId === state.value.session.participantId || item.participantId === 'all')
      .slice()
      .reverse(),
  )
  const unreadCount = computed(() => myNotifications.value.filter(item => !item.read).length)
  const pendingReviews = computed(() =>
    state.value.registrations.filter(registration => registration.proof && registration.paymentStatus === 'Menunggu Verifikasi').length,
  )

  async function hydrate(force = false) {
    if (hydrated.value && !force) return
    if (loading.value) return
    loading.value = true
    try {
      const data = await requestFetch<StateApiResponse>('/api/festival/state')
      if (data.ok === false) {
        dbError.value = data.error || 'Gagal memuat data dari TiDB Cloud.'
        return
      }
      dbError.value = ''
      state.value = {
        ...state.value,
        version: 1,
        branches: data.branches,
        competitions: data.competitions,
        participants: data.participants,
        registrations: data.registrations,
        winners: data.winners,
        notifications: data.notifications,
        announcements: data.announcements,
        settings: data.settings ?? { certificateClaimEnabled: false },
        session: data.session ?? { role: null, email: '', participantId: null },
      }
      hydrated.value = true
    } catch {
      dbError.value = 'Gagal memuat data dari TiDB Cloud. Pastikan konfigurasi .env benar.'
      if (import.meta.client) {
        toast('Gagal memuat data dari TiDB Cloud. Coba muat ulang halaman.', 'error')
      }
    } finally {
      loading.value = false
    }
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter(item => item.id !== id)
  }

  function toast(message: string, tone: ToastItem['tone'] = 'info') {
    const text = String(message || '').trim()
    if (!text) return
    const id = Date.now() + ++state.value.counters.toast!
    toasts.value.push({ id, message: text, tone })
    if (import.meta.client) {
      setTimeout(() => {
        dismissToast(id)
      }, 4200)
    }
  }

  function getBranch(id: string): FestivalBranch | undefined {
    return state.value.branches.find(branch => branch.id === id)
  }

  function getCompetition(id: string): Competition | undefined {
    return state.value.competitions.find(competition => competition.id === id)
  }

  function getRegistration(id: string): Registration | undefined {
    return state.value.registrations.find(registration => registration.id === id)
  }

  function registrationsFor(competitionId: string): Registration[] {
    return state.value.registrations.filter(registration => registration.competitionId === competitionId)
  }

  function filledSlots(competitionId: string): number {
    return registrationsFor(competitionId).filter(registration => registration.paymentStatus !== 'Ditolak').length
  }

  function remainingSlots(competitionId: string): number {
    return Math.max(0, (getCompetition(competitionId)?.maxQuota ?? MAX_QUOTA) - filledSlots(competitionId))
  }

  function isFull(competitionId: string): boolean {
    return remainingSlots(competitionId) === 0
  }

  function isRegistered(participantId: string, competitionId: string): boolean {
    return state.value.registrations.some(registration => registration.participantId === participantId && registration.competitionId === competitionId)
  }

  function branchOf(competition: Competition): FestivalBranch | undefined {
    return getBranch(competition.branchId)
  }

  async function login(email: string, password: string): Promise<ActionResult & { role?: Role | null }> {
    try {
      const res = await $fetch<ActionResult & { session?: Session }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      if (res.ok && res.session) {
        state.value.session = res.session
        await hydrate(true)
      }
      return { ok: res.ok, message: res.message, role: res.session?.role ?? null }
    } catch {
      return { ok: false, message: 'Gagal terhubung ke server untuk masuk.' }
    }
  }

  async function registerAccount(input: RegisterAccountInput): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult & { session?: Session; participant?: ParticipantProfile | null }>('/api/auth/register', {
        method: 'POST',
        body: input,
      })
      if (res.ok && res.session) {
        state.value.session = res.session
        await hydrate(true)
      }
      return { ok: res.ok, message: res.message }
    } catch {
      return { ok: false, message: 'Gagal terhubung ke server untuk mendaftar.' }
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Clear local session even if request fails
    }
    state.value.session = { role: null, email: '', participantId: null, displayName: '' }
  }

  async function updateProfile(input: Omit<ParticipantProfile, 'id'>): Promise<ActionResult> {
    const participant = currentParticipant.value
    if (!participant) return { ok: false, message: 'Peserta tidak ditemukan.' }
    try {
      const res = await $fetch<ActionResult & { participant?: ParticipantProfile }>(`/api/participants/${participant.id}`, {
        method: 'PATCH',
        body: input,
      })
      if (res.ok && res.participant) {
        Object.assign(participant, res.participant)
      }
      toast(res.message, res.ok ? 'success' : 'error')
      return { ok: res.ok, message: res.message }
    } catch {
      toast('Gagal menyimpan profil ke database.', 'error')
      return { ok: false, message: 'Gagal menyimpan profil ke database.' }
    }
  }

  async function register(input: RegisterInput): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult & { registration?: Registration }>('/api/registrations', {
        method: 'POST',
        body: input,
      })
      if (res.ok && res.registration) {
        state.value.registrations.push(res.registration)
      }
      return { ok: res.ok, message: res.message, registrationId: res.registrationId }
    } catch {
      return { ok: false, message: 'Gagal menyimpan pendaftaran ke database.' }
    }
  }

  async function saveProof(
    registrationId: string,
    dataUrl: string,
    name: string,
    source: ProofSource,
    kind: 'bukti-transfer' | 'pendukung',
  ): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult & { proof?: DocumentProof }>(`/api/registrations/${registrationId}/proof`, {
        method: 'POST',
        body: { dataUrl, name, source, kind },
      })
      if (res.ok && res.proof) {
        const registration = getRegistration(registrationId)
        if (registration) {
          if (kind === 'pendukung') {
            registration.supportingDocs.push(res.proof)
          } else {
            registration.proof = res.proof
            registration.paymentStatus = 'Menunggu Verifikasi'
            registration.reviewNote = ''
          }
        }
      }
      return { ok: res.ok, message: res.message }
    } catch {
      return { ok: false, message: 'Gagal mengunggah dokumen ke database.' }
    }
  }

  async function reviewProof(registrationId: string, status: PaymentStatus, note: string): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult & { status?: PaymentStatus; note?: string }>(`/api/registrations/${registrationId}/review`, {
        method: 'PATCH',
        body: { status, note },
      })
      if (res.ok) {
        const registration = getRegistration(registrationId)
        if (registration) {
          registration.paymentStatus = res.status ?? status
          registration.reviewNote = res.note ?? note.trim()
        }
      }
      return { ok: res.ok, message: res.message }
    } catch {
      return { ok: false, message: 'Gagal memperbarui status pembayaran.' }
    }
  }

  async function removeRegistration(registrationId: string): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult>(`/api/registrations/${registrationId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        state.value.registrations = state.value.registrations.filter(r => r.id !== registrationId)
        state.value.winners = state.value.winners.filter(w => w.registrationId !== registrationId)
      }
      return res
    } catch {
      return { ok: false, message: 'Gagal menghapus pendaftaran peserta.' }
    }
  }

  function winnerFor(competitionId: string, rank: 1 | 2 | 3): WinnerRecord | undefined {
    return state.value.winners.find(winner => winner.competitionId === competitionId && winner.rank === rank)
  }

  async function upsertWinner(competitionId: string, rank: 1 | 2 | 3, registrationId: string, prizeAmount = 0): Promise<ActionResult> {
    try {
      const cleanPrize = Math.max(0, Math.round(Number(prizeAmount) || 0))
      const res = await $fetch<ActionResult & { prizeAmount?: number }>('/api/winners', {
        method: 'PUT',
        body: { competitionId, rank, registrationId, prizeAmount: cleanPrize },
      })
      if (res.ok) {
        const finalPrize = res.prizeAmount ?? cleanPrize
        for (const item of registrationsFor(competitionId)) {
          if (item.winnerRank === rank) item.winnerRank = null
        }
        state.value.winners = state.value.winners.filter(winner => !(winner.competitionId === competitionId && winner.rank === rank))
        state.value.winners.push({ competitionId, rank, registrationId, prizeAmount: finalPrize })
        const registration = getRegistration(registrationId)
        if (registration) registration.winnerRank = rank
      }
      return res
    } catch {
      return { ok: false, message: 'Gagal menyimpan data pemenang.' }
    }
  }

  async function removeWinner(competitionId: string, rank: 1 | 2 | 3): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult>('/api/winners', {
        method: 'DELETE',
        body: { competitionId, rank },
      })
      if (res.ok) {
        const winner = winnerFor(competitionId, rank)
        if (winner) {
          const registration = getRegistration(winner.registrationId)
          if (registration) registration.winnerRank = null
          state.value.winners = state.value.winners.filter(item => item !== winner)
        }
      }
      return res
    } catch {
      return { ok: false, message: 'Gagal menghapus data pemenang.' }
    }
  }

  interface NotificationInput {
    type: Exclude<NotificationType, 'Pengumuman'>
    competitionId: string
    recipient: 'branch' | 'winners' | 'all'
    message: string
    channels?: {
      whatsapp: boolean
      email: boolean
    }
  }

  interface NotificationSendResult extends ActionResult {
    deliveries?: RecipientDeliveryReport[]
    integration?: {
      smtpConfigured: boolean
      whatsappConfigured: boolean
      whatsappProvider: string
    }
  }

  async function sendNotification(input: NotificationInput): Promise<NotificationSendResult> {
    try {
      const res = await $fetch<NotificationSendResult & { notifications?: NotificationItem[] }>('/api/notifications', {
        method: 'POST',
        body: input,
      })
      if (res.ok && res.notifications) {
        state.value.notifications.push(...res.notifications)
      }
      return {
        ok: res.ok,
        message: res.message,
        deliveries: res.deliveries,
        integration: res.integration,
      }
    } catch {
      return { ok: false, message: 'Gagal mengirim notifikasi.' }
    }
  }

  async function markNotificationRead(id: string) {
    const item = state.value.notifications.find(notification => notification.id === id)
    if (item) item.read = true
    try {
      await $fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      // Keep UI responsive
    }
  }

  async function markAllRead() {
    for (const item of myNotifications.value) item.read = true
    try {
      await $fetch('/api/notifications/read-all', {
        method: 'PATCH',
        body: { participantId: state.value.session.participantId },
      })
      toast('Semua notifikasi ditandai dibaca.', 'success')
    } catch {
      toast('Gagal menandai notifikasi di database.', 'error')
    }
  }

  async function publishAnnouncement(input: { title: string; body: string; tag: string }): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult & { announcement?: Announcement; notification?: NotificationItem }>('/api/announcements', {
        method: 'POST',
        body: input,
      })
      if (res.ok) {
        if (res.announcement) state.value.announcements.unshift(res.announcement)
        if (res.notification) state.value.notifications.push(res.notification)
      }
      return { ok: res.ok, message: res.message }
    } catch {
      return { ok: false, message: 'Gagal menerbitkan pengumuman.' }
    }
  }

  async function updateBranch(id: string, patch: Pick<FestivalBranch, 'date' | 'startTime' | 'endTime'>): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult>(`/api/branches/${id}`, {
        method: 'PATCH',
        body: patch,
      })
      if (res.ok) {
        const branch = getBranch(id)
        if (branch) Object.assign(branch, patch)
      }
      return res
    } catch {
      return { ok: false, message: 'Gagal memperbarui jadwal cabang.' }
    }
  }

  async function updateCompetition(id: string, patch: { fee?: number; maxQuota?: number }): Promise<ActionResult> {
    try {
      const res = await $fetch<ActionResult & { fee?: number; maxQuota?: number }>(`/api/competitions/${id}`, {
        method: 'PATCH',
        body: patch,
      })
      if (res.ok) {
        const competition = getCompetition(id)
        if (competition) {
          if (res.fee !== undefined) competition.fee = res.fee
          if (res.maxQuota !== undefined) competition.maxQuota = res.maxQuota as typeof MAX_QUOTA
        }
      }
      return { ok: res.ok, message: res.message }
    } catch {
      return { ok: false, message: 'Gagal memperbarui pengaturan lomba.' }
    }
  }

  async function toggleCertificateClaim(enabled: boolean): Promise<ActionResult & { certificateClaimEnabled?: boolean }> {
    try {
      const res = await $fetch<ActionResult & { certificateClaimEnabled?: boolean }>('/api/settings/certificates', {
        method: 'PATCH',
        body: { enabled },
      })
      if (res.ok) {
        state.value.settings = {
          certificateClaimEnabled: res.certificateClaimEnabled ?? enabled,
        }
      }
      return res
    } catch {
      return { ok: false, message: 'Gagal memperbarui status klaim sertifikat.' }
    }
  }

  const categoryList: Category[] = ['Seni', 'Olahraga Individu', 'Olahraga Tim', 'Akademik']
  const divisionList: Division[] = ['Umum', 'Putra', 'Putri', 'Tim']

  return {
    state,
    hydrated,
    loading,
    dbError,
    toasts,
    session,
    currentParticipant,
    myRegistrations,
    myNotifications,
    unreadCount,
    pendingReviews,
    categoryList,
    divisionList,
    hydrate,
    toast,
    dismissToast,
    getBranch,
    getCompetition,
    getRegistration,
    registrationsFor,
    filledSlots,
    remainingSlots,
    isFull,
    isRegistered,
    branchOf,
    login,
    registerAccount,
    logout,
    updateProfile,
    register,
    saveProof,
    reviewProof,
    removeRegistration,
    winnerFor,
    upsertWinner,
    removeWinner,
    sendNotification,
    markNotificationRead,
    markAllRead,
    publishAnnouncement,
    updateBranch,
    updateCompetition,
    toggleCertificateClaim,
  }
}
