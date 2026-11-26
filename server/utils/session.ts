import type { H3Event } from 'h3'
import type { Role, Session } from '#shared/types/festival'

const SESSION_COOKIE = 'menangin_session'

export const EMPTY_SESSION: Session = {
  role: null,
  email: '',
  participantId: null,
  displayName: '',
}

export function getSessionCookie(event: H3Event): Session {
  const raw = getCookie(event, SESSION_COOKIE)
  if (!raw) return { ...EMPTY_SESSION }
  try {
    const parsed = JSON.parse(raw) as Partial<Session>
    if (parsed.role === 'peserta' || parsed.role === 'panitia') {
      return {
        role: parsed.role as Role,
        email: String(parsed.email || ''),
        participantId: parsed.participantId ? String(parsed.participantId) : null,
        displayName: parsed.displayName ? String(parsed.displayName) : '',
      }
    }
  } catch {
    // Ignore malformed cookie
  }
  return { ...EMPTY_SESSION }
}

export function setSessionCookie(event: H3Event, session: Session): void {
  setCookie(event, SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}
