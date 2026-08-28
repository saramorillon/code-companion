import { random, sum } from '../../src/utils/array.js'

describe(random, () => {
  it('should return a random element of the array', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(random(['a', 'b', 'c'])).toBe('a')
  })

  it('should throw if the index is out of bounds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1.2)
    expect(() => random(['a', 'b', 'c'])).toThrow('Index 3 out of bounds for array of length 3')
  })
})

describe(sum, () => {
  it('should add all number in the array', () => {
    expect(sum([1, 2, 4])).toBe(7)
  })
})
