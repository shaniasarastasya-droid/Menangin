import { isDbConnectionError, readFallbackDb } from '../../utils/fallback-store'
import { loadFestivalData } from '../../utils/schema'
import { getSessionCookie } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = getSessionCookie(event)
  try {
    const data = await loadFestivalData()
    return {
      ok: true as const,
      storage: 'tidb' as const,
      version: 1 as const,
      ...data,
      session,
    }
  } catch (error) {
    if (isDbConnectionError(error)) {
      const fb = readFallbackDb()
      return {
        ok: true as const,
        storage: 'fallback' as const,
        version: 1 as const,
        branches: fb.branches,
        competitions: fb.competitions,
        participants: fb.participants,
        registrations: fb.registrations,
        winners: fb.winners,
        notifications: fb.notifications,
        announcements: fb.announcements,
        settings: fb.settings ?? { certificateClaimEnabled: false },
        session,
      }
    }
    throw error
  }
})
