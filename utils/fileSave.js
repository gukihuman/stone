export default (name, content) => {
  const blob = new Blob([JSON.stringify(content)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  document.body.appendChild(a)
  a.style = "display: none"
  a.href = url
  a.download = name
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
