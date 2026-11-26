import type { RowDataPacket } from 'mysql2/promise'
import { withTransaction } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'

interface DeleteWinnerBody {
  competitionId?: string
  rank?: 1 | 2 | 3
}

export default defineEventHandler(async (event) => {
  const body = await readBody<DeleteWinnerBody>(event)
  const competitionId = String(body?.competitionId || '').trim()
  const rank = Number(body?.rank)

  if (!competitionId || ![1, 2, 3].includes(rank)) {
    return { ok: false, message: 'Data pemenang tidak valid.' }
  }

  try {
    await ensureDatabaseReady()
    return await withTransaction(async (conn) => {
      const [rows] = await conn.execute<RowDataPacket[]>(
        'SELECT registration_id FROM winners WHERE competition_id = ? AND winner_rank = ? LIMIT 1',
        [competitionId, rank],
      )
      if (rows.length > 0) {
        await conn.execute('UPDATE registrations SET winner_rank = NULL WHERE id = ?', [String(rows[0]!.registration_id)])
        await conn.execute('DELETE FROM winners WHERE competition_id = ? AND winner_rank = ?', [competitionId, rank])
      }
      return { ok: true, message: `Juara ${rank} dihapus.` }
    })
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const winner = fb.winners.find(w => w.competitionId === competitionId && w.rank === rank)
    if (winner) {
      const reg = fb.registrations.find(r => r.id === winner.registrationId)
      if (reg) reg.winnerRank = null
      fb.winners = fb.winners.filter(w => w !== winner)
      writeFallbackDb(fb)
    }
    return { ok: true, message: `Juara ${rank} dihapus.` }
  }
})
