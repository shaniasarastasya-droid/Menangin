import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise'
import type {
  Accent,
  Announcement,
  Category,
  Competition,
  Division,
  DocumentProof,
  FestivalBranch,
  MAX_QUOTA,
  NotificationItem,
  NotificationType,
  ParticipantProfile,
  PaymentStatus,
  ProofSource,
  Registration,
  TeamMember,
  WinnerRecord,
} from '#shared/types/festival'
import { getDbPool, withTransaction } from './db'
import { createInitialSeedData } from './seed-data'

export const SCHEMA_STATEMENTS: string[] = [
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

let initPromise: Promise<void> | null = null

export async function ensureSchema(pool: Pool): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await pool.query(statement)
  }
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS email VARCHAR(160) NOT NULL DEFAULT ''`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(160) NOT NULL DEFAULT ''`)
  await pool.query(`ALTER TABLE winners ADD COLUMN IF NOT EXISTS prize_amount INT NOT NULL DEFAULT 0`)
  await pool.query(`UPDATE users SET display_name = 'Ayu Kartika Putri' WHERE id = 'u-peserta' AND display_name = ''`)
  await pool.query(`UPDATE users SET display_name = 'Komite Menangin!' WHERE id = 'u-panitia' AND display_name = ''`)
  await pool.query(`UPDATE participants p INNER JOIN users u ON u.participant_id = p.id SET p.email = u.email WHERE p.email = ''`)
}

