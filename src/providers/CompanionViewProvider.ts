import { STAGES } from '../constants.js'
import { AtlasManager } from '../manager/AtlasManager.js'
import { AppState } from '../types.js'
import { formatTokens } from '../utils/format.js'
import { ICompanionProps } from '../views/companion/App.js'
import { AbstractViewProvider } from './AbstractViewProvider.js'

export class CompanionViewProvider extends AbstractViewProvider<ICompanionProps> {
  override readonly viewId = 'devcompanion.companion'
  override readonly viewName = 'companion'

  protected override buildState(state: AppState): ICompanionProps | null {
    if (!this.view) {
      return null
    }

    const species = AtlasManager.getSpeciesById(state.active.speciesId)
    if (!species) {
      return null
    }

    const stages = STAGES[`${species.category}-${state.active.rarity}`]

    const currentStage = stages.findLastIndex((stage) => state.active.tokens >= stage) + 1
    if (currentStage < 0 || currentStage > stages.length - 1) {
      return null
    }

    const totalTokens = stages.at(-1)
    if (totalTokens === undefined) {
      return null
    }

    const currentStageTokens = stages.at(currentStage)
    if (currentStageTokens === undefined) {
      return null
    }

    const rect = species.stages.at(currentStage)?.[state.active.rarity]
    if (rect === undefined) {
      return null
    }

    return {
      tilesetUri: this.getTilesetUri(this.view.webview),
      rect,
      speciesName: species.name,
      category: species.category,
      rarity: state.active.rarity,
      progress: (state.active.tokens / totalTokens) * 100,
      currentStage,
      totalStages: stages.length,
      nextStageTokens: formatTokens(currentStageTokens - state.active.tokens),
    }
  }
}
