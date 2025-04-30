// edge/hello.edge.js
export const config = { runtime: "edge" }

export default async function handler() {
  return new Response("Hello from the edge ✨")
}
