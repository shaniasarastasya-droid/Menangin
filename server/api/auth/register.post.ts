import { randomUUID } from 'node:crypto'
import type { RowDataPacket } from 'mysql2/promise'
import type { ParticipantProfile, Role, Session } from '#shared/types/festival'
import { withTransaction } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'
import { hashPassword } from '../../utils/seed-data'
import { setSessionCookie } from '../../utils/session'

interface RegisterAccountBody {
  role?: Role
  email?: string
  password?: string
  namaLengkap?: string
  asalSekolah?: string
  noWhatsapp?: string
  jenisKelamin?: 'Putra' | 'Putri'
  kategori?: 'Siswa' | 'Mahasiswa' | 'Umum'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterAccountBody>(event)
  if (body?.role && body.role !== 'peserta') {
    return { ok: false, message: 'Pendaftaran akun baru hanya tersedia khusus untuk Peserta.' }
  }
  const role: Role = 'peserta'
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')
  const namaLengkap = String(body?.namaLengkap || '').trim()
  const asalSekolah = String(body?.asalSekolah || '').trim()
  const noWhatsapp = String(body?.noWhatsapp || '').trim()
  const jenisKelamin: 'Putra' | 'Putri' = body?.jenisKelamin === 'Putra' ? 'Putra' : 'Putri'
  const kategori: 'Siswa' | 'Mahasiswa' | 'Umum' =
    body?.kategori === 'Mahasiswa' || body?.kategori === 'Umum' ? body.kategori : 'Siswa'

  if (!namaLengkap) {
    return { ok: false, message: 'Nama lengkap wajib diisi.' }
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: 'Format email tidak valid.' }
  }
  if (password.length < 6) {
    return { ok: false, message: 'Kata sandi minimal 6 karakter.' }
  }
  if (!asalSekolah || !noWhatsapp) {
    return { ok: false, message: 'Asal sekolah/instansi dan nomor WhatsApp wajib diisi untuk peserta.' }
  }

  try {
    await ensureDatabaseReady()
    const result = await withTransaction(async (conn) => {
      const [existing] = await conn.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
        [email],
      )
      if (existing.length > 0) {
        return { ok: false as const, message: 'Email sudah terdaftar. Silakan masuk dengan akun tersebut.' }
      }

      let participantId: string | null = null
      let participant: ParticipantProfile | null = null

      if (role === 'peserta') {
        participantId = `p-${randomUUID().slice(0, 8)}`
        participant = { id: participantId, namaLengkap, asalSekolah, noWhatsapp, email, jenisKelamin, kategori }
        await conn.execute(
          `INSERT INTO participants (id, nama_lengkap, asal_sekolah, no_whatsapp, email, jenis_kelamin, kategori)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [participant.id, participant.namaLengkap, participant.asalSekolah, participant.noWhatsapp, email, participant.jenisKelamin, participant.kategori],
        )
      }

      const userId = `u-${randomUUID().slice(0, 8)}`
      await conn.execute(
        `INSERT INTO users (id, email, role, participant_id, display_name, password_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, role, participantId, namaLengkap, hashPassword(password)],
      )

      const session: Session = { role, email, participantId, displayName: namaLengkap }
      return {
        ok: true as const,
        message: `Akun ${role === 'peserta' ? 'Peserta' : 'Panitia'} berhasil didaftarkan! Selamat datang, ${namaLengkap}.`,
        session,
        participant,
      }
    })

    if (result.ok) setSessionCookie(event, result.session)
    return result
  } catch (error) {
    if (!isDbConnectionError(error)) throw error

    const fb = readFallbackDb()
    if (fb.users.some(u => u.email.toLowerCase() === email)) {
      return { ok: false, message: 'Email sudah terdaftar. Silakan masuk dengan akun tersebut.' }
    }

    let participantId: string | null = null
    let participant: ParticipantProfile | null = null
    if (role === 'peserta') {
      participantId = `p-${randomUUID().slice(0, 8)}`
      participant = { id: participantId, namaLengkap, asalSekolah, noWhatsapp, email, jenisKelamin, kategori }
      fb.participants.push(participant)
    }

    fb.users.push({
      id: `u-${randomUUID().slice(0, 8)}`,
      email,
      role,
      participantId,
      displayName: namaLengkap,
      passwordHash: hashPassword(password),
    })
    writeFallbackDb(fb)

    const session: Session = { role, email, participantId, displayName: namaLengkap }
    setSessionCookie(event, session)
    return {
      ok: true,
      message: `Akun ${role === 'peserta' ? 'Peserta' : 'Panitia'} berhasil didaftarkan! Selamat datang, ${namaLengkap}.`,
      session,
      participant,
    }
  }
})
