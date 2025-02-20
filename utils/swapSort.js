export default function (object, key, step) {
  const value = object[key]
  if (!value) return
  const target = Object.values(object).find(
    (target) => target.sort === value.sort + step
  )
  if (!target) return
  target.sort = target.sort - step
  value.sort = value.sort + step
}
