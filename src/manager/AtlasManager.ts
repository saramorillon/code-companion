import { RARITIES } from '../constants.js'
import atlasData from '../tileset-atlas.json' with { type: 'json' }
import { Atlas } from '../types.js'
import { random } from '../utils/array.js'

const atlas = atlasData as Atlas

export const AtlasManager = {
  getImage() {
    return atlas.image
  },

  pickRandomSpecies() {
    return {
      speciesId: random(atlas.species).id,
      rarity: random(RARITIES),
      tokens: 0,
    }
  },

  getSpeciesById(speciesId: string) {
    return atlas.species.find((species) => species.id === speciesId)
  },
}
