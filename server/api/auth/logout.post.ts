import { clearSessionCookie, EMPTY_SESSION } from '../../utils/session'

export default defineEventHandler((event) => {
  clearSessionCookie(event)
  return { ok: true, session: { ...EMPTY_SESSION } }
})
