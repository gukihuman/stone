// nuxt.config.ts
const devBaseUrl = "https://stone-git-space-odyssey-gukis-projects.vercel.app"
// const devBaseUrl = "https://stone-seven.vercel.app"

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["./main.css"],
  runtimeConfig: {
    public: {
      human: process.env.HUMAN || "Human",
      entities: process.env.ENTITIES?.split(",").map((e) => e.trim()),
      baseUrl: process.env.VERCEL_ENV === "development" ? devBaseUrl : "",
    },
  },
  imports: { dirs: ["utils/**"] },
  // routeRules: { "/": { redirect: "/smth" } },
})
