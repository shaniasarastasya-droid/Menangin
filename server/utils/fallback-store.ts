import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type {
  Announcement,
  Competition,
  FestivalBranch,
  NotificationItem,
  ParticipantProfile,
  Registration,
  WinnerRecord,
} from '#shared/types/festival'
import { createInitialSeedData, type SeedUser } from './seed-data'

export interface FallbackDbData {
  branches: FestivalBranch[]
  competitions: Competition[]
  participants: ParticipantProfile[]
  users: SeedUser[]
  registrations: Registration[]
  winners: WinnerRecord[]
  notifications: NotificationItem[]
  announcements: Announcement[]
  settings: { certificateClaimEnabled: boolean }
}

const FALLBACK_PATH = resolve(process.cwd(), '.data', 'festival-fallback.json')

let memoryStore: FallbackDbData | null = null
let lastMtimeMs = 0

export function readFallbackDb(): FallbackDbData {
  try {
    if (existsSync(FALLBACK_PATH)) {
      const mtimeMs = statSync(FALLBACK_PATH).mtimeMs
      if (memoryStore && mtimeMs === lastMtimeMs) {
        return memoryStore
      }
      const parsed = JSON.parse(readFileSync(FALLBACK_PATH, 'utf8')) as FallbackDbData
      if (Array.isArray(parsed.branches) && Array.isArray(parsed.users)) {
        const emailByParticipant = new Map(
          parsed.users.filter(u => u.participantId).map(u => [u.participantId!, u.email]),
        )
        for (const p of parsed.participants) {
          if (!p.email) {
            const linked = emailByParticipant.get(p.id)
            if (linked) p.email = linked
          }
        }
        for (const w of parsed.winners ?? []) {
          if (typeof w.prizeAmount !== 'number') {
            w.prizeAmount = 0
          }
        }
        if (!parsed.settings || typeof parsed.settings.certificateClaimEnabled !== 'boolean') {
          parsed.settings = { certificateClaimEnabled: false }
        }
        memoryStore = parsed
        lastMtimeMs = mtimeMs
        return memoryStore
      }
    }
  } catch {
    // Fall through to seed data
  }
  if (memoryStore) return memoryStore
  memoryStore = createInitialSeedData()
  writeFallbackDb(memoryStore)
  return memoryStore
}

export function writeFallbackDb(data: FallbackDbData): void {
  memoryStore = data
  try {
    mkdirSync(dirname(FALLBACK_PATH), { recursive: true })
    writeFileSync(FALLBACK_PATH, JSON.stringify(data, null, 2), 'utf8')
    lastMtimeMs = statSync(FALLBACK_PATH).mtimeMs
  } catch {
    // Keep in memory if filesystem write fails
  }
}

export function isDbConnectionError(error: unknown): boolean {
  const code = (error as { code?: string })?.code
  return (
    code === 'ER_ACCESS_DENIED_ERROR'
    || code === 'ENOTFOUND'
    || code === 'ECONNREFUSED'
    || code === 'ETIMEDOUT'
    || code === 'ECONNRESET'
    || code === 'PROTOCOL_CONNECTION_LOST'
    || (error instanceof Error && error.message.includes('TiDB Cloud belum dikonfigurasi'))
  )
}
