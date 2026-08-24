import { assert, test } from 'vitest'
import { countInsertedChars, TypedCharsAccumulator } from '../src/core/typedCharsCounter.js'

test('countInsertedChars sums the length of all inserted text', () => {
  assert.equal(countInsertedChars([{ text: 'a' }, { text: 'bcd' }]), 4)
})

test('countInsertedChars ignores deletions (empty inserted text)', () => {
  assert.equal(countInsertedChars([{ text: '' }]), 0)
})

test('countInsertedChars returns 0 for no changes', () => {
  assert.equal(countInsertedChars([]), 0)
})

test('TypedCharsAccumulator accumulates across multiple add calls', () => {
  const accumulator = new TypedCharsAccumulator()
  accumulator.add([{ text: 'a' }])
  accumulator.add([{ text: 'bc' }])
  assert.equal(accumulator.takePendingChars(), 3)
})

test('TypedCharsAccumulator resets to 0 after takePendingChars', () => {
  const accumulator = new TypedCharsAccumulator()
  accumulator.add([{ text: 'abc' }])
  accumulator.takePendingChars()
  assert.equal(accumulator.takePendingChars(), 0)
})
