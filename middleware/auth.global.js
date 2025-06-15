// ~/middleware/auth.global.js
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/login") return

  const id = useCookie("stone-id").value
  console.log(id)
  if (!id) return navigateTo("/login")

  const ok = useState("auth-ok", () => false)
  if (ok.value) return

  const { success } = await validateStoneId(id)
  ok.value = success
  if (!success) return navigateTo("/login")
})
