export default function (ref, behavior = "smooth") {
  ref.scrollTo({ top: 0, behavior: behavior })
}
