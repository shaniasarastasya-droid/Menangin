import type { RowDataPacket } from 'mysql2/promise'
import { withTransaction } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'

interface UpsertWinnerBody {
  competitionId?: string
  rank?: 1 | 2 | 3
  registrationId?: string
  prizeAmount?: number
}

function formatRp(value: number): string {
  return `Rp ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UpsertWinnerBody>(event)
  const competitionId = String(body?.competitionId || '').trim()
  const rank = Number(body?.rank) as 1 | 2 | 3
  const registrationId = String(body?.registrationId || '').trim()
  const prizeAmount = Math.max(0, Math.min(1_000_000_000, Math.round(Number(body?.prizeAmount ?? 0) || 0)))

  if (!competitionId || !registrationId || ![1, 2, 3].includes(rank)) {
    return { ok: false, message: 'Data pemenang tidak valid.' }
  }

  try {
    await ensureDatabaseReady()
    return await withTransaction(async (conn) => {
      const [regRows] = await conn.execute<RowDataPacket[]>(
        'SELECT id FROM registrations WHERE id = ? AND competition_id = ? LIMIT 1',
        [registrationId, competitionId],
      )
      if (regRows.length === 0) return { ok: false, message: 'Peserta tidak terdaftar di cabang ini.' }

      await conn.execute('UPDATE registrations SET winner_rank = NULL WHERE competition_id = ? AND winner_rank = ?', [competitionId, rank])
      await conn.execute('DELETE FROM winners WHERE competition_id = ? AND winner_rank = ?', [competitionId, rank])
      await conn.execute(
        'INSERT INTO winners (competition_id, winner_rank, registration_id, prize_amount) VALUES (?, ?, ?, ?)',
        [competitionId, rank, registrationId, prizeAmount],
      )
      await conn.execute('UPDATE registrations SET winner_rank = ? WHERE id = ?', [rank, registrationId])

      const prizeText = prizeAmount > 0 ? ` dengan hadiah ${formatRp(prizeAmount)}` : ''
      return { ok: true, message: `Juara ${rank} cabang ini berhasil disimpan${prizeText}.`, prizeAmount }
    })
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const reg = fb.registrations.find(r => r.id === registrationId && r.competitionId === competitionId)
    if (!reg) return { ok: false, message: 'Peserta tidak terdaftar di cabang ini.' }
    for (const item of fb.registrations) {
      if (item.competitionId === competitionId && item.winnerRank === rank) item.winnerRank = null
    }
    fb.winners = fb.winners.filter(w => !(w.competitionId === competitionId && w.rank === rank))
    fb.winners.push({ competitionId, rank, registrationId, prizeAmount })
    reg.winnerRank = rank
    writeFallbackDb(fb)

    const prizeText = prizeAmount > 0 ? ` dengan hadiah ${formatRp(prizeAmount)}` : ''
    return { ok: true, message: `Juara ${rank} cabang ini berhasil disimpan${prizeText}.`, prizeAmount }
  }
})
