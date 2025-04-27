export default defineNuxtConfig({
  nitro: { preset: "vercel-edge" },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["./main.css"],
  runtimeConfig: {
    public: {
      human: process.env.HUMAN || "Human",
      entities: process.env.ENTITIES?.split(",").map((e) => e.trim()),
    },
  },
  imports: { dirs: ["utils/**"] },
  routeRules: { "/": { redirect: "/circle" } },
})
