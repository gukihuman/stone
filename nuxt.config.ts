// ~/nuxt.config.ts
const devBaseUrl = "lithos-git-core-gukis-projects.vercel.app"
// const devBaseUrl = "lithos-smth.vercel.app" // want to restore, make a good name there

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["./main.css"],
  runtimeConfig: {
    public: {
      baseUrl: `https://${process.env.NUXT_PUBLIC_BASE_URL || devBaseUrl}`,
    },
  },
  imports: { dirs: ["utils/**"] }, // want to remove
  dir: {
    pages: "continents",
  },
  components: {
    dirs: [{ path: "~/settlements", pathPrefix: false, extensions: [".vue"] }],
  },
})
