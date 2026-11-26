import { randomUUID } from 'node:crypto'
import type { RowDataPacket } from 'mysql2/promise'
import type { NotificationItem, NotificationType } from '#shared/types/festival'
import { withTransaction } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { dispatchExternalNotifications, type ExternalRecipient } from '../../utils/notification-channels'
import { ensureDatabaseReady, stampNow } from '../../utils/schema'
import { getSessionCookie } from '../../utils/session'

interface NotificationBody {
  type?: Exclude<NotificationType, 'Pengumuman'>
  competitionId?: string
  recipient?: 'branch' | 'winners' | 'all'
  message?: string
  channels?: {
    whatsapp?: boolean
    email?: boolean
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<NotificationBody>(event)
  const type = body?.type === 'Stand By Pembagian Trophy' ? 'Stand By Pembagian Trophy' : 'Pelunasan Pembayaran'
  const competitionId = String(body?.competitionId || '').trim()
  const recipient = body?.recipient === 'all' || body?.recipient === 'winners' ? body.recipient : 'branch'
  const message = String(body?.message || '').trim()
  const sendWhatsapp = body?.channels?.whatsapp !== false
  const sendEmail = body?.channels?.email !== false

  const defaultBody = type === 'Pelunasan Pembayaran'
    ? 'Segera lunasi pembayaran pendaftaran dan unggah bukti transfer melalui dashboard peserta.'
    : 'Untuk para pemenang: harap stand by di area podium sebelum pembagian trophy dimulai.'

  const finalBody = message || defaultBody
  let competitionName = ''
  let created: NotificationItem[] = []
  let externalRecipients: ExternalRecipient[] = []

  try {
    await ensureDatabaseReady()
    const dbOutcome = await withTransaction(async (conn) => {
      const participantIds: string[] = []
      let compName = ''

      if (competitionId) {
        const [compRows] = await conn.execute<RowDataPacket[]>('SELECT name FROM competitions WHERE id = ? LIMIT 1', [competitionId])
        compName = String(compRows[0]?.name || '')
      }

      if (recipient === 'all') {
        participantIds.push('all')
      } else if (competitionId) {
        if (recipient === 'winners') {
          const [rows] = await conn.execute<RowDataPacket[]>(
            `SELECT DISTINCT r.participant_id FROM winners w INNER JOIN registrations r ON r.id = w.registration_id WHERE w.competition_id = ?`,
            [competitionId],
          )
          for (const row of rows) participantIds.push(String(row.participant_id))
        } else {
          const [rows] = await conn.execute<RowDataPacket[]>(
            'SELECT DISTINCT participant_id FROM registrations WHERE competition_id = ?',
            [competitionId],
          )
          for (const row of rows) participantIds.push(String(row.participant_id))
        }
      }

      if (participantIds.length === 0) return { empty: true as const }

      const createdAt = stampNow()
      const inserted: NotificationItem[] = []
      for (const participantId of participantIds) {
        const item: NotificationItem = {
          id: `n-${randomUUID().slice(0, 8)}`,
          participantId,
          type,
          title: type,
          body: finalBody,
          competitionId: recipient === 'all' ? '' : competitionId,
          createdAt,
          read: false,
        }
        await conn.execute(
          `INSERT INTO notifications (id, participant_id, type, title, body, competition_id, created_at, is_read)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [item.id, item.participantId, item.type, item.title, item.body, item.competitionId, item.createdAt],
        )
        inserted.push(item)
      }

      let recipientRows: RowDataPacket[] = []
      if (recipient === 'all') {
        const [rows] = await conn.query<RowDataPacket[]>(
          `SELECT p.id, p.nama_lengkap, p.no_whatsapp, COALESCE(NULLIF(p.email, ''), u.email, '') AS email
           FROM participants p
           LEFT JOIN users u ON u.participant_id = p.id`,
        )
        recipientRows = rows
      } else {
        const placeholders = participantIds.map(() => '?').join(', ')
        const [rows] = await conn.execute<RowDataPacket[]>(
          `SELECT p.id, p.nama_lengkap, p.no_whatsapp, COALESCE(NULLIF(p.email, ''), u.email, '') AS email
           FROM participants p
           LEFT JOIN users u ON u.participant_id = p.id
           WHERE p.id IN (${placeholders})`,
          participantIds,
        )
        recipientRows = rows
      }

      const targets: ExternalRecipient[] = recipientRows.map(row => ({
        participantId: String(row.id),
        namaLengkap: String(row.nama_lengkap),
        noWhatsapp: String(row.no_whatsapp || ''),
        email: String(row.email || ''),
      }))

      return { empty: false as const, inserted, targets, compName }
    })

    if (dbOutcome.empty) return { ok: false, message: 'Belum ada penerima yang cocok.' }
    created = dbOutcome.inserted
    externalRecipients = dbOutcome.targets
    competitionName = dbOutcome.compName
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    competitionName = fb.competitions.find(c => c.id === competitionId)?.name ?? ''
    const participantIds: string[] = []

    if (recipient === 'all') {
      participantIds.push('all')
    } else if (competitionId) {
      if (recipient === 'winners') {
        for (const w of fb.winners.filter(item => item.competitionId === competitionId)) {
          const reg = fb.registrations.find(r => r.id === w.registrationId)
          if (reg && !participantIds.includes(reg.participantId)) participantIds.push(reg.participantId)
        }
      } else {
        for (const reg of fb.registrations.filter(r => r.competitionId === competitionId)) {
          if (!participantIds.includes(reg.participantId)) participantIds.push(reg.participantId)
        }
      }
    }

    if (participantIds.length === 0) return { ok: false, message: 'Belum ada penerima yang cocok.' }

    const createdAt = stampNow()
    created = participantIds.map(participantId => ({
      id: `n-${randomUUID().slice(0, 8)}`,
      participantId,
      type,
      title: type,
      body: finalBody,
      competitionId: recipient === 'all' ? '' : competitionId,
      createdAt,
      read: false,
    }))
    fb.notifications.push(...created)
    writeFallbackDb(fb)

    const matchedParticipants = recipient === 'all'
      ? fb.participants
      : fb.participants.filter(p => participantIds.includes(p.id))

    const emailByParticipant = new Map(
      fb.users.filter(u => u.participantId).map(u => [u.participantId!, u.email]),
    )

    externalRecipients = matchedParticipants.map(p => ({
      participantId: p.id,
      namaLengkap: p.namaLengkap,
      noWhatsapp: p.noWhatsapp || '',
      email: p.email || emailByParticipant.get(p.id) || '',
    }))
  }

  const session = getSessionCookie(event)
  const { deliveries, integration } = await dispatchExternalNotifications(
    externalRecipients,
    {
      type,
      title: type,
      body: finalBody,
      competitionName,
      senderName: session.displayName || 'Panitia Menangin!',
      senderEmail: session.email || '',
    },
    { whatsapp: sendWhatsapp, email: sendEmail },
  )

  const waSent = deliveries.filter(d => d.whatsapp?.status === 'sent').length
  const emailSent = deliveries.filter(d => d.email?.status === 'sent').length
  const summaryParts = [`${deliveries.length} penerima di inbox`]
  if (sendWhatsapp) {
    summaryParts.push(waSent > 0 ? `${waSent} WA terkirim` : 'tautan WA siap')
  }
  if (sendEmail) {
    summaryParts.push(emailSent > 0 ? `${emailSent} email terkirim` : 'tautan email siap')
  }

  return {
    ok: true,
    message: `Notifikasi diproses (${summaryParts.join(' · ')}).`,
    notifications: created,
    deliveries,
    integration,
  }
})
