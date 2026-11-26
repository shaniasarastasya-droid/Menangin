import { randomUUID } from 'node:crypto'
import type { Announcement, NotificationItem } from '#shared/types/festival'
import { withTransaction } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady, stampNow } from '../../utils/schema'

interface AnnouncementBody {
  title?: string
  body?: string
  tag?: string
}

export default defineEventHandler(async (event) => {
  const input = await readBody<AnnouncementBody>(event)
  const title = String(input?.title || '').trim()
  const body = String(input?.body || '').trim()
  const tag = String(input?.tag || '').trim() || 'INFO'

  if (!title || !body) {
    return { ok: false, message: 'Judul dan isi pengumuman wajib diisi.' }
  }

  const publishedAt = stampNow()
  const announcement: Announcement = { id: `a-${randomUUID().slice(0, 8)}`, title, body, tag, publishedAt }
  const notification: NotificationItem = {
    id: `n-${randomUUID().slice(0, 8)}`,
    participantId: 'all',
    type: 'Pengumuman',
    title,
    body,
    competitionId: '',
    createdAt: publishedAt,
    read: false,
  }

  try {
    await ensureDatabaseReady()
    await withTransaction(async (conn) => {
      await conn.execute(
        'INSERT INTO announcements (id, title, body, tag, published_at) VALUES (?, ?, ?, ?, ?)',
        [announcement.id, announcement.title, announcement.body, announcement.tag, announcement.publishedAt],
      )
      await conn.execute(
        `INSERT INTO notifications (id, participant_id, type, title, body, competition_id, created_at, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [notification.id, notification.participantId, notification.type, notification.title, notification.body, notification.competitionId, notification.createdAt],
      )
    })
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    fb.announcements.unshift(announcement)
    fb.notifications.push(notification)
    writeFallbackDb(fb)
  }

  return { ok: true, message: 'Pengumuman diterbitkan dan dikirim ke semua peserta.', announcement, notification }
})
