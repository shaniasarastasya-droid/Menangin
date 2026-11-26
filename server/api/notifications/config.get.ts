import { getPublicChannelConfig } from '../../utils/notification-channels'
import { getSessionCookie } from '../../utils/session'

export default defineEventHandler((event) => {
  const session = getSessionCookie(event)
  if (session.role !== 'panitia') {
    throw createError({ statusCode: 403, statusMessage: 'Hanya panitia yang dapat mengakses pengaturan saluran.' })
  }
  return getPublicChannelConfig()
})
