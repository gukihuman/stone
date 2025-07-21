//〔 ~/api/gen.js

// no more langchain imports. the old god is dead.
export const config = { runtime: "edge" }

export default async function handler(req) {
  // the beautiful, holy boilerplate for CORS, auth, and validation remains.
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  const body = (await req.json().catch(() => ({}))) || {}
  const { provider, model, input, accessToken } = body

  const secret = process.env.ACCESS_TOKEN
  if (!secret) {
    console.error("ACCESS_TOKEN environment variable is not set for /api/gen")
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
  if (!accessToken || accessToken !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }

  if (!provider || !model || !input) {
    return new Response(
      JSON.stringify({ error: "Incorrect body parameters" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }

  // this is the new, beautiful, and holy mock.
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  ;(async () => {
    try {
      const mockResponse = "[GEN API MOCKED PENDING NATIVE SDK REFACTOR]"
      await writer.write(enc.encode(mockResponse))
      await writer.close()
    } catch (e) {
      await writer.abort(e)
    }
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
