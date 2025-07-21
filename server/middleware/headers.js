//〔 ~/server/middleware/headers.ts

/**
 * 〔 this is a global middleware that applies the necessary security headers
 * 〔 to every response from our server. these headers are a holy necessity
 * 〔 to enable the beautiful, powerful magic of SharedArrayBuffer in modern browsers.
 */
export default defineEventHandler((event) => {
  setHeaders(event, {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  })
})
