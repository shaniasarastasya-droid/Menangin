import { getPublicChannelConfig, saveChannelConfig, type WhatsappProvider } from '../../utils/notification-channels'
import { getSessionCookie } from '../../utils/session'

interface ChannelConfigBody {
  whatsappProvider?: WhatsappProvider
  whatsappApiUrl?: string
  whatsappApiToken?: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPass?: string
  smtpFrom?: string
}

export default defineEventHandler(async (event) => {
  const session = getSessionCookie(event)
  if (session.role !== 'panitia') {
    return { ok: false, message: 'Hanya panitia yang dapat mengubah pengaturan saluran.' }
  }

  const body = await readBody<ChannelConfigBody>(event)
  const provider = body?.whatsappProvider
  const validProvider: WhatsappProvider =
    provider === 'meta' || provider === 'wablas' || provider === 'webhook' ? provider : 'fonnte'

  saveChannelConfig({
    whatsappProvider: validProvider,
    whatsappApiUrl: body?.whatsappApiUrl,
    whatsappApiToken: body?.whatsappApiToken,
    smtpHost: body?.smtpHost,
    smtpPort: body?.smtpPort,
    smtpSecure: body?.smtpSecure,
    smtpUser: body?.smtpUser,
    smtpPass: body?.smtpPass,
    smtpFrom: body?.smtpFrom,
  })

  const config = getPublicChannelConfig()
  return {
    ok: true,
    message: config.whatsappConfigured
      ? 'Pengaturan tersimpan! Kirim WhatsApp otomatis (tanpa login WA) sudah aktif.'
      : 'Pengaturan saluran notifikasi berhasil disimpan.',
    config,
  }
})
