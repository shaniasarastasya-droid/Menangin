export interface BankAccount {
  id: string
  bank: string
  short: string
  accountNumber: string
  accountHolder: string
  accent: string
  code: string
}

export interface EWalletAccount {
  id: string
  provider: string
  phoneNumber: string
  accountHolder: string
  accent: string
}

export const PAYMENT_ACCOUNT_HOLDER = 'Panitia Menangin Festival 2026'
export const PAYMENT_EWALLET_NUMBER = '0812-2026-9945'
export const PAYMENT_QRIS_NMID = 'ID1026099452026'

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bca',
    bank: 'Bank Central Asia (BCA)',
    short: 'BCA',
    accountNumber: '1280 9945 2026',
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-biru text-paper',
    code: '014',
  },
  {
    id: 'bri',
    bank: 'Bank Rakyat Indonesia (BRI)',
    short: 'BRI',
    accountNumber: '0024 0100 9945 506',
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-ink text-kuning',
    code: '002',
  },
  {
    id: 'bni',
    bank: 'Bank Negara Indonesia (BNI)',
    short: 'BNI',
    accountNumber: '1408 2026 9945',
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-merah text-paper',
    code: '009',
  },
  {
    id: 'mandiri',
    bank: 'Bank Mandiri',
    short: 'MANDIRI',
    accountNumber: '1370 0202 6994 5',
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-kuning text-ink',
    code: '008',
  },
  {
    id: 'bsi',
    bank: 'Bank Syariah Indonesia (BSI)',
    short: 'BSI',
    accountNumber: '7202 6994 51',
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-hijau text-paper',
    code: '451',
  },
  {
    id: 'cimb',
    bank: 'CIMB Niaga',
    short: 'CIMB',
    accountNumber: '8001 2026 9945',
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-pink text-ink',
    code: '022',
  },
]

export const EWALLET_ACCOUNTS: EWalletAccount[] = [
  {
    id: 'gopay',
    provider: 'GoPay',
    phoneNumber: PAYMENT_EWALLET_NUMBER,
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-hijau text-paper',
  },
  {
    id: 'ovo',
    provider: 'OVO',
    phoneNumber: PAYMENT_EWALLET_NUMBER,
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-biru text-paper',
  },
  {
    id: 'dana',
    provider: 'DANA',
    phoneNumber: PAYMENT_EWALLET_NUMBER,
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-biru text-paper',
  },
  {
    id: 'shopeepay',
    provider: 'ShopeePay',
    phoneNumber: PAYMENT_EWALLET_NUMBER,
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-merah text-paper',
  },
  {
    id: 'linkaja',
    provider: 'LinkAja',
    phoneNumber: PAYMENT_EWALLET_NUMBER,
    accountHolder: PAYMENT_ACCOUNT_HOLDER,
    accent: 'bg-merah text-paper',
  },
]

export function rawDigits(value: string): string {
  return value.replace(/[^\d]/g, '')
}
