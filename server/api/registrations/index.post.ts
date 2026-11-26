import { randomUUID } from 'node:crypto'
import type { RowDataPacket } from 'mysql2/promise'
import type { Registration, TeamMember } from '#shared/types/festival'
import { withTransaction } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady, stampNow } from '../../utils/schema'

interface RegisterBody {
  participantId?: string
  competitionId?: string
  type?: 'solo' | 'team'
  teamName?: string
  members?: TeamMember[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)
  const participantId = String(body?.participantId || '').trim()
  const competitionId = String(body?.competitionId || '').trim()
  const type = body?.type === 'team' ? 'team' : 'solo'
  const teamName = String(body?.teamName || '').trim()
  const members = Array.isArray(body?.members) ? body.members : []

  if (!participantId || !competitionId) {
    return { ok: false, message: 'Data peserta atau cabang lomba tidak lengkap.' }
  }
  if (type === 'team' && (!teamName || members.length < 5)) {
    return { ok: false, message: 'Tim harus memiliki nama dan minimal 5 anggota.' }
  }

  try {
    await ensureDatabaseReady()
    return await withTransaction(async (conn) => {
      const [compRows] = await conn.execute<RowDataPacket[]>(
        'SELECT id, name, max_quota FROM competitions WHERE id = ? LIMIT 1',
        [competitionId],
      )
      const comp = compRows[0]
      if (!comp) return { ok: false, message: 'Cabang lomba tidak ditemukan.' }

      const [dupRows] = await conn.execute<RowDataPacket[]>(
        'SELECT id FROM registrations WHERE participant_id = ? AND competition_id = ? LIMIT 1',
        [participantId, competitionId],
      )
      if (dupRows.length > 0) return { ok: false, message: 'Kamu sudah terdaftar di cabang ini.' }

      const [countRows] = await conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS filled FROM registrations WHERE competition_id = ? AND payment_status <> 'Ditolak'`,
        [competitionId],
      )
      const filled = Number(countRows[0]?.filled ?? 0)
      const maxQuota = Number(comp.max_quota ?? 15)
      if (filled >= maxQuota) return { ok: false, message: `Kuota ${String(comp.name)} sudah penuh (${maxQuota}/${maxQuota}).` }

      const regId = `r-${randomUUID().slice(0, 8)}`
      const registeredAt = stampNow()

      await conn.execute(
        `INSERT INTO registrations (id, participant_id, competition_id, type, team_name, payment_status, registered_at, review_note, winner_rank)
         VALUES (?, ?, ?, ?, ?, 'Belum Bayar', ?, '', NULL)`,
        [regId, participantId, competitionId, type, type === 'team' ? teamName : '', registeredAt],
      )

      const savedMembers: TeamMember[] = []
      if (type === 'team') {
        for (const [idx, member] of members.entries()) {
          const clean: TeamMember = {
            id: `m-${randomUUID().slice(0, 8)}`,
            namaLengkap: String(member.namaLengkap || '').trim(),
            asalSekolah: String(member.asalSekolah || '').trim(),
            noWhatsapp: String(member.noWhatsapp || '').trim(),
            posisi: String(member.posisi || '').trim(),
          }
          await conn.execute(
            `INSERT INTO team_members (id, registration_id, nama_lengkap, asal_sekolah, no_whatsapp, posisi, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [clean.id, regId, clean.namaLengkap, clean.asalSekolah, clean.noWhatsapp, clean.posisi, idx + 1],
          )
          savedMembers.push(clean)
        }
      }

      const registration: Registration = {
        id: regId,
        participantId,
        competitionId,
        type,
        teamName: type === 'team' ? teamName : '',
        members: savedMembers,
        paymentStatus: 'Belum Bayar',
        proof: null,
        supportingDocs: [],
        registeredAt,
        reviewNote: '',
        winnerRank: null,
      }

      return { ok: true, message: `Pendaftaran ${String(comp.name)} berhasil. Unggah bukti transfer sekarang!`, registrationId: regId, registration }
    })
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const comp = fb.competitions.find(c => c.id === competitionId)
    if (!comp) return { ok: false, message: 'Cabang lomba tidak ditemukan.' }
    if (fb.registrations.some(r => r.participantId === participantId && r.competitionId === competitionId)) {
      return { ok: false, message: 'Kamu sudah terdaftar di cabang ini.' }
    }
    const filled = fb.registrations.filter(r => r.competitionId === competitionId && r.paymentStatus !== 'Ditolak').length
    if (filled >= comp.maxQuota) return { ok: false, message: `Kuota ${comp.name} sudah penuh (${comp.maxQuota}/${comp.maxQuota}).` }

    const regId = `r-${randomUUID().slice(0, 8)}`
    const registration: Registration = {
      id: regId,
      participantId,
      competitionId,
      type,
      teamName: type === 'team' ? teamName : '',
      members: type === 'team'
        ? members.map(m => ({
            id: `m-${randomUUID().slice(0, 8)}`,
            namaLengkap: String(m.namaLengkap || '').trim(),
            asalSekolah: String(m.asalSekolah || '').trim(),
            noWhatsapp: String(m.noWhatsapp || '').trim(),
            posisi: String(m.posisi || '').trim(),
          }))
        : [],
      paymentStatus: 'Belum Bayar',
      proof: null,
      supportingDocs: [],
      registeredAt: stampNow(),
      reviewNote: '',
      winnerRank: null,
    }
    fb.registrations.push(registration)
    writeFallbackDb(fb)
    return { ok: true, message: `Pendaftaran ${comp.name} berhasil. Unggah bukti transfer sekarang!`, registrationId: regId, registration }
  }
})
