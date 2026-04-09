export function shuffleArray<T>(items: T[], seed = Date.now()) {
  const clone = [...items]
  let state = seed

  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1))
    ;[clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]]
  }

  return clone
}
