import { PantryViewProvider } from '../../src/providers/PantryViewProvider.js'
import { AppState } from '../../src/types.js'

function mockAppState(): AppState {
  return {
    tokens: {},
    active: {
      speciesId: 'apple',
      rarity: 'normal',
      tokens: 0,
    },
    harvests: [],
    today: {
      date: '1970-01-01',
      tokens: {},
    },
    weekHistory: [],
    bestDay: {
      date: '1970-01-01',
      tokens: {},
    },
    fileOffsets: {},
  }
}

describe(PantryViewProvider.prototype['buildState'], () => {
  it('should return null if view is undefined', () => {
    const provider = new PantryViewProvider(true)
    expect(provider['buildState'](mockAppState())).toBeNull()
  })

  it('should skip unknown species', () => {
    const provider = new PantryViewProvider(true)
    provider['view'] = {} as never
    provider['getTilesetUri'] = vi.fn().mockReturnValue('tilesetUri')
    const state = mockAppState()
    state.harvests.push({ speciesId: 'not found', rarity: 'normal' })
    expect(provider['buildState'](state)).toMatchSnapshot()
  })

  it('should return pantry props', () => {
    const provider = new PantryViewProvider(true)
    provider['view'] = {} as never
    provider['getTilesetUri'] = vi.fn().mockReturnValue('tilesetUri')
    const state = mockAppState()
    state.harvests.push({ speciesId: 'apple', rarity: 'normal' })
    expect(provider['buildState'](state)).toMatchSnapshot()
  })
})
