export default function (ref, behavior = "smooth") {
  ref.scrollTo({ top: ref.scrollHeight, behavior: behavior })
}
