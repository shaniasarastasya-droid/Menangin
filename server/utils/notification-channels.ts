import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import nodemailer from 'nodemailer'
import type { RecipientDeliveryReport } from '#shared/types/festival'

export interface ExternalRecipient {
  participantId: string
  namaLengkap: string
  noWhatsapp: string
  email: string
}

export interface DispatchPayload {
  type: string
  title: string
  body: string
  competitionName: string
  senderName?: string
  senderEmail?: string
}

export interface DispatchChannels {
  whatsapp: boolean
  email: boolean
}

export type WhatsappProvider = 'fonnte' | 'meta' | 'wablas' | 'webhook'

export interface StoredChannelConfig {
  whatsappProvider: WhatsappProvider
  whatsappApiUrl: string
  whatsappApiToken: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPass: string
  smtpFrom: string
}

const CONFIG_PATH = resolve(process.cwd(), '.data', 'channel-config.json')

const DEFAULT_PROVIDER_URLS: Record<WhatsappProvider, string> = {
  fonnte: 'https://api.fonnte.com/send',
  wablas: 'https://pati.wablas.com/api/send-message',
  meta: '',
  webhook: '',
}

function readDotEnvVars(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env')
  const fileVars: Record<string, string> = {}
  if (existsSync(envPath)) {
    try {
      for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
        fileVars[key] = val
      }
    } catch {
      // Ignore read errors
    }
  }
  return fileVars
}

function readSavedConfigFile(): Partial<StoredChannelConfig> {
  if (!existsSync(CONFIG_PATH)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as Partial<StoredChannelConfig>
  } catch {
    return {}
  }
}

export function getEffectiveChannelConfig(): StoredChannelConfig {
  const fileEnv = readDotEnvVars()
  const saved = readSavedConfigFile()

  const rawProvider = String(
    saved.whatsappProvider || fileEnv.WHATSAPP_PROVIDER || process.env.WHATSAPP_PROVIDER || 'fonnte',
  ).toLowerCase()
  const whatsappProvider: WhatsappProvider =
    rawProvider === 'meta' || rawProvider === 'wablas' || rawProvider === 'webhook' ? rawProvider : 'fonnte'

  const rawWaUrl = String(
    saved.whatsappApiUrl || fileEnv.WHATSAPP_API_URL || process.env.WHATSAPP_API_URL || '',
  ).trim()
  const whatsappApiUrl = rawWaUrl || DEFAULT_PROVIDER_URLS[whatsappProvider]
  const whatsappApiToken = String(
    saved.whatsappApiToken || fileEnv.WHATSAPP_API_TOKEN || process.env.WHATSAPP_API_TOKEN || '',
  ).trim()

  const smtpHost = String(saved.smtpHost || fileEnv.SMTP_HOST || process.env.SMTP_HOST || '').trim()
  const smtpPort = Number(saved.smtpPort || fileEnv.SMTP_PORT || process.env.SMTP_PORT || 587)
  const smtpSecure = saved.smtpSecure !== undefined
    ? Boolean(saved.smtpSecure)
    : (fileEnv.SMTP_SECURE || process.env.SMTP_SECURE) === 'true' || smtpPort === 465
  const smtpUser = String(saved.smtpUser || fileEnv.SMTP_USER || process.env.SMTP_USER || '').trim()
  const smtpPass = String(saved.smtpPass || fileEnv.SMTP_PASS || process.env.SMTP_PASS || '').trim()
  const smtpFrom = String(saved.smtpFrom || fileEnv.SMTP_FROM || process.env.SMTP_FROM || '').trim()

  return {
    whatsappProvider,
    whatsappApiUrl,
    whatsappApiToken,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    smtpFrom,
  }
}

