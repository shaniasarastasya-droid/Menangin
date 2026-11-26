export default defineNuxtPlugin(async (nuxtApp) => {
  const store = useFestivalStore()

  if (import.meta.server) {
    await store.hydrate()
    return
  }

  nuxtApp.hook('app:mounted', () => {
    if (!store.hydrated.value) {
      void store.hydrate()
    }
  })
})
