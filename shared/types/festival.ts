export type Role = 'peserta' | 'panitia'
export type Category = 'Seni' | 'Olahraga Individu' | 'Olahraga Tim' | 'Akademik'
export type Division = 'Umum' | 'Putra' | 'Putri' | 'Tim'
export type Accent = 'red' | 'yellow' | 'blue' | 'green' | 'pink'
export type PaymentStatus =
  | 'Belum Bayar'
  | 'Menunggu Verifikasi'
  | 'Terverifikasi'
  | 'Lunas'
  | 'Perlu Diperbaiki'
  | 'Ditolak'
export type NotificationType =
  | 'Pelunasan Pembayaran'
  | 'Stand By Pembagian Trophy'
  | 'Pengumuman'
export type ProofSource = 'camera' | 'upload'

export const MAX_QUOTA = 15 as const
export const DEMO_PASSWORD = 'demo1234'

export interface FestivalBranch {
  id: string
  name: string
  category: Category
  date: string
  startTime: string
  endTime: string
  description: string
  accent: Accent
}

export interface Competition {
  id: string
  branchId: string
  name: string
  category: Category
  division: Division
  fee: number
  maxQuota: typeof MAX_QUOTA
}

export interface ParticipantProfile {
  id: string
  namaLengkap: string
  asalSekolah: string
  noWhatsapp: string
  email?: string
  jenisKelamin: 'Putra' | 'Putri'
  kategori: 'Siswa' | 'Mahasiswa' | 'Umum'
}

export type DeliveryStatus = 'sent' | 'ready' | 'missing' | 'failed'

export interface ChannelDeliveryResult {
  status: DeliveryStatus
  target: string
  url: string
  webUrl?: string
  appUrl?: string
  gmailUrl?: string
  senderEmail?: string
  messageText?: string
  detail: string
}

export interface RecipientDeliveryReport {
  participantId: string
  namaLengkap: string
  whatsapp?: ChannelDeliveryResult
  email?: ChannelDeliveryResult
}

export interface TeamMember {
  id: string
  namaLengkap: string
  asalSekolah: string
  noWhatsapp: string
  posisi: string
}

export interface DocumentProof {
  id: string
  name: string
  dataUrl: string
  capturedAt: string
  source: ProofSource
  sizeBytes: number
}

export interface Registration {
  id: string
  participantId: string
  competitionId: string
  type: 'solo' | 'team'
  teamName: string
  members: TeamMember[]
  paymentStatus: PaymentStatus
  proof: DocumentProof | null
  supportingDocs: DocumentProof[]
  registeredAt: string
  reviewNote: string
  winnerRank: 1 | 2 | 3 | null
}

export interface WinnerRecord {
  competitionId: string
  rank: 1 | 2 | 3
  registrationId: string
  prizeAmount: number
}

export interface NotificationItem {
  id: string
  participantId: string | 'all'
  type: NotificationType
  title: string
  body: string
  competitionId: string
  createdAt: string
  read: boolean
}

export interface Announcement {
  id: string
  title: string
  body: string
  tag: string
  publishedAt: string
}

export interface Session {
  role: Role | null
  email: string
  participantId: string | null
  displayName?: string
}

export interface ToastItem {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
}

export interface FestivalSettings {
  certificateClaimEnabled: boolean
}

export interface FestivalState {
  version: 1
  branches: FestivalBranch[]
  competitions: Competition[]
  participants: ParticipantProfile[]
  registrations: Registration[]
  winners: WinnerRecord[]
  notifications: NotificationItem[]
  announcements: Announcement[]
  settings: FestivalSettings
  session: Session
  counters: Record<string, number>
}
