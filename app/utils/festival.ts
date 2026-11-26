import type { Accent, NotificationType, PaymentStatus } from '#shared/types/festival'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatDate(iso: string): string {
  if (!iso) return '-'
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const month = MONTHS[Number(parts[1]) - 1] ?? parts[1]
  return `${Number(parts[2])} ${month} ${parts[0]}`
}

export function formatStamp(stamp: string): string {
  if (!stamp) return '-'
  const [date, time] = stamp.split(' ')
  return time ? `${formatDate(date ?? '')}, ${time.replace('.', ':')}` : formatDate(date ?? '')
}

export function rupiah(value: number): string {
  return `Rp ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export function accentBg(accent: Accent): string {
  const map: Record<Accent, string> = {
    red: 'bg-merah text-paper',
    yellow: 'bg-kuning text-ink',
    blue: 'bg-biru text-paper',
    green: 'bg-hijau text-paper',
    pink: 'bg-pink text-ink',
  }
  return map[accent]
}

export function paymentTone(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    'Belum Bayar': 'bg-paper-deep text-ink',
    'Menunggu Verifikasi': 'bg-kuning text-ink',
    Terverifikasi: 'bg-biru text-paper',
    Lunas: 'bg-hijau text-paper',
    'Perlu Diperbaiki': 'bg-pink text-ink',
    Ditolak: 'bg-merah text-paper',
  }
  return map[status]
}

export function notificationTone(type: NotificationType): string {
  return type === 'Stand By Pembagian Trophy' ? 'bg-merah text-paper' : type === 'Pelunasan Pembayaran' ? 'bg-kuning text-ink' : 'bg-biru text-paper'
}