export async function insertSeedData(conn: PoolConnection): Promise<void> {
  const seed = createInitialSeedData()

  for (const [index, b] of seed.branches.entries()) {
    await conn.execute(
      `INSERT INTO branches (id, name, category, date, start_time, end_time, description, accent, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.id, b.name, b.category, b.date, b.startTime, b.endTime, b.description, b.accent, index + 1],
    )
  }

  for (const [index, c] of seed.competitions.entries()) {
    await conn.execute(
      `INSERT INTO competitions (id, branch_id, name, category, division, fee, max_quota, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.branchId, c.name, c.category, c.division, c.fee, c.maxQuota, index + 1],
    )
  }

  for (const p of seed.participants) {
    await conn.execute(
      `INSERT INTO participants (id, nama_lengkap, asal_sekolah, no_whatsapp, email, jenis_kelamin, kategori)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.namaLengkap, p.asalSekolah, p.noWhatsapp, p.email || '', p.jenisKelamin, p.kategori],
    )
  }

  for (const u of seed.users) {
    await conn.execute(
      `INSERT INTO users (id, email, role, participant_id, display_name, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [u.id, u.email, u.role, u.participantId, u.displayName, u.passwordHash],
    )
  }

  for (const r of seed.registrations) {
    await conn.execute(
      `INSERT INTO registrations (id, participant_id, competition_id, type, team_name, payment_status, registered_at, review_note, winner_rank)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.participantId, r.competitionId, r.type, r.teamName, r.paymentStatus, r.registeredAt, r.reviewNote, r.winnerRank],
    )

    for (const [idx, m] of r.members.entries()) {
      await conn.execute(
        `INSERT INTO team_members (id, registration_id, nama_lengkap, asal_sekolah, no_whatsapp, posisi, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [m.id, r.id, m.namaLengkap, m.asalSekolah, m.noWhatsapp, m.posisi, idx + 1],
      )
    }

    if (r.proof) {
      await conn.execute(
        `INSERT INTO documents (id, registration_id, kind, name, data_url, captured_at, source, size_bytes)
         VALUES (?, ?, 'bukti-transfer', ?, ?, ?, ?, ?)`,
        [r.proof.id, r.id, r.proof.name, r.proof.dataUrl, r.proof.capturedAt, r.proof.source, r.proof.sizeBytes],
      )
    }

    for (const doc of r.supportingDocs) {
      await conn.execute(
        `INSERT INTO documents (id, registration_id, kind, name, data_url, captured_at, source, size_bytes)
         VALUES (?, ?, 'pendukung', ?, ?, ?, ?, ?)`,
        [doc.id, r.id, doc.name, doc.dataUrl, doc.capturedAt, doc.source, doc.sizeBytes],
      )
    }
  }

  for (const w of seed.winners) {
    await conn.execute(
      `INSERT INTO winners (competition_id, winner_rank, registration_id, prize_amount) VALUES (?, ?, ?, ?)`,
      [w.competitionId, w.rank, w.registrationId, w.prizeAmount ?? 0],
    )
  }

  for (const n of seed.notifications) {
    await conn.execute(
      `INSERT INTO notifications (id, participant_id, type, title, body, competition_id, created_at, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [n.id, n.participantId, n.type, n.title, n.body, n.competitionId, n.createdAt, n.read ? 1 : 0],
    )
  }

  // Insert oldest first so ORDER BY created_seq DESC keeps newest at index 0
  for (const a of [...seed.announcements].reverse()) {
    await conn.execute(
      `INSERT INTO announcements (id, title, body, tag, published_at)
       VALUES (?, ?, ?, ?, ?)`,
      [a.id, a.title, a.body, a.tag, a.publishedAt],
    )
  }
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const pool = getDbPool()
      await ensureSchema(pool)
      const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM branches')
      const total = Number(rows[0]?.total ?? 0)
      if (total === 0) {
        await withTransaction(async (conn) => {
          const [check] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM branches')
          if (Number(check[0]?.total ?? 0) === 0) {
            await insertSeedData(conn)
          }
        })
      }
    })().catch((error) => {
      initPromise = null
      throw error
    })
  }
  return initPromise
}

export interface FestivalDataPayload {
  branches: FestivalBranch[]
  competitions: Competition[]
  participants: ParticipantProfile[]
  registrations: Registration[]
  winners: WinnerRecord[]
  notifications: NotificationItem[]
  announcements: Announcement[]
  settings: { certificateClaimEnabled: boolean }
}

export async function loadFestivalData(): Promise<FestivalDataPayload> {
  await ensureDatabaseReady()
  const pool = getDbPool()

  const [
    [branchRows],
    [competitionRows],
    [participantRows],
    [registrationRows],
    [memberRows],
    [docRows],
    [winnerRows],
    [notificationRows],
    [announcementRows],
    [settingRows],
  ] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT id, name, category, date, start_time, end_time, description, accent FROM branches ORDER BY sort_order ASC, date ASC'),
    pool.query<RowDataPacket[]>('SELECT id, branch_id, name, category, division, fee, max_quota FROM competitions ORDER BY sort_order ASC, id ASC'),
    pool.query<RowDataPacket[]>(`SELECT p.id, p.nama_lengkap, p.asal_sekolah, p.no_whatsapp, COALESCE(NULLIF(p.email, ''), u.email, '') AS email, p.jenis_kelamin, p.kategori FROM participants p LEFT JOIN users u ON u.participant_id = p.id ORDER BY p.id ASC`),
    pool.query<RowDataPacket[]>('SELECT id, participant_id, competition_id, type, team_name, payment_status, registered_at, review_note, winner_rank FROM registrations ORDER BY created_seq ASC'),
    pool.query<RowDataPacket[]>('SELECT id, registration_id, nama_lengkap, asal_sekolah, no_whatsapp, posisi FROM team_members ORDER BY sort_order ASC, id ASC'),
    pool.query<RowDataPacket[]>('SELECT id, registration_id, kind, name, data_url, captured_at, source, size_bytes FROM documents ORDER BY created_seq ASC'),
    pool.query<RowDataPacket[]>('SELECT competition_id, winner_rank, registration_id, prize_amount FROM winners ORDER BY competition_id ASC, winner_rank ASC'),
    pool.query<RowDataPacket[]>('SELECT id, participant_id, type, title, body, competition_id, created_at, is_read FROM notifications ORDER BY created_seq ASC'),
    pool.query<RowDataPacket[]>('SELECT id, title, body, tag, published_at FROM announcements ORDER BY created_seq DESC'),
    pool.query<RowDataPacket[]>('SELECT setting_key, setting_value FROM festival_settings'),
  ])

  const membersByReg = new Map<string, TeamMember[]>()
  for (const row of memberRows) {
    const regId = String(row.registration_id)
    const list = membersByReg.get(regId) ?? []
    list.push({
      id: String(row.id),
      namaLengkap: String(row.nama_lengkap),
      asalSekolah: String(row.asal_sekolah),
      noWhatsapp: String(row.no_whatsapp),
      posisi: String(row.posisi),
    })
    membersByReg.set(regId, list)
  }

  const proofByReg = new Map<string, DocumentProof>()
  const supportingByReg = new Map<string, DocumentProof[]>()
  for (const row of docRows) {
    const regId = String(row.registration_id)
    const doc: DocumentProof = {
      id: String(row.id),
      name: String(row.name),
      dataUrl: String(row.data_url),
      capturedAt: String(row.captured_at),
      source: String(row.source) as ProofSource,
      sizeBytes: Number(row.size_bytes),
    }
    if (String(row.kind) === 'bukti-transfer') {
      proofByReg.set(regId, doc)
    } else {
      const list = supportingByReg.get(regId) ?? []
      list.push(doc)
      supportingByReg.set(regId, list)
    }
  }

  const branches: FestivalBranch[] = branchRows.map(row => ({
    id: String(row.id),
    name: String(row.name),
    category: String(row.category) as Category,
    date: String(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    description: String(row.description),
    accent: String(row.accent) as Accent,
  }))

  const competitions: Competition[] = competitionRows.map(row => ({
    id: String(row.id),
    branchId: String(row.branch_id),
    name: String(row.name),
    category: String(row.category) as Category,
    division: String(row.division) as Division,
    fee: Number(row.fee),
    maxQuota: Number(row.max_quota) as typeof MAX_QUOTA,
  }))

  const participants: ParticipantProfile[] = participantRows.map(row => ({
    id: String(row.id),
    namaLengkap: String(row.nama_lengkap),
    asalSekolah: String(row.asal_sekolah),
    noWhatsapp: String(row.no_whatsapp),
    email: String(row.email || ''),
    jenisKelamin: String(row.jenis_kelamin) as 'Putra' | 'Putri',
    kategori: String(row.kategori) as 'Siswa' | 'Mahasiswa' | 'Umum',
  }))

  const registrations: Registration[] = registrationRows.map(row => {
    const id = String(row.id)
    return {
      id,
      participantId: String(row.participant_id),
      competitionId: String(row.competition_id),
      type: String(row.type) as 'solo' | 'team',
      teamName: String(row.team_name),
      members: membersByReg.get(id) ?? [],
      paymentStatus: String(row.payment_status) as PaymentStatus,
      proof: proofByReg.get(id) ?? null,
      supportingDocs: supportingByReg.get(id) ?? [],
      registeredAt: String(row.registered_at),
      reviewNote: String(row.review_note),
      winnerRank: row.winner_rank === null ? null : (Number(row.winner_rank) as 1 | 2 | 3),
    }
  })

  const winners: WinnerRecord[] = winnerRows.map(row => ({
    competitionId: String(row.competition_id),
    rank: Number(row.winner_rank) as 1 | 2 | 3,
    registrationId: String(row.registration_id),
    prizeAmount: Number(row.prize_amount ?? 0),
  }))

  const notifications: NotificationItem[] = notificationRows.map(row => ({
    id: String(row.id),
    participantId: String(row.participant_id),
    type: String(row.type) as NotificationType,
    title: String(row.title),
    body: String(row.body),
    competitionId: String(row.competition_id),
    createdAt: String(row.created_at),
    read: Boolean(row.is_read),
  }))

  const announcements: Announcement[] = announcementRows.map(row => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    tag: String(row.tag),
    publishedAt: String(row.published_at),
  }))

  const settingsMap = new Map(settingRows.map(row => [String(row.setting_key), String(row.setting_value)]))

  return {
    branches,
    competitions,
    participants,
    registrations,
    winners,
    notifications,
    announcements,
    settings: {
      certificateClaimEnabled: settingsMap.get('certificate_claim_enabled') === 'true',
    },
  }
}

export function stampNow(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}.${pad(now.getMinutes())}`
}
