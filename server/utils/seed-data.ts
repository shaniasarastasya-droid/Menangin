import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import {
  DEMO_PASSWORD,
  MAX_QUOTA,
  type Announcement,
  type Competition,
  type FestivalBranch,
  type NotificationItem,
  type ParticipantProfile,
  type Registration,
  type Role,
  type TeamMember,
  type WinnerRecord,
} from '#shared/types/festival'

export interface SeedUser {
  id: string
  email: string
  role: Role
  participantId: string | null
  displayName: string
  passwordHash: string
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = scryptSync(password, salt, 64)
  const storedBuf = Buffer.from(hash, 'hex')
  if (derived.length !== storedBuf.length) return false
  return timingSafeEqual(derived, storedBuf)
}

export const BRANCH_DATA: FestivalBranch[] = [
  { id: 'b-bernyanyi', name: 'Bernyanyi', category: 'Seni', date: '2026-12-05', startTime: '09.00', endTime: '12.00', description: 'Panggung terbuka untuk solois dan penulis lagu muda.', accent: 'red' },
  { id: 'b-gitar-solo', name: 'Gitar Solo', category: 'Seni', date: '2026-12-06', startTime: '13.00', endTime: '16.00', description: 'Acar, fingerstyle, atau aransemen bebas—satu gitar, satu cerita.', accent: 'pink' },
  { id: 'b-sprint', name: 'Sprint 100m', category: 'Olahraga Individu', date: '2026-12-07', startTime: '07.00', endTime: '10.00', description: 'Putra dan Putri bertanding di hari yang sama, lintasan berbeda.', accent: 'yellow' },
  { id: 'b-renang', name: 'Renang 50m', category: 'Olahraga Individu', date: '2026-12-08', startTime: '08.00', endTime: '11.00', description: 'Gaya bebas, dua arah, satu kesempatan untuk finis tercepat.', accent: 'blue' },
  { id: 'b-badminton', name: 'Badminton', category: 'Olahraga Individu', date: '2026-12-09', startTime: '13.00', endTime: '17.00', description: 'Tunggal putra dan putri, sistem knockout dari babak pertama.', accent: 'green' },
  { id: 'b-volley-putra', name: 'Volley Putra', category: 'Olahraga Tim', date: '2026-12-10', startTime: '08.00', endTime: '12.00', description: 'Tim putra, enam pemain lapangan dan dua cadangan.', accent: 'blue' },
  { id: 'b-volley-putri', name: 'Volley Putri', category: 'Olahraga Tim', date: '2026-12-11', startTime: '08.00', endTime: '12.00', description: 'Tim putri, sistem set pendek dengan finale tie-break.', accent: 'pink' },
  { id: 'b-basket-putra', name: 'Basket Putra', category: 'Olahraga Tim', date: '2026-12-12', startTime: '13.00', endTime: '17.00', description: 'Turnamen setengah lapangan dengan rotasi lengkap.', accent: 'red' },
  { id: 'b-mini-soccer-putra', name: 'Mini Soccer Putra', category: 'Olahraga Tim', date: '2026-12-13', startTime: '15.00', endTime: '18.00', description: 'Lapangan sintetis, tikar dua belas menit per babak.', accent: 'green' },
  { id: 'b-olimpiade', name: 'Olimpiade Sains & Logika', category: 'Akademik', date: '2026-12-14', startTime: '09.00', endTime: '12.00', description: 'Fisika, biologi, matematika, dan teka-teki logika.', accent: 'blue' },
  { id: 'b-cerdas-cermat', name: 'Cerdas Cermat', category: 'Akademik', date: '2026-12-15', startTime: '13.00', endTime: '16.00', description: 'Tiga anggota tim, satu buzzer, banyak pertanyaan.', accent: 'yellow' },
  { id: 'b-karya-tulis', name: 'Karya Tulis Pelajar', category: 'Akademik', date: '2026-12-16', startTime: '09.00', endTime: '11.00', description: 'Esai ilmiah maksimal 2.000 kata, dikirim sebelum technical meeting.', accent: 'red' },
]

