export function random<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length)
  const result = array.at(index)
  if (!result) {
    throw new Error(`Index ${index} out of bounds for array of length ${array.length}`)
  }
  return result
}

export function sum(values: number[]) {
  return values.reduce((acc, curr) => acc + curr, 0)
}
