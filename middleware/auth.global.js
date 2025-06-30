// ~/middleware/auth.global.js
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/login") return
  if (to.path === "/family") return // just had some bug or smth. just need access fuck

  const id = useCookie("stone-id").value
  if (!id) return navigateTo("/login")

  const ok = useState("auth-ok", () => false)
  if (ok.value) return

  const { success } = await validateStoneId(id)
  ok.value = success
  if (!success) return navigateTo("/login")
})
