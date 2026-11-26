export interface CertificateParams {
  kind: 'peserta' | 'pemenang'
  participantName: string
  competitionName?: string
  teamName?: string
  rank?: 1 | 2 | 3
  prizeAmount?: number
  serialCode: string
  dateRange?: string
}

function escapeXml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatRupiahPlain(amount: number): string {
  return `Rp ${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

function buildScallopCircles(): string {
  const circles: string[] = []
  const r = 34
  // Top & Bottom edges
  for (let x = 148; x <= 1052; x += 50) {
    circles.push(`<circle cx="${x}" cy="92" r="${r}" fill="#ffffff"/>`)
    circles.push(`<circle cx="${x}" cy="756" r="${r}" fill="#ffffff"/>`)
  }
  // Left & Right edges
  for (let y = 140; y <= 708; y += 50) {
    circles.push(`<circle cx="118" cy="${y}" r="${r}" fill="#ffffff"/>`)
    circles.push(`<circle cx="1082" cy="${y}" r="${r}" fill="#ffffff"/>`)
  }
  return circles.join('')
}

/**
 * Generates an Indonesian certificate SVG inspired by the playful scalloped teal-frame reference design.
 */
export function buildCertificateSvg(params: CertificateParams): string {
  const isWinner = params.kind === 'pemenang' && params.rank !== undefined
  const name = escapeXml(params.participantName.trim() || 'Peserta Menangin!')
  const nameFontSize = name.length > 28 ? 34 : name.length > 20 ? 40 : 46
  const compName = escapeXml(params.competitionName?.trim() || '')
  const teamLabel = params.teamName?.trim() ? ` (Tim: ${escapeXml(params.teamName.trim())})` : ''
  const dateText = escapeXml(params.dateRange || '5–16 Desember 2026')
  const serial = escapeXml(params.serialCode)

  const titleLine1 = 'SERTIFIKAT'
  const titleLine2 = isWinner ? 'PENGHARGAAN PEMENANG' : 'PARTISIPASI PESERTA'

  const rankWord = params.rank === 1 ? 'JUARA 1' : params.rank === 2 ? 'JUARA 2' : 'JUARA 3'
  const rankBadgeColor = params.rank === 1 ? '#F4B41A' : params.rank === 2 ? '#5A9BD5' : '#E07A5F'

  const bodyLine1 = isWinner
    ? `atas prestasi gemilang meraih ${rankWord} pada cabang lomba ${compName}${teamLabel}`
    : compName
      ? `atas partisipasi aktifnya sebagai Peserta cabang lomba ${compName}${teamLabel}`
      : 'atas partisipasi aktifnya sebagai Peserta dalam rangkaian kegiatan'

  const bodyLine2 = isWinner && params.prizeAmount && params.prizeAmount > 0
    ? `Menangin! Festival 2026 (${dateText}) · Hadiah Pembinaan ${formatRupiahPlain(params.prizeAmount)}`
    : `Menangin! Festival 2026 yang diselenggarakan pada tanggal ${dateText}.`

  const scallops = buildScallopCircles()

  const winnerRibbon = isWinner
    ? `
      <g transform="translate(600, 344)">
        <rect x="-126" y="-20" width="252" height="38" rx="19" fill="${rankBadgeColor}" stroke="#0D4E6B" stroke-width="3"/>
        <text x="0" y="6" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="20" font-weight="900" fill="#1C1A17" letter-spacing="2">★ ${rankWord} ★</text>
      </g>
    `
    : ''

  const givenToY = isWinner ? 404 : 374
  const nameY = isWinner ? 470 : 452
  const dividerY = isWinner ? 488 : 472
  const body1Y = isWinner ? 536 : 526
  const body2Y = isWinner ? 568 : 560

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="848" viewBox="0 0 1200 848">
  <defs>
    <linearGradient id="bgTeal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B4F6C"/>
      <stop offset="55%" stop-color="#0D5C7B"/>
      <stop offset="100%" stop-color="#083F58"/>
    </linearGradient>
    <linearGradient id="bushGreen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#35A863"/>
      <stop offset="100%" stop-color="#176C43"/>
    </linearGradient>
    <linearGradient id="skateGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F28482"/>
      <stop offset="50%" stop-color="#F6BD60"/>
      <stop offset="100%" stop-color="#3D5A80"/>
    </linearGradient>
    <linearGradient id="guitarGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E56B6F"/>
      <stop offset="100%" stop-color="#9B3D5E"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#042536" flood-opacity="0.32"/>
    </filter>
  </defs>

  <!-- Deep Teal Background Frame -->
  <rect width="1200" height="848" fill="url(#bgTeal)"/>

  <!-- Subtle background botanical dots -->
  <circle cx="95" cy="410" r="110" fill="#13688A" opacity="0.35"/>
  <circle cx="1110" cy="430" r="120" fill="#13688A" opacity="0.35"/>

  <!-- Top Center Green Foliage Bush -->
  <g transform="translate(660, 48)">
    <circle cx="-85" cy="24" r="46" fill="#14633E"/>
    <circle cx="-35" cy="8" r="56" fill="url(#bushGreen)"/>
    <circle cx="30" cy="4" r="60" fill="#238850"/>
    <circle cx="90" cy="20" r="48" fill="url(#bushGreen)"/>
    <circle cx="135" cy="34" r="36" fill="#14633E"/>
    <circle cx="-18" cy="-4" r="5" fill="#FFD166"/>
    <circle cx="42" cy="-12" r="4" fill="#FFD166"/>
    <circle cx="78" cy="10" r="5" fill="#F6BD60"/>
  </g>

  <!-- Left Side Bush -->
  <g transform="translate(38, 290)">
    <circle cx="0" cy="-35" r="54" fill="#176C43"/>
    <circle cx="36" cy="5" r="58" fill="url(#bushGreen)"/>
    <circle cx="12" cy="52" r="46" fill="#14633E"/>
    <circle cx="24" cy="-16" r="4.5" fill="#FFD166"/>
    <circle cx="48" cy="22" r="4" fill="#FFD166"/>
  </g>

  <!-- Bottom Center Bush -->
  <g transform="translate(495, 810)">
    <circle cx="-90" cy="12" r="52" fill="#14633E"/>
    <circle cx="-35" cy="-14" r="64" fill="url(#bushGreen)"/>
    <circle cx="34" cy="-22" r="68" fill="#238850"/>
    <circle cx="96" cy="-4" r="58" fill="url(#bushGreen)"/>
    <circle cx="145" cy="18" r="42" fill="#14633E"/>
    <circle cx="-15" cy="-28" r="5" fill="#FFD166"/>
    <circle cx="54" cy="-34" r="5" fill="#FFD166"/>
    <circle cx="100" cy="-12" r="4" fill="#F28482"/>
  </g>

  <!-- Right Bottom Green Foliage -->
  <g transform="translate(1155, 750)">
    <circle cx="0" cy="0" r="74" fill="#238850"/>
    <circle cx="-38" cy="48" r="58" fill="#14633E"/>
    <circle cx="-10" cy="-24" r="4.5" fill="#FFD166"/>
  </g>

  <!-- White Scalloped Inner Certificate Card -->
  <g filter="url(#softShadow)">
    <rect x="118" y="92" width="964" height="664" rx="22" fill="#ffffff"/>
    ${scallops}
  </g>

  <!-- Top-Left Sport Bat & Ball Illustration -->
  <g transform="translate(10, 8)">
    <g transform="rotate(-42 92 78)">
      <rect x="-12" y="64" width="248" height="22" rx="11" fill="#F4A59A"/>
      <rect x="-12" y="64" width="76" height="22" rx="6" fill="#B83B5E"/>
      <rect x="64" y="64" width="12" height="22" fill="#FFD166"/>
    </g>
    <circle cx="52" cy="42" r="34" fill="#FFF7EB" stroke="#E0C9A6" stroke-width="3"/>
    <path d="M31 20 C42 34, 42 50, 31 64" fill="none" stroke="#E8442E" stroke-width="3" stroke-dasharray="4 3"/>
    <path d="M73 20 C62 34, 62 50, 73 64" fill="none" stroke="#E8442E" stroke-width="3" stroke-dasharray="4 3"/>
  </g>

  <!-- Top-Center-Left Skateboard Illustration -->
  <g transform="translate(365, 58) rotate(-10)">
    <ellipse cx="0" cy="0" rx="126" ry="20" fill="url(#skateGrad)" stroke="#1D3557" stroke-width="3"/>
    <path d="M-95 -4 Q-30 -16 30 4 T100 -2" fill="none" stroke="#1D3557" stroke-width="5" opacity="0.75"/>
    <circle cx="-62" cy="22" r="10" fill="#E76F51" stroke="#1D3557" stroke-width="2.5"/>
    <circle cx="62" cy="22" r="10" fill="#E76F51" stroke="#1D3557" stroke-width="2.5"/>
  </g>

  <!-- Top-Right Soccer Ball & Badminton Racket -->
  <g transform="translate(918, 84)">
    <circle cx="0" cy="0" r="56" fill="#F8EFE2" stroke="#D9C8B2" stroke-width="3"/>
    <polygon points="0,-24 22,-8 14,18 -14,18 -22,-8" fill="#355C8C"/>
    <polygon points="0,-54 18,-42 12,-28 -12,-28 -18,-42" fill="#E89E6C"/>
    <polygon points="48,-18 36,6 22,-6 28,-24" fill="#E89E6C"/>
    <polygon points="-48,-18 -36,6 -22,-6 -28,-24" fill="#E89E6C"/>
    <polygon points="34,42 14,36 16,22 34,18" fill="#355C8C"/>
    <polygon points="-34,42 -14,36 -16,22 -34,18" fill="#355C8C"/>
  </g>
  <g transform="translate(1135, 92) rotate(36)">
    <ellipse cx="0" cy="-24" rx="44" ry="56" fill="#F6BD60" opacity="0.22" stroke="#F4A261" stroke-width="7"/>
    <line x1="-30" y1="-24" x2="30" y2="-24" stroke="#FFF6E5" stroke-width="1.5" opacity="0.7"/>
    <line x1="0" y1="-70" x2="0" y2="24" stroke="#FFF6E5" stroke-width="1.5" opacity="0.7"/>
    <rect x="-5" y="30" width="10" height="72" rx="4" fill="#9B3D5E"/>
  </g>

  <!-- Left-Side Joyful Festival Figures & Butterfly -->
  <g transform="translate(62, 430)">
    <circle cx="38" cy="-42" r="22" fill="#F29E74"/>
    <path d="M18 -50 Q38 -74 58 -46 Q46 -56 18 -50 Z" fill="#1D3557"/>
    <path d="M-20 40 C-8 -16, 48 -18, 72 24 L42 82 L-18 76 Z" fill="#2E5AA8"/>
    <rect x="6" y="12" width="38" height="44" rx="8" fill="#FFF6E5"/>
    <text x="25" y="42" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="18" fill="#2E5AA8">M!</text>
    <!-- Little Blue Butterfly -->
    <g transform="translate(128, 12) rotate(-15)">
      <ellipse cx="-8" cy="-4" rx="10" ry="7" fill="#5FA8D3"/>
      <ellipse cx="8" cy="-4" rx="10" ry="7" fill="#5FA8D3"/>
      <ellipse cx="-6" cy="6" rx="7" ry="5" fill="#2E5AA8"/>
      <ellipse cx="6" cy="6" rx="7" ry="5" fill="#2E5AA8"/>
      <line x1="0" y1="-10" x2="0" y2="12" stroke="#1C1A17" stroke-width="2"/>
    </g>
  </g>

  <!-- Bottom-Left Cheering Figure & Acoustic Guitar -->
  <g transform="translate(115, 735)">
    <circle cx="-12" cy="-58" r="24" fill="#F4A261"/>
    <path d="M-36 -66 Q-12 -96 14 -68 Z" fill="#E8442E"/>
    <path d="M-54 32 C-46 -32, 22 -32, 34 32 Z" fill="#2E5AA8"/>
    <path d="M18 -18 L52 -82" stroke="#F4A261" stroke-width="18" stroke-linecap="round"/>
    <circle cx="58" cy="-94" r="22" fill="#8D5B4C"/>
  </g>
  <g transform="translate(310, 770) rotate(-38)">
    <ellipse cx="-26" cy="0" rx="44" ry="34" fill="url(#guitarGrad)" stroke="#5E2340" stroke-width="3"/>
    <ellipse cx="20" cy="0" rx="34" ry="26" fill="url(#guitarGrad)" stroke="#5E2340" stroke-width="3"/>
    <circle cx="14" cy="0" r="12" fill="#261C2C" stroke="#FFD166" stroke-width="2.5"/>
    <rect x="46" y="-7" width="112" height="14" rx="4" fill="#2E5AA8"/>
    <rect x="150" y="-11" width="26" height="22" rx="4" fill="#1D3557"/>
  </g>

  <!-- Bottom-Right Celebrating Winners / Athletes -->
  <g transform="translate(1070, 560)">
    <circle cx="18" cy="-28" r="24" fill="#F29E74"/>
    <path d="M-2 -44 Q24 -68 48 -32 Q28 -44 -2 -44 Z" fill="#7F2943"/>
    <path d="M-16 14 L52 10 L42 114 L-12 114 Z" fill="#FFF6E5" stroke="#D9C5A7" stroke-width="2"/>
    <path d="M-10 22 L-56 -38" stroke="#F29E74" stroke-width="18" stroke-linecap="round"/>
    <path d="M46 22 L92 -24" stroke="#F29E74" stroke-width="18" stroke-linecap="round"/>
    <path d="M-6 114 L-26 218 L8 218 L20 132 L40 218 L72 218 L46 114 Z" fill="#1F9D55"/>
    <text x="18" y="66" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="18" fill="#E8442E">26</text>
  </g>
  <g transform="translate(880, 748)">
    <circle cx="0" cy="-64" r="21" fill="#F4A261"/>
    <path d="M-38 28 C-30 -36, 30 -36, 38 28 Z" fill="#1D5D9B"/>
    <path d="M-24 -12 L-82 -48" stroke="#F4A261" stroke-width="15" stroke-linecap="round"/>
    <circle cx="66" cy="-48" r="19" fill="#E09F7D"/>
    <path d="M34 36 C42 -22, 92 -22, 98 36 Z" fill="#E8442E"/>
  </g>

  <!-- Right-Side Celebrating Girl Accent -->
  <g transform="translate(1145, 310)">
    <circle cx="-8" cy="-26" r="22" fill="#E07A5F"/>
    <path d="M-30 -36 Q-6 -64 20 -34 Q0 -44 -30 -36 Z" fill="#5E2340"/>
    <path d="M-32 4 L20 0 L24 66 L-28 66 Z" fill="#FFF3B0"/>
    <path d="M-10 30 C-10 20, 6 20, 6 30 C6 40, -2 46, -2 46 C-2 46, -10 40, -10 30 Z" fill="#E8442E"/>
  </g>

  <!-- ==================== CENTER CERTIFICATE CONTENT (BAHASA INDONESIA) ==================== -->

  <!-- Top Medal / Ribbon Emblem -->
  <g transform="translate(600, 140)">
    <polygon points="-14,-22 -4,-22 0,-2 -10,-2" fill="${isWinner ? '#D98218' : '#0D4E6B'}"/>
    <polygon points="14,-22 4,-22 0,-2 10,-2" fill="${isWinner ? '#F4B41A' : '#186B8C'}"/>
    <polygon points="0,-10 5,3 19,3 8,11 12,24 0,16 -12,24 -8,11 -19,3 -5,3" fill="${isWinner ? '#F4B41A' : '#0D4E6B'}" stroke="#0D4E6B" stroke-width="1.5"/>
  </g>
  <text x="600" y="190" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#1C1A17" letter-spacing="0.5">Menangin! Festival 2026</text>

  <!-- Main Playful Green Title (matching reference) -->
  <text x="600" y="268" text-anchor="middle" font-family="'Arial Black', 'Trebuchet MS', Arial, sans-serif" font-size="78" font-weight="900" fill="#1F9D55" letter-spacing="2">${titleLine1}</text>
  <text x="600" y="314" text-anchor="middle" font-family="'Arial Black', 'Trebuchet MS', Arial, sans-serif" font-size="32" font-weight="900" fill="#1F9D55" letter-spacing="1.5">${titleLine2}</text>

  ${winnerRibbon}

  <!-- Presented To Label -->
  <text x="600" y="${givenToY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="800" fill="#1C1A17" letter-spacing="1.2">SERTIFIKAT INI DIBERIKAN KEPADA</text>

  <!-- Recipient Full Name + Horizontal Rule -->
  <text x="600" y="${nameY}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${nameFontSize}" font-weight="700" fill="#0D4E6B">${name}</text>
  <line x1="330" y1="${dividerY}" x2="870" y2="${dividerY}" stroke="#D6D3CE" stroke-width="2.5"/>

  <!-- Achievement / Participation Description -->
  <text x="600" y="${body1Y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#2A2723">${bodyLine1}</text>
  <text x="600" y="${body2Y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#4B463F">${bodyLine2}</text>

  <!-- Bottom Director Signature Block -->
  <text x="600" y="650" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#1C1A17" letter-spacing="1">KOMITE MENANGIN!</text>
  <text x="600" y="678" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" fill="#4B463F">Ketua Panitia Festival</text>
  <text x="600" y="716" text-anchor="middle" font-family="monospace" font-size="13" fill="#8C857B">No. Sertifikat: ${serial}</text>
</svg>`
}

export function certificateSvgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function downloadCertificateSvg(svg: string, filename: string): void {
  if (!import.meta.client) return
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadCertificatePng(svg: string, filename: string): Promise<boolean> {
  if (!import.meta.client) return false
  return await new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1130
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(false)
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false)
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename.endsWith('.png') ? filename : `${filename}.png`
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        resolve(true)
      }, 'image/png')
    }
    img.onerror = () => resolve(false)
    img.src = certificateSvgToDataUrl(svg)
  })
}

export function printCertificate(svg: string, title: string): void {
  if (!import.meta.client) return
  const win = window.open('', '_blank', 'width=1100,height=800')
  if (!win) return
  win.document.write(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title)}</title>
  <style>
    @page { size: landscape; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    svg { width: 100%; max-width: 1120px; height: auto; display: block; }
  </style>
</head>
<body>
  ${svg}
  <script>window.onload = () => { setTimeout(() => { window.print(); }, 250); };</script>
</body>
</html>`)
  win.document.close()
}
