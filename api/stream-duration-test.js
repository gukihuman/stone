// api/stream-duration-test.js
export const config = { runtime: "edge" }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function handler(req) {
  /* ------------------------------------------------- *
   * 🌐  CORS  (allow everything, same style as gen.js)
   * ------------------------------------------------- */
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  /* ------------------------------------------------- *
   * 🚰  Stream one number per second (100 seconds total)
   * ------------------------------------------------- */
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 1; i <= 100; i++) {
          controller.enqueue(`${i} `)
          await sleep(1000)
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*", // ← important!
    },
  })
}
