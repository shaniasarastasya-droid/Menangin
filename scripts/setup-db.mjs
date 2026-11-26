import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes, scryptSync } from 'node:crypto'
import mysql from 'mysql2/promise'

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const content = readFileSync(filePath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const rawVal = trimmed.slice(eq + 1).trim()
    const value = rawVal.replace(/^['"]|['"]$/g, '')
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile(resolve(process.cwd(), '.env'))

const host = process.env.TIDB_HOST
const port = Number(process.env.TIDB_PORT || 4000)
const user = process.env.TIDB_USER
const password = process.env.TIDB_PASSWORD
const database = process.env.TIDB_DATABASE || 'menangin'
const useSsl = process.env.TIDB_SSL !== 'false'
const caPath = process.env.TIDB_CA_PATH || ''
const shouldReset = process.argv.includes('--reset')

if (!host || !user || !password) {
  console.error('Error: TIDB_HOST, TIDB_USER, dan TIDB_PASSWORD harus diisi di .env')
  process.exit(1)
}

if (!/^[a-zA-Z0-9_]+$/.test(database)) {
  console.error(`Error: Nama database tidak valid: ${database}`)
  process.exit(1)
}

const ssl = useSsl
  ? caPath
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true, ca: readFileSync(caPath, 'utf8') }
    : { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  : undefined

function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(plain, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(40) NOT NULL,
    date VARCHAR(16) NOT NULL,
    start_time VARCHAR(16) NOT NULL,
    end_time VARCHAR(16) NOT NULL,
    description TEXT NOT NULL,
    accent VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_branches_date (date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS competitions (
    id VARCHAR(64) PRIMARY KEY,
    branch_id VARCHAR(64) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(40) NOT NULL,
    division VARCHAR(20) NOT NULL,
    fee INT NOT NULL,
    max_quota INT NOT NULL DEFAULT 15,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_competitions_branch (branch_id),
    CONSTRAINT fk_competitions_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR(64) PRIMARY KEY,
    nama_lengkap VARCHAR(160) NOT NULL,
    asal_sekolah VARCHAR(160) NOT NULL,
    no_whatsapp VARCHAR(40) NOT NULL,
    email VARCHAR(160) NOT NULL DEFAULT '',
    jenis_kelamin VARCHAR(16) NOT NULL,
    kategori VARCHAR(24) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(160) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL,
    participant_id VARCHAR(64) NULL,
    display_name VARCHAR(160) NOT NULL DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_participant FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS registrations (
    id VARCHAR(64) PRIMARY KEY,
    participant_id VARCHAR(64) NOT NULL,
    competition_id VARCHAR(64) NOT NULL,
    type VARCHAR(16) NOT NULL,
    team_name VARCHAR(160) NOT NULL DEFAULT '',
    payment_status VARCHAR(40) NOT NULL,
    registered_at VARCHAR(32) NOT NULL,
    review_note TEXT NOT NULL,
    winner_rank TINYINT NULL,
    created_seq BIGINT AUTO_INCREMENT UNIQUE,
    UNIQUE KEY uq_reg_participant_comp (participant_id, competition_id),
    INDEX idx_reg_competition (competition_id),
    CONSTRAINT fk_reg_participant FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_competition FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(64) PRIMARY KEY,
    registration_id VARCHAR(64) NOT NULL,
    nama_lengkap VARCHAR(160) NOT NULL,
    asal_sekolah VARCHAR(160) NOT NULL,
    no_whatsapp VARCHAR(40) NOT NULL,
    posisi VARCHAR(80) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_team_members_reg (registration_id),
    CONSTRAINT fk_team_members_reg FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    registration_id VARCHAR(64) NOT NULL,
    kind VARCHAR(24) NOT NULL,
    name VARCHAR(255) NOT NULL,
    data_url MEDIUMTEXT NOT NULL,
    captured_at VARCHAR(32) NOT NULL,
    source VARCHAR(16) NOT NULL,
    size_bytes INT NOT NULL,
    created_seq BIGINT AUTO_INCREMENT UNIQUE,
    INDEX idx_documents_reg (registration_id),
    CONSTRAINT fk_documents_reg FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS winners (
    competition_id VARCHAR(64) NOT NULL,
    winner_rank TINYINT NOT NULL,
    registration_id VARCHAR(64) NOT NULL,
    prize_amount INT NOT NULL DEFAULT 0,
    PRIMARY KEY (competition_id, winner_rank),
    CONSTRAINT fk_winners_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_winners_reg FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    participant_id VARCHAR(64) NOT NULL,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(180) NOT NULL,
    body TEXT NOT NULL,
    competition_id VARCHAR(64) NOT NULL DEFAULT '',
    created_at VARCHAR(32) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_seq BIGINT AUTO_INCREMENT UNIQUE,
    INDEX idx_notifications_participant (participant_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    tag VARCHAR(40) NOT NULL,
    published_at VARCHAR(32) NOT NULL,
    created_seq BIGINT AUTO_INCREMENT UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS festival_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
]

function buildSeedData() {
  const branches = [
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

  const competitions = [
    { id: 'c-bernyanyi', branchId: 'b-bernyanyi', name: 'Bernyanyi', category: 'Seni', division: 'Umum', fee: 75000, maxQuota: 15 },
    { id: 'c-gitar-solo', branchId: 'b-gitar-solo', name: 'Gitar Solo', category: 'Seni', division: 'Umum', fee: 75000, maxQuota: 15 },
    { id: 'c-sprint-putra', branchId: 'b-sprint', name: 'Sprint Putra', category: 'Olahraga Individu', division: 'Putra', fee: 60000, maxQuota: 15 },
    { id: 'c-sprint-putri', branchId: 'b-sprint', name: 'Sprint Putri', category: 'Olahraga Individu', division: 'Putri', fee: 60000, maxQuota: 15 },
    { id: 'c-renang-putra', branchId: 'b-renang', name: 'Renang Putra', category: 'Olahraga Individu', division: 'Putra', fee: 60000, maxQuota: 15 },
    { id: 'c-renang-putri', branchId: 'b-renang', name: 'Renang Putri', category: 'Olahraga Individu', division: 'Putri', fee: 60000, maxQuota: 15 },
    { id: 'c-badminton-putra', branchId: 'b-badminton', name: 'Badminton Putra', category: 'Olahraga Individu', division: 'Putra', fee: 60000, maxQuota: 15 },
    { id: 'c-badminton-putri', branchId: 'b-badminton', name: 'Badminton Putri', category: 'Olahraga Individu', division: 'Putri', fee: 60000, maxQuota: 15 },
    { id: 'c-volley-putra', branchId: 'b-volley-putra', name: 'Volley Putra', category: 'Olahraga Tim', division: 'Tim', fee: 150000, maxQuota: 15 },
    { id: 'c-volley-putri', branchId: 'b-volley-putri', name: 'Volley Putri', category: 'Olahraga Tim', division: 'Tim', fee: 150000, maxQuota: 15 },
    { id: 'c-basket-putra', branchId: 'b-basket-putra', name: 'Basket Putra', category: 'Olahraga Tim', division: 'Tim', fee: 150000, maxQuota: 15 },
    { id: 'c-mini-soccer-putra', branchId: 'b-mini-soccer-putra', name: 'Mini Soccer Putra', category: 'Olahraga Tim', division: 'Tim', fee: 180000, maxQuota: 15 },
    { id: 'c-olimpiade', branchId: 'b-olimpiade', name: 'Olimpiade Sains & Logika', category: 'Akademik', division: 'Umum', fee: 50000, maxQuota: 15 },
    { id: 'c-cerdas-cermat', branchId: 'b-cerdas-cermat', name: 'Cerdas Cermat', category: 'Akademik', division: 'Umum', fee: 50000, maxQuota: 15 },
    { id: 'c-karya-tulis', branchId: 'b-karya-tulis', name: 'Karya Tulis Pelajar', category: 'Akademik', division: 'Umum', fee: 50000, maxQuota: 15 },
  ]

  const participants = [
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

  const users = [
    { id: 'u-peserta', email: 'peserta@menangin.id', role: 'peserta', participantId: 'p-001', displayName: 'Ayu Kartika Putri', passwordHash: hashPassword('demo1234') },
    { id: 'u-panitia', email: 'panitia@menangin.id', role: 'panitia', participantId: null, displayName: 'Komite Menangin!', passwordHash: hashPassword('demo1234') },
  ]

  const targetFilled = {
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
  const teamNames = ['Garuda Muda', 'Elang Nusantara', 'Rajawali Club', 'Bintang Timur', 'Satria Arena', 'Ksatria Jaya', 'Surya Perkasa', 'Srikandi Squad', 'Pegasus United', 'Cakrawala FC', 'Mutiara Tim', 'Nusantara Pride', 'Gema Juara', 'Laskar Muda']
  const pool = participants.filter(p => p.id !== 'p-001')
  const putraPool = pool.filter(p => p.jenisKelamin === 'Putra')
  const putriPool = pool.filter(p => p.jenisKelamin === 'Putri')
  const registrations = []
  let regCounter = 1
  for (const [compIdx, comp] of competitions.entries()) {
    const count = Math.min(targetFilled[comp.id] ?? 10, 13)
    const preferred = comp.division === 'Putra' ? [...putraPool, ...putriPool] : comp.division === 'Putri' ? [...putriPool, ...putraPool] : pool
    const isTeam = comp.division === 'Tim'
    for (let i = 0; i < count; i++) {
      const person = preferred[(i + compIdx) % preferred.length]
      const id = `r-seed-${String(regCounter++).padStart(3, '0')}`
      const day = String(10 + ((i + compIdx) % 12)).padStart(2, '0')
      registrations.push({
        id,
        participantId: person.id,
        competitionId: comp.id,
        type: isTeam ? 'team' : 'solo',
        teamName: isTeam ? `${teamNames[(i + compIdx) % teamNames.length]} ${i + 1}` : '',
        members: isTeam
          ? [
              { id: `${id}-m1`, namaLengkap: person.namaLengkap, asalSekolah: person.asalSekolah, noWhatsapp: person.noWhatsapp, posisi: 'Kapten' },
              { id: `${id}-m2`, namaLengkap: 'Dewi Anggraini', asalSekolah: person.asalSekolah, noWhatsapp: '081290001002', posisi: 'Inti' },
              { id: `${id}-m3`, namaLengkap: 'Rizky Ananda', asalSekolah: person.asalSekolah, noWhatsapp: '081290001003', posisi: 'Inti' },
              { id: `${id}-m4`, namaLengkap: 'Gita Safitri', asalSekolah: person.asalSekolah, noWhatsapp: '081290001004', posisi: 'Inti' },
              { id: `${id}-m5`, namaLengkap: 'Hanif Maulana', asalSekolah: person.asalSekolah, noWhatsapp: '081290001005', posisi: 'Cadangan' },
            ]
          : [],
        paymentStatus: i % 4 === 0 ? 'Menunggu Verifikasi' : 'Lunas',
        proof: null,
        supportingDocs: [],
        registeredAt: `2026-11-${day} ${String(9 + (i % 8)).padStart(2, '0')}.15`,
        reviewNote: '',
        winnerRank: null,
      })
    }
  }
  const winners = []

  const notifications = [
    { id: 'n-001', participantId: 'all', type: 'Pengumuman', title: 'Jadwal Final Diumumkan', body: 'Seluruh jadwal cabang lomba tersedia di halaman utama. Cek kuota sebelum mendaftar!', competitionId: '', createdAt: '2026-11-20 08.00', read: false },
  ]

  const announcements = [
    { id: 'a-001', title: 'Pendaftaran dibuka!', body: 'Kuota setiap cabang maksimal 15 peserta. Amankan tempatmu sebelum penuh.', tag: 'PENDAFTARAN', publishedAt: '2026-11-01 08.00' },
    { id: 'a-002', title: 'Technical meeting 3 Desember', body: 'Technical meeting dilaksanakan secara online. Link akan dibagikan melalui inbox peserta.', tag: 'INFO PENTING', publishedAt: '2026-11-15 10.00' },
    { id: 'a-003', title: 'Festival 12 hari, 12 cabang', body: 'Seni, olahraga individu, olahraga tim, dan akademik—satu per hari mulai 5 Desember.', tag: 'JADWAL', publishedAt: '2026-11-18 12.00' },
  ]

  return { branches, competitions, participants, users, registrations, winners, notifications, announcements }
}

async function main() {
  console.log(`Connecting to TiDB Cloud (${host}:${port})...`)
  const bootstrapConn = await mysql.createConnection({ host, port, user, password, ssl })
  await bootstrapConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  console.log(`Database '${database}' ready.`)
  await bootstrapConn.end()

  const conn = await mysql.createConnection({ host, port, user, password, database, ssl })

  try {
    if (shouldReset) {
      console.log('Resetting existing tables...')
      const dropOrder = [
        'winners',
        'documents',
        'team_members',
        'registrations',
        'users',
        'notifications',
        'announcements',
        'competitions',
        'participants',
        'branches',
      ]
      for (const table of dropOrder) {
        await conn.query(`DROP TABLE IF EXISTS \`${table}\``)
      }
    }

    for (const stmt of SCHEMA_STATEMENTS) {
      await conn.query(stmt)
    }
    await conn.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS email VARCHAR(160) NOT NULL DEFAULT ''`)
    await conn.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(160) NOT NULL DEFAULT ''`)
    await conn.query(`ALTER TABLE winners ADD COLUMN IF NOT EXISTS prize_amount INT NOT NULL DEFAULT 0`)
    await conn.query(`UPDATE users SET display_name = 'Ayu Kartika Putri' WHERE id = 'u-peserta' AND display_name = ''`)
    await conn.query(`UPDATE users SET display_name = 'Komite Menangin!' WHERE id = 'u-panitia' AND display_name = ''`)
    await conn.query(`UPDATE participants p INNER JOIN users u ON u.participant_id = p.id SET p.email = u.email WHERE p.email = ''`)
    console.log('Schema verified (10 tables ready).')

    const [countRows] = await conn.query('SELECT COUNT(*) AS total FROM branches')
    const existingCount = Number(countRows[0]?.total ?? 0)

    if (existingCount === 0) {
      console.log('Seeding initial festival data...')
      const seed = buildSeedData()
      await conn.beginTransaction()
      try {
        for (const [idx, b] of seed.branches.entries()) {
          await conn.execute(
            'INSERT INTO branches (id, name, category, date, start_time, end_time, description, accent, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [b.id, b.name, b.category, b.date, b.startTime, b.endTime, b.description, b.accent, idx + 1],
          )
        }
        for (const [idx, c] of seed.competitions.entries()) {
          await conn.execute(
            'INSERT INTO competitions (id, branch_id, name, category, division, fee, max_quota, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [c.id, c.branchId, c.name, c.category, c.division, c.fee, c.maxQuota, idx + 1],
          )
        }
        for (const p of seed.participants) {
          await conn.execute(
            'INSERT INTO participants (id, nama_lengkap, asal_sekolah, no_whatsapp, email, jenis_kelamin, kategori) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [p.id, p.namaLengkap, p.asalSekolah, p.noWhatsapp, p.email || '', p.jenisKelamin, p.kategori],
          )
        }
        for (const u of seed.users) {
          await conn.execute(
            'INSERT INTO users (id, email, role, participant_id, display_name, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
            [u.id, u.email, u.role, u.participantId, u.displayName, u.passwordHash],
          )
        }
        for (const r of seed.registrations) {
          await conn.execute(
            'INSERT INTO registrations (id, participant_id, competition_id, type, team_name, payment_status, registered_at, review_note, winner_rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [r.id, r.participantId, r.competitionId, r.type, r.teamName, r.paymentStatus, r.registeredAt, r.reviewNote, r.winnerRank],
          )
          for (const [idx, m] of r.members.entries()) {
            await conn.execute(
              'INSERT INTO team_members (id, registration_id, nama_lengkap, asal_sekolah, no_whatsapp, posisi, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [m.id, r.id, m.namaLengkap, m.asalSekolah, m.noWhatsapp, m.posisi, idx + 1],
            )
          }
          if (r.proof) {
            await conn.execute(
              `INSERT INTO documents (id, registration_id, kind, name, data_url, captured_at, source, size_bytes) VALUES (?, ?, 'bukti-transfer', ?, ?, ?, ?, ?)`,
              [r.proof.id, r.id, r.proof.name, r.proof.dataUrl, r.proof.capturedAt, r.proof.source, r.proof.sizeBytes],
            )
          }
        }
        for (const w of seed.winners) {
          await conn.execute('INSERT INTO winners (competition_id, winner_rank, registration_id, prize_amount) VALUES (?, ?, ?, ?)', [w.competitionId, w.rank, w.registrationId, w.prizeAmount ?? 0])
        }
        for (const n of seed.notifications) {
          await conn.execute(
            'INSERT INTO notifications (id, participant_id, type, title, body, competition_id, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [n.id, n.participantId, n.type, n.title, n.body, n.competitionId, n.createdAt, n.read ? 1 : 0],
          )
        }
        for (const a of [...seed.announcements].reverse()) {
          await conn.execute(
            'INSERT INTO announcements (id, title, body, tag, published_at) VALUES (?, ?, ?, ?, ?)',
            [a.id, a.title, a.body, a.tag, a.publishedAt],
          )
        }
        await conn.commit()
        console.log('Seed data inserted successfully.')
      } catch (err) {
        await conn.rollback()
        throw err
      }
    } else {
      console.log(`Database already has ${existingCount} branches — skipping seed (use --reset to re-seed).`)
    }

    const tables = ['branches', 'competitions', 'participants', 'users', 'registrations', 'team_members', 'documents', 'winners', 'notifications', 'announcements']
    console.log('\nRow counts in TiDB Cloud:')
    for (const table of tables) {
      const [rows] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``)
      console.log(`  - ${table}: ${rows[0].cnt}`)
    }
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error('TiDB setup failed:', err)
  process.exit(1)
})
