import { StatsViewProvider } from '../../src/providers/StatsViewProvider.js'
import { AppState } from '../../src/types.js'

function mockAppState(): AppState {
  return {
    tokens: { user: 75_000_000 },
    active: {
      speciesId: 'apple',
      rarity: 'normal',
      tokens: 0,
    },
    harvests: [{ speciesId: 'apple', rarity: 'normal' }],
    today: {
      date: '1970-01-01',
      tokens: { user: 10_000 },
    },
    weekHistory: [
      {
        date: '1970-01-01',
        tokens: { user: 10_000, claude: 10_000 },
      },
      {
        date: '1970-01-02',
        tokens: { user: 10_000, claude: 30_000 },
      },
    ],
    bestDay: {
      date: '1970-01-01',
      tokens: { user: 30_000 },
    },
    fileOffsets: {},
  }
}

describe(StatsViewProvider.prototype['buildState'], () => {
  it('should return stats props', () => {
    const provider = new StatsViewProvider(true)
    provider['view'] = {} as never
    const state = mockAppState()
    expect(provider['buildState'](state)).toMatchSnapshot()
  })
})
