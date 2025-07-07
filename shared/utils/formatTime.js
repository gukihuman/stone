// ~/shared/utils/formatTime.js
export default function formatTime(ms) {
  const seconds = ms / 1000
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24

  if (seconds < 30) {
    return "a few seconds"
  }
  if (minutes < 1.5) {
    return "around a minute"
  }
  if (minutes < 9.5) {
    const roundedMinutes = Math.round(minutes)
    return `~ ${roundedMinutes} minutes`
  }
  if (minutes < 57.5) {
    const roundedToFive = Math.round(minutes / 5) * 5
    return `~ ${roundedToFive} minutes`
  }
  if (hours < 1.5) {
    return "around an hour"
  }
  if (hours < 18) {
    const roundedHours = Math.round(hours)
    return `~ ${roundedHours} hours`
  }
  if (days < 1.5) {
    return "around a day"
  }
  const roundedDays = Math.round(days)
  return `~ ${roundedDays} days`
}
