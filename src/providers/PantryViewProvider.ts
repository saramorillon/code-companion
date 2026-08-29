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

    const shelves: Record<string, IPantryProps['shelves'][number]> = {}
    for (const species of AtlasManager.getSpecies()) {
      shelves[species.id] = {
        speciesName: species.name,
        category: species.category,
        baskets: {
          normal: { rect: species.basketIcon.normal, count: 0 },
          silver: { rect: species.basketIcon.silver, count: 0 },
          gold: { rect: species.basketIcon.gold, count: 0 },
        },
      }
    }

    for (const harvest of state.harvests) {
      const shelf = shelves[harvest.speciesId]
      if (shelf) {
        shelf.baskets[harvest.rarity].count++
      }
    }

    return {
      tilesetUri: this.getTilesetUri(this.view.webview),
      shelves: Object.values(shelves),
    }
  }
}