export const COMPETITION_DATA: Competition[] = [
  { id: 'c-bernyanyi', branchId: 'b-bernyanyi', name: 'Bernyanyi', category: 'Seni', division: 'Umum', fee: 75000, maxQuota: MAX_QUOTA },
  { id: 'c-gitar-solo', branchId: 'b-gitar-solo', name: 'Gitar Solo', category: 'Seni', division: 'Umum', fee: 75000, maxQuota: MAX_QUOTA },
  { id: 'c-sprint-putra', branchId: 'b-sprint', name: 'Sprint Putra', category: 'Olahraga Individu', division: 'Putra', fee: 60000, maxQuota: MAX_QUOTA },
  { id: 'c-sprint-putri', branchId: 'b-sprint', name: 'Sprint Putri', category: 'Olahraga Individu', division: 'Putri', fee: 60000, maxQuota: MAX_QUOTA },
  { id: 'c-renang-putra', branchId: 'b-renang', name: 'Renang Putra', category: 'Olahraga Individu', division: 'Putra', fee: 60000, maxQuota: MAX_QUOTA },
  { id: 'c-renang-putri', branchId: 'b-renang', name: 'Renang Putri', category: 'Olahraga Individu', division: 'Putri', fee: 60000, maxQuota: MAX_QUOTA },
  { id: 'c-badminton-putra', branchId: 'b-badminton', name: 'Badminton Putra', category: 'Olahraga Individu', division: 'Putra', fee: 60000, maxQuota: MAX_QUOTA },
  { id: 'c-badminton-putri', branchId: 'b-badminton', name: 'Badminton Putri', category: 'Olahraga Individu', division: 'Putri', fee: 60000, maxQuota: MAX_QUOTA },
  { id: 'c-volley-putra', branchId: 'b-volley-putra', name: 'Volley Putra', category: 'Olahraga Tim', division: 'Tim', fee: 150000, maxQuota: MAX_QUOTA },
  { id: 'c-volley-putri', branchId: 'b-volley-putri', name: 'Volley Putri', category: 'Olahraga Tim', division: 'Tim', fee: 150000, maxQuota: MAX_QUOTA },
  { id: 'c-basket-putra', branchId: 'b-basket-putra', name: 'Basket Putra', category: 'Olahraga Tim', division: 'Tim', fee: 150000, maxQuota: MAX_QUOTA },
  { id: 'c-mini-soccer-putra', branchId: 'b-mini-soccer-putra', name: 'Mini Soccer Putra', category: 'Olahraga Tim', division: 'Tim', fee: 180000, maxQuota: MAX_QUOTA },
  { id: 'c-olimpiade', branchId: 'b-olimpiade', name: 'Olimpiade Sains & Logika', category: 'Akademik', division: 'Umum', fee: 50000, maxQuota: MAX_QUOTA },
  { id: 'c-cerdas-cermat', branchId: 'b-cerdas-cermat', name: 'Cerdas Cermat', category: 'Akademik', division: 'Umum', fee: 50000, maxQuota: MAX_QUOTA },
  { id: 'c-karya-tulis', branchId: 'b-karya-tulis', name: 'Karya Tulis Pelajar', category: 'Akademik', division: 'Umum', fee: 50000, maxQuota: MAX_QUOTA },
]

