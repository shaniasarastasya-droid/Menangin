import type { RowDataPacket } from 'mysql2/promise'
import type { Role, Session } from '#shared/types/festival'
import { getDbPool } from '../../utils/db'
import { isDbConnectionError, readFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'
import { verifyPassword } from '../../utils/seed-data'
import { setSessionCookie } from '../../utils/session'

interface LoginBody {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  if (!email || !password) {
    return { ok: false, message: 'Email dan kata sandi wajib diisi.' }
  }

  let userRecord: { email: string; role: string; participantId: string | null; displayName: string; passwordHash: string } | null = null

  try {
    await ensureDatabaseReady()
    const pool = getDbPool()
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, email, role, participant_id, display_name, password_hash FROM users WHERE LOWER(email) = ? LIMIT 1',
      [email],
    )
    const row = rows[0]
    if (row) {
      userRecord = {
        email: String(row.email),
        role: String(row.role),
        participantId: row.participant_id ? String(row.participant_id) : null,
        displayName: row.display_name ? String(row.display_name) : '',
        passwordHash: String(row.password_hash),
      }
    }
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const found = fb.users.find(u => u.email.toLowerCase() === email)
    if (found) {
      userRecord = {
        email: found.email,
        role: found.role,
        participantId: found.participantId,
        displayName: found.displayName,
        passwordHash: found.passwordHash,
      }
    }
  }

  if (!userRecord) {
    return { ok: false, message: 'Email belum terdaftar. Silakan daftar akun baru terlebih dahulu.' }
  }

  if (userRecord.role !== 'peserta' && userRecord.role !== 'panitia') {
    return { ok: false, message: 'Peran akun tidak valid.' }
  }

  if (!verifyPassword(password, userRecord.passwordHash)) {
    return { ok: false, message: 'Kata sandi salah. Periksa kembali kata sandi Anda.' }
  }

  const detectedRole: Role = userRecord.role
  const session: Session = {
    role: detectedRole,
    email: userRecord.email,
    participantId: userRecord.participantId,
    displayName: userRecord.displayName,
  }
  setSessionCookie(event, session)

  return {
    ok: true,
    message: `Selamat datang di Menangin!, ${session.displayName || (detectedRole === 'peserta' ? 'Peserta' : 'Panitia')}!`,
    session,
  }
})
