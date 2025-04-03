export default function (events, entity) {
  return events
    .filter((event) => event.memory[entity])
    .map((event) => event.name)
}
