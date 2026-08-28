import { AtlasManager } from '../../src/manager/AtlasManager.js'
import { random } from '../../src/utils/array.js'

vi.mock(import('../../src/utils/array.js'))

beforeEach(() => {
  vi.mocked(random).mockImplementation((array) => array[0])
})

describe(AtlasManager.getImage, () => {
  it('should return atlas image', () => {
    expect(AtlasManager.getImage()).toBe('tileset.png')
  })
})

describe(AtlasManager.pickRandomSpecies, () => {
  it('should return random species id', () => {
    expect(AtlasManager.pickRandomSpecies().speciesId).toBe('apple')
  })

  it('should return random rarity', () => {
    expect(AtlasManager.pickRandomSpecies().rarity).toBe('normal')
  })

  it('should return 0 token', () => {
    expect(AtlasManager.pickRandomSpecies().speciesId).toBe('apple')
  })
})

describe(AtlasManager.getSpeciesById, () => {
  it('should return found species', () => {
    expect(AtlasManager.getSpeciesById('apple')).toMatchObject({ id: 'apple' })
  })

  it('should undefined if species is not found', () => {
    expect(AtlasManager.getSpeciesById('not found')).toBeUndefined()
  })
})
