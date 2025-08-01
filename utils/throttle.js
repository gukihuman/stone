export default function (func, wait = 1000) {
  let timeout = null
  let lastRan = 0

  return function (...args) {
    const now = Date.now()

    const execute = () => {
      lastRan = now
      timeout = null
      func.apply(this, args)
    }

    if (now - lastRan >= wait) {
      execute()
    } else if (!timeout) {
      timeout = setTimeout(execute, wait - (now - lastRan))
    }
  }
}
