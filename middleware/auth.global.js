// 〔 ~/middleware/auth.global.js
export default defineNuxtRouteMiddleware(async (to) => {
  // Allow access to the gate page itself
  if (to.path === "/gate") return

  const token = useCookie("access-token").value
  if (!token) return navigateTo("/gate")

  // Use a session-state cache to avoid re-validating on every navigation
  const isAuthOk = useState("is-auth-ok", () => false)
  if (isAuthOk.value) return

  const { success } = await validateAccessToken(token)
  isAuthOk.value = success
  if (!success) return navigateTo("/gate")
})
