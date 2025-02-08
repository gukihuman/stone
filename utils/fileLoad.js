export default function (handle) {
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.style.display = "none"
    fileInput.onchange = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            handle(JSON.parse(e.target.result))
            resolve()
          } catch (error) {
            console.error("Error parsing JSON:", error)
            reject(error)
          }
        }
        reader.readAsText(file)
      } else {
        reject(new Error("No file selected"))
      }
    }
    document.body.appendChild(fileInput)
    fileInput.click()
    fileInput.remove()
  })
}
