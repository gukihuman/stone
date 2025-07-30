// ✎ ~/utils/playSound.js
export const playSound = (sound) => {
  const audio = new Audio(sound)
  audio.play()
}
