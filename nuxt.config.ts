import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2026-11-24',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    tidbHost: '',
    tidbPort: 4000,
    tidbUser: '',
    tidbPassword: '',
    tidbDatabase: 'menangin',
    tidbSsl: true,
    tidbCaPath: '',
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Menangin! — Festival Tahunan Seni, Olahraga & Akademik',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
        },
      ],
      meta: [
        { name: 'description', content: 'Menangin! adalah festival tahunan Indonesia untuk seni, olahraga, dan akademik. Daftar lomba, unggah bukti transfer, dan pantau jadwal serta pemenang.' },
        { name: 'theme-color', content: '#E8442E' },
        { property: 'og:title', content: 'Menangin! Festival 2026' },
        { property: 'og:description', content: 'Satu festival, tiga dunia: seni, olahraga, dan akademik. Kuota terbatas 15 per lomba.' },
      ],
    },
  },
})
