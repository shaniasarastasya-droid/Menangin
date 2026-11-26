import { randomUUID } from 'node:crypto'
import type { RowDataPacket } from 'mysql2/promise'
import type { DocumentProof, ProofSource } from '#shared/types/festival'
import { withTransaction } from '../../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../../utils/fallback-store'
import { ensureDatabaseReady, stampNow } from '../../../utils/schema'

interface ProofBody {
  dataUrl?: string
  name?: string
  source?: ProofSource
  kind?: 'bukti-transfer' | 'pendukung'
}

export default defineEventHandler(async (event) => {
  const registrationId = getRouterParam(event, 'id')
  const body = await readBody<ProofBody>(event)
  const dataUrl = String(body?.dataUrl || '')
  const name = String(body?.name || 'dokumen.png').trim()
  const source: ProofSource = body?.source === 'camera' ? 'camera' : 'upload'
  const kind = body?.kind === 'pendukung' ? 'pendukung' : 'bukti-transfer'

  if (!registrationId || !dataUrl) {
    return { ok: false, message: 'Data dokumen tidak lengkap.' }
  }

  const proof: DocumentProof = {
    id: `doc-${randomUUID().slice(0, 8)}`,
    name,
    dataUrl,
    capturedAt: stampNow(),
    source,
    sizeBytes: dataUrl.length,
  }

  try {
    await ensureDatabaseReady()
    return await withTransaction(async (conn) => {
      const [regRows] = await conn.execute<RowDataPacket[]>('SELECT id FROM registrations WHERE id = ? LIMIT 1', [registrationId])
      if (regRows.length === 0) return { ok: false, message: 'Pendaftaran tidak ditemukan.' }

      if (kind === 'pendukung') {
        const [docCountRows] = await conn.execute<RowDataPacket[]>(
          `SELECT COUNT(*) AS cnt FROM documents WHERE registration_id = ? AND kind = 'pendukung'`,
          [registrationId],
        )
        if (Number(docCountRows[0]?.cnt ?? 0) >= 2) return { ok: false, message: 'Maksimal 2 dokumen pendukung.' }
      } else {
        await conn.execute(`DELETE FROM documents WHERE registration_id = ? AND kind = 'bukti-transfer'`, [registrationId])
        await conn.execute(`UPDATE registrations SET payment_status = 'Menunggu Verifikasi', review_note = '' WHERE id = ?`, [registrationId])
      }

      await conn.execute(
        `INSERT INTO documents (id, registration_id, kind, name, data_url, captured_at, source, size_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [proof.id, registrationId, kind, proof.name, proof.dataUrl, proof.capturedAt, proof.source, proof.sizeBytes],
      )

      return {
        ok: true,
        message: kind === 'pendukung' ? 'Dokumen pendukung tersimpan.' : 'Bukti transfer terkirim. Menunggu verifikasi panitia.',
        proof,
      }
    })
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const reg = fb.registrations.find(r => r.id === registrationId)
    if (!reg) return { ok: false, message: 'Pendaftaran tidak ditemukan.' }
    if (kind === 'pendukung') {
      if (reg.supportingDocs.length >= 2) return { ok: false, message: 'Maksimal 2 dokumen pendukung.' }
      reg.supportingDocs.push(proof)
    } else {
      reg.proof = proof
      reg.paymentStatus = 'Menunggu Verifikasi'
      reg.reviewNote = ''
    }
    writeFallbackDb(fb)
    return {
      ok: true,
      message: kind === 'pendukung' ? 'Dokumen pendukung tersimpan.' : 'Bukti transfer terkirim. Menunggu verifikasi panitia.',
      proof,
    }
  }
})