export const SEED_PARTICIPANTS: ParticipantProfile[] = [
  { id: 'p-001', namaLengkap: 'Ayu Kartika Putri', asalSekolah: 'SMA Negeri 1 Yogyakarta', noWhatsapp: '081234567890', email: 'peserta@menangin.id', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-002', namaLengkap: 'Raka Pratama', asalSekolah: 'SMA Negeri 8 Jakarta', noWhatsapp: '081234567802', email: 'raka.pratama@example.com', jenisKelamin: 'Putra', kategori: 'Siswa' },
  { id: 'p-003', namaLengkap: 'Nadia Aulia', asalSekolah: 'SMA Negeri 3 Bandung', noWhatsapp: '081234567803', email: 'nadia.aulia@example.com', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-004', namaLengkap: 'Dimas Kurniawan', asalSekolah: 'Universitas Gadjah Mada', noWhatsapp: '081234567804', email: 'dimas.kurniawan@example.com', jenisKelamin: 'Putra', kategori: 'Mahasiswa' },
  { id: 'p-005', namaLengkap: 'Sinta Maharani', asalSekolah: 'SMA Negeri 2 Surabaya', noWhatsapp: '081234567805', email: 'sinta.maharani@example.com', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-006', namaLengkap: 'Bagas Prakoso', asalSekolah: 'SMK Negeri 1 Semarang', noWhatsapp: '081234567806', email: 'bagas.prakoso@example.com', jenisKelamin: 'Putra', kategori: 'Siswa' },
  { id: 'p-007', namaLengkap: 'Laras Wulandari', asalSekolah: 'SMA Negeri 4 Malang', noWhatsapp: '081234567807', email: 'laras.wulandari@example.com', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-008', namaLengkap: 'Fajar Ramadhan', asalSekolah: 'SMA Negeri 1 Medan', noWhatsapp: '081234567808', email: 'fajar.ramadhan@example.com', jenisKelamin: 'Putra', kategori: 'Siswa' },
  { id: 'p-009', namaLengkap: 'Intan Permata', asalSekolah: 'SMA Negeri 5 Denpasar', noWhatsapp: '081234567809', email: 'intan.permata@example.com', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-010', namaLengkap: 'Aditya Nugroho', asalSekolah: 'Universitas Indonesia', noWhatsapp: '081234567810', email: 'aditya.nugroho@example.com', jenisKelamin: 'Putra', kategori: 'Mahasiswa' },
  { id: 'p-011', namaLengkap: 'Kirana Lestari', asalSekolah: 'SMA Negeri 7 Bogor', noWhatsapp: '081234567811', email: 'kirana.lestari@example.com', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-012', namaLengkap: 'Bima Mahendra', asalSekolah: 'Institut Teknologi Bandung', noWhatsapp: '081234567812', email: 'bima.mahendra@example.com', jenisKelamin: 'Putra', kategori: 'Mahasiswa' },
  { id: 'p-013', namaLengkap: 'Zahra Khairunnisa', asalSekolah: 'SMA Negeri 1 Solo', noWhatsapp: '081234567813', email: 'zahra.khairunnisa@example.com', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-014', namaLengkap: 'Farhan Alfarizi', asalSekolah: 'SMA Negeri 2 Depok', noWhatsapp: '081234567814', email: 'farhan.alfarizi@example.com', jenisKelamin: 'Putra', kategori: 'Siswa' },
  { id: 'p-015', namaLengkap: 'Cinta Rahmawati', asalSekolah: 'Universitas Padjadjaran', noWhatsapp: '081234567815', email: 'cinta.rahmawati@example.com', jenisKelamin: 'Putri', kategori: 'Mahasiswa' },
  { id: 'p-016', namaLengkap: 'Reza Pahlevi', asalSekolah: 'SMA Negeri 6 Tangerang', noWhatsapp: '081234567816', email: 'reza.pahlevi@example.com', jenisKelamin: 'Putra', kategori: 'Siswa' },
  { id: 'p-017', namaLengkap: 'Tiara Kusuma', asalSekolah: 'SMA Negeri 1 Bekasi', noWhatsapp: '081234567817', email: 'tiara.kusuma@example.com', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-018', namaLengkap: 'Ilham Saputra', asalSekolah: 'Universitas Diponegoro', noWhatsapp: '081234567818', email: 'ilham.saputra@example.com', jenisKelamin: 'Putra', kategori: 'Mahasiswa' },
  { id: 'p-019', namaLengkap: 'Mutiara Salsabila', asalSekolah: 'SMA Negeri 3 Palembang', noWhatsapp: '081234567819', email: 'mutiara.salsabila@example.com', jenisKelamin: 'Putri', kategori: 'Siswa' },
  { id: 'p-020', namaLengkap: 'Arif Hidayatullah', asalSekolah: 'SMA Negeri 1 Makassar', noWhatsapp: '081234567820', email: 'arif.hidayat@example.com', jenisKelamin: 'Putra', kategori: 'Siswa' },
]

// Target jumlah terisi awal per cabang: ramai & bervariasi (9–13 dari 15), TIDAK ADA yang penuh (15/15)
const TARGET_FILLED: Record<string, number> = {
  'c-bernyanyi': 13,
  'c-gitar-solo': 11,
  'c-sprint-putra': 12,
  'c-sprint-putri': 11,
  'c-renang-putra': 10,
  'c-renang-putri': 9,
  'c-badminton-putra': 13,
  'c-badminton-putri': 11,
  'c-volley-putra': 12,
  'c-volley-putri': 10,
  'c-basket-putra': 13,
  'c-mini-soccer-putra': 12,
  'c-olimpiade': 13,
  'c-cerdas-cermat': 10,
  'c-karya-tulis': 11,
}

const TEAM_NAMES = [
  'Garuda Muda', 'Elang Nusantara', 'Rajawali Club', 'Bintang Timur', 'Satria Arena',
  'Ksatria Jaya', 'Surya Perkasa', 'Srikandi Squad', 'Pegasus United', 'Cakrawala FC',
  'Mutiara Tim', 'Nusantara Pride', 'Gema Juara', 'Laskar Muda',
]

function buildSeedMembers(prefix: string, captain: ParticipantProfile): TeamMember[] {
  return [
    { id: `${prefix}-m1`, namaLengkap: captain.namaLengkap, asalSekolah: captain.asalSekolah, noWhatsapp: captain.noWhatsapp, posisi: 'Kapten' },
    { id: `${prefix}-m2`, namaLengkap: 'Dewi Anggraini', asalSekolah: captain.asalSekolah, noWhatsapp: '081290001002', posisi: 'Inti' },
    { id: `${prefix}-m3`, namaLengkap: 'Rizky Ananda', asalSekolah: captain.asalSekolah, noWhatsapp: '081290001003', posisi: 'Inti' },
    { id: `${prefix}-m4`, namaLengkap: 'Gita Safitri', asalSekolah: captain.asalSekolah, noWhatsapp: '081290001004', posisi: 'Inti' },
    { id: `${prefix}-m5`, namaLengkap: 'Hanif Maulana', asalSekolah: captain.asalSekolah, noWhatsapp: '081290001005', posisi: 'Cadangan' },
  ]
}

export function buildSeedRegistrations(participants: ParticipantProfile[]): Registration[] {
  const registrations: Registration[] = []
  const pool = participants.filter(p => p.id !== 'p-001') // Keep demo account p-001 clean so demo user can register freely
  const putraPool = pool.filter(p => p.jenisKelamin === 'Putra')
  const putriPool = pool.filter(p => p.jenisKelamin === 'Putri')

  let counter = 1
  for (const [compIdx, comp] of COMPETITION_DATA.entries()) {
    const count = Math.min(TARGET_FILLED[comp.id] ?? 10, MAX_QUOTA - 2)
    const preferred = comp.division === 'Putra'
      ? [...putraPool, ...putriPool]
      : comp.division === 'Putri'
        ? [...putriPool, ...putraPool]
        : pool
    const isTeam = comp.division === 'Tim'

    for (let i = 0; i < count; i++) {
      const person = preferred[(i + compIdx) % preferred.length]!
      const id = `r-seed-${String(counter++).padStart(3, '0')}`
      const day = String(10 + ((i + compIdx) % 12)).padStart(2, '0')
      registrations.push({
        id,
        participantId: person.id,
        competitionId: comp.id,
        type: isTeam ? 'team' : 'solo',
        teamName: isTeam ? `${TEAM_NAMES[(i + compIdx) % TEAM_NAMES.length]} ${i + 1}` : '',
        members: isTeam ? buildSeedMembers(id, person) : [],
        paymentStatus: i % 4 === 0 ? 'Menunggu Verifikasi' : 'Lunas',
        proof: null,
        supportingDocs: [],
        registeredAt: `2026-11-${day} ${String(9 + (i % 8)).padStart(2, '0')}.15`,
        reviewNote: '',
        winnerRank: null,
      })
    }
  }

  return registrations
}

export function createInitialSeedData() {
  const participants = SEED_PARTICIPANTS.map(item => ({ ...item }))

  const users: SeedUser[] = [
    { id: 'u-peserta', email: 'peserta@menangin.id', role: 'peserta', participantId: 'p-001', displayName: 'Ayu Kartika Putri', passwordHash: hashPassword(DEMO_PASSWORD) },
    { id: 'u-panitia', email: 'panitia@menangin.id', role: 'panitia', participantId: null, displayName: 'Komite Menangin!', passwordHash: hashPassword(DEMO_PASSWORD) },
  ]

  const registrations = buildSeedRegistrations(participants)
  const winners: WinnerRecord[] = []

  const notifications: NotificationItem[] = [
    {
      id: 'n-001',
      participantId: 'all',
      type: 'Pengumuman',
      title: 'Jadwal Final Diumumkan',
      body: 'Seluruh jadwal cabang lomba tersedia di halaman utama. Cek kuota sebelum mendaftar!',
      competitionId: '',
      createdAt: '2026-11-20 08.00',
      read: false,
    },
  ]

  const announcements: Announcement[] = [
    { id: 'a-001', title: 'Pendaftaran dibuka!', body: 'Kuota setiap cabang maksimal 15 peserta. Amankan tempatmu sebelum penuh.', tag: 'PENDAFTARAN', publishedAt: '2026-11-01 08.00' },
    { id: 'a-002', title: 'Technical meeting 3 Desember', body: 'Technical meeting dilaksanakan secara online. Link akan dibagikan melalui inbox peserta.', tag: 'INFO PENTING', publishedAt: '2026-11-15 10.00' },
    { id: 'a-003', title: 'Festival 12 hari, 12 cabang', body: 'Seni, olahraga individu, olahraga tim, dan akademik—satu per hari mulai 5 Desember.', tag: 'JADWAL', publishedAt: '2026-11-18 12.00' },
  ]

  return {
    branches: BRANCH_DATA.map(item => ({ ...item })),
    competitions: COMPETITION_DATA.map(item => ({ ...item })),
    participants,
    users,
    registrations,
    winners,
    notifications,
    announcements,
    settings: { certificateClaimEnabled: false },
  }
}