export function saveChannelConfig(patch: Partial<StoredChannelConfig>): StoredChannelConfig {
  const current = readSavedConfigFile()
  const next: Partial<StoredChannelConfig> = { ...current }

  if (patch.whatsappProvider) next.whatsappProvider = patch.whatsappProvider
  if (patch.whatsappApiUrl !== undefined) next.whatsappApiUrl = patch.whatsappApiUrl.trim()
  if (patch.whatsappApiToken !== undefined && patch.whatsappApiToken.trim() !== '') {
    next.whatsappApiToken = patch.whatsappApiToken.trim()
  }
  if (patch.smtpHost !== undefined) next.smtpHost = patch.smtpHost.trim()
  if (patch.smtpPort !== undefined) next.smtpPort = Number(patch.smtpPort) || 587
  if (patch.smtpSecure !== undefined) next.smtpSecure = Boolean(patch.smtpSecure)
  if (patch.smtpUser !== undefined) next.smtpUser = patch.smtpUser.trim()
  if (patch.smtpPass !== undefined && patch.smtpPass.trim() !== '') {
    next.smtpPass = patch.smtpPass.trim()
  }
  if (patch.smtpFrom !== undefined) next.smtpFrom = patch.smtpFrom.trim()

  mkdirSync(dirname(CONFIG_PATH), { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8')
  return getEffectiveChannelConfig()
}

export function getPublicChannelConfig() {
  const cfg = getEffectiveChannelConfig()
  return {
    whatsappProvider: cfg.whatsappProvider,
    whatsappApiUrl: cfg.whatsappApiUrl,
    hasWhatsappToken: Boolean(cfg.whatsappApiToken),
    whatsappConfigured: Boolean(cfg.whatsappApiUrl && cfg.whatsappApiToken),
    smtpHost: cfg.smtpHost,
    smtpPort: cfg.smtpPort,
    smtpSecure: cfg.smtpSecure,
    smtpUser: cfg.smtpUser,
    smtpFrom: cfg.smtpFrom,
    hasSmtpPass: Boolean(cfg.smtpPass),
    smtpConfigured: Boolean(cfg.smtpHost && cfg.smtpUser && cfg.smtpPass),
  }
}

export function normalizeWhatsappNumber(raw: string): string {
  const digits = String(raw || '').replace(/[^\d]/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsappNumber(phone)
  if (!normalized) return ''
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`
}

export function buildWhatsappWebUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsappNumber(phone)
  if (!normalized) return ''
  return `https://web.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`
}

export function buildWhatsappAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsappNumber(phone)
  if (!normalized) return ''
  return `whatsapp://send?phone=${normalized}&text=${encodeURIComponent(message)}`
}

export function buildMailtoUrl(email: string, subject: string, body: string): string {
  const clean = String(email || '').trim()
  if (!clean) return ''
  return `mailto:${encodeURIComponent(clean)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildGmailComposeUrl(email: string, subject: string, body: string, senderEmail?: string): string {
  const clean = String(email || '').trim()
  if (!clean) return ''
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: clean,
    su: subject,
    body,
  })
  const cleanSender = String(senderEmail || '').trim()
  if (cleanSender) {
    params.set('authuser', cleanSender)
  }
  return `https://mail.google.com/mail/?${params.toString()}`
}

export function getChannelIntegrationStatus() {
  const cfg = getEffectiveChannelConfig()
  return {
    smtpConfigured: Boolean(cfg.smtpHost && cfg.smtpUser && cfg.smtpPass),
    whatsappConfigured: Boolean(cfg.whatsappApiUrl && cfg.whatsappApiToken),
    whatsappProvider: cfg.whatsappProvider,
  }
}

function formatMessageText(recipient: ExternalRecipient, payload: DispatchPayload): string {
  const compLine = payload.competitionName ? `Cabang Lomba: ${payload.competitionName}\n` : ''
  const senderLabel = payload.senderName && payload.senderName !== 'Panitia Menangin!'
    ? `— ${payload.senderName} (Panitia Menangin! Festival 2026)`
    : '— Panitia Menangin! Festival 2026'
  return [
    `Halo ${recipient.namaLengkap},`,
    '',
    `[${payload.title}]`,
    compLine ? compLine.trim() : null,
    payload.body,
    '',
    senderLabel,
  ]
    .filter(line => line !== null)
    .join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatEmailHtml(recipient: ExternalRecipient, payload: DispatchPayload): string {
  const compBadge = payload.competitionName
    ? `<p style="margin:0 0 12px;font-size:13px;color:#6d6357;"><strong>Cabang Lomba:</strong> ${escapeHtml(payload.competitionName)}</p>`
    : ''
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff6e5;border:3px solid #1c1a17;padding:24px;color:#1c1a17;">
      <div style="background:#ffc93c;border:2px solid #1c1a17;padding:10px 14px;font-weight:900;text-transform:uppercase;letter-spacing:1px;font-size:12px;">
        Menangin! Festival 2026 · ${escapeHtml(payload.type)}
      </div>
      <h2 style="margin:18px 0 8px;font-size:22px;">${escapeHtml(payload.title)}</h2>
      <p style="margin:0 0 12px;font-size:14px;">Halo <strong>${escapeHtml(recipient.namaLengkap)}</strong>,</p>
      ${compBadge}
      <div style="background:#ffffff;border:2px solid #1c1a17;padding:14px;font-size:14px;line-height:1.6;white-space:pre-line;">
        ${escapeHtml(payload.body)}
      </div>
      <p style="margin:18px 0 0;font-size:12px;color:#6d6357;">Panitia Menangin! Festival 2026</p>
    </div>
  `.trim()
}

async function sendViaWhatsappApi(
  cfg: StoredChannelConfig,
  target: string,
  text: string,
  recipient: ExternalRecipient,
  payload: DispatchPayload,
): Promise<{ ok: boolean; detail: string }> {
  const provider = cfg.whatsappProvider
  const url = cfg.whatsappApiUrl
  const token = cfg.whatsappApiToken

  try {
    let headers: Record<string, string> = { 'content-type': 'application/json' }
    let body: Record<string, unknown>

    if (provider === 'meta') {
      headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` }
      body = {
        messaging_product: 'whatsapp',
        to: target,
        type: 'text',
        text: { body: text },
      }
    } else if (provider === 'fonnte') {
      headers = { 'content-type': 'application/json', authorization: token }
      body = { target, message: text, countryCode: '62' }
    } else if (provider === 'wablas') {
      headers = { 'content-type': 'application/json', authorization: token }
      body = { phone: target, message: text }
    } else {
      headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` }
      body = {
        to: target,
        name: recipient.namaLengkap,
        title: payload.title,
        competition: payload.competitionName,
        message: text,
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const resText = await res.text().catch(() => '')
    if (!res.ok) {
      return { ok: false, detail: `WhatsApp API HTTP ${res.status}${resText ? `: ${resText.slice(0, 80)}` : ''}` }
    }
    if (provider === 'fonnte' && resText) {
      try {
        const parsed = JSON.parse(resText) as { status?: boolean; reason?: string }
        if (parsed.status === false) {
          return { ok: false, detail: parsed.reason || 'Fonnte menolak pengiriman pesan.' }
        }
      } catch {
        // Ignore non-JSON response
      }
    }
    return { ok: true, detail: `Terkirim otomatis via WhatsApp (${provider})` }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : 'Gagal menghubungi WhatsApp API' }
  }
}

export async function dispatchExternalNotifications(
  recipients: ExternalRecipient[],
  payload: DispatchPayload,
  channels: DispatchChannels,
): Promise<{ deliveries: RecipientDeliveryReport[]; integration: ReturnType<typeof getChannelIntegrationStatus> }> {
  const cfg = getEffectiveChannelConfig()
  const integration = getChannelIntegrationStatus()

  const transporter = channels.email && integration.smtpConfigured
    ? nodemailer.createTransport({
        host: cfg.smtpHost,
        port: cfg.smtpPort,
        secure: cfg.smtpSecure,
        auth: {
          user: cfg.smtpUser,
          pass: cfg.smtpPass,
        },
      })
    : null

  const deliveries: RecipientDeliveryReport[] = []

  for (const recipient of recipients) {
    const text = formatMessageText(recipient, payload)
    const subject = `[Menangin! 2026] ${payload.title}${payload.competitionName ? ` — ${payload.competitionName}` : ''}`
    const report: RecipientDeliveryReport = {
      participantId: recipient.participantId,
      namaLengkap: recipient.namaLengkap,
    }

    if (channels.whatsapp) {
      const normalized = normalizeWhatsappNumber(recipient.noWhatsapp)
      if (!normalized) {
        report.whatsapp = { status: 'missing', target: '', url: '', detail: 'No. WhatsApp peserta kosong' }
      } else {
        const waUrl = buildWhatsappUrl(normalized, text)
        const waWebUrl = buildWhatsappWebUrl(normalized, text)
        const waAppUrl = buildWhatsappAppUrl(normalized, text)
        if (integration.whatsappConfigured) {
          const sent = await sendViaWhatsappApi(cfg, normalized, text, recipient, payload)
          report.whatsapp = {
            status: sent.ok ? 'sent' : 'failed',
            target: normalized,
            url: waUrl,
            webUrl: waWebUrl,
            appUrl: waAppUrl,
            messageText: text,
            detail: sent.detail,
          }
        } else {
          report.whatsapp = {
            status: 'ready',
            target: normalized,
            url: waUrl,
            webUrl: waWebUrl,
            appUrl: waAppUrl,
            messageText: text,
            detail: 'Belum pakai Gateway WA (butuh login WA / WA Desktop)',
          }
        }
      }
    }

    if (channels.email) {
      const cleanEmail = String(recipient.email || '').trim()
      const senderEmail = String(payload.senderEmail || cfg.smtpUser || '').trim()
      const senderDisplay = payload.senderName ? `${payload.senderName} — Panitia Menangin!` : 'Panitia Menangin! Festival'
      if (!cleanEmail) {
        report.email = { status: 'missing', target: '', url: '', detail: 'Email peserta belum terdaftar' }
      } else {
        const mailtoUrl = buildMailtoUrl(cleanEmail, subject, text)
        const gmailUrl = buildGmailComposeUrl(cleanEmail, subject, text, senderEmail)
        if (transporter) {
          try {
            const fromAddress = cfg.smtpFrom || (cfg.smtpUser ? `"${senderDisplay}" <${cfg.smtpUser}>` : senderEmail)
            await transporter.sendMail({
              from: fromAddress,
              replyTo: senderEmail || undefined,
              to: cleanEmail,
              subject,
              text,
              html: formatEmailHtml(recipient, payload),
            })
            report.email = {
              status: 'sent',
              target: cleanEmail,
              url: mailtoUrl,
              gmailUrl,
              senderEmail: cfg.smtpUser || senderEmail,
              detail: `Terkirim otomatis dari ${cfg.smtpUser || senderEmail}`,
            }
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Gagal mengirim email SMTP'
            report.email = {
              status: 'failed',
              target: cleanEmail,
              url: mailtoUrl,
              gmailUrl,
              senderEmail,
              detail: msg.slice(0, 100),
            }
          }
        } else {
          report.email = {
            status: 'ready',
            target: cleanEmail,
            url: mailtoUrl,
            gmailUrl,
            senderEmail,
            detail: senderEmail ? `Siap dikirim dari ${senderEmail}` : 'Siap dikirim via Email',
          }
        }
      }
    }

    deliveries.push(report)
  }

  return { deliveries, integration }
}
