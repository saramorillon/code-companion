import { AtlasManager } from '../manager/AtlasManager.js'
import { AppState } from '../types.js'
import { IPantryProps } from '../views/pantry/App.js'
import { AbstractViewProvider } from './AbstractViewProvider.js'

export class PantryViewProvider extends AbstractViewProvider<IPantryProps> {
  override readonly viewId = 'codecompanion.pantry'
  override readonly viewName = 'pantry'

  protected override buildState(state: AppState): IPantryProps | null {
    if (!this.view) {
      return null
    }

    const baskets: IPantryProps['baskets'] = {}
    for (const entry of state.harvests) {
      const key = `${entry.speciesId}-${entry.rarity}`

      if (baskets[key]) {
        baskets[key].count++
        continue
      }

      const species = AtlasManager.getSpeciesById(entry.speciesId)
      if (!species) {
        continue
      }

      baskets[key] = {
        rect: species.harvestIcon[entry.rarity],
        speciesName: species.name,
        category: species.category,
        rarity: entry.rarity,
        count: 1,
      }
    }

    return {
      tilesetUri: this.getTilesetUri(this.view.webview),
      baskets,
    }
  }
}
