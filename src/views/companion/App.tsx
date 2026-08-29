import { render } from 'preact'
import { CATEGORY_ICONS } from '../../constants.js'
import { Category, Rarity, Rect } from '../../types.js'
import { Sprite } from '../components/Sprite.js'
import '../shared.css'
import { WithMessage } from '../WithMessage.js'
import './styles.css'

export interface ICompanionProps {
  tilesetUri: string
  rect: Rect
  speciesName: string
  category: Category
  rarity: Rarity
  progress: number
  currentStage: number
  totalStages: number
  nextStageTokens: string
}

function App({
  tilesetUri,
  rect,
  speciesName,
  category,
  rarity,
  progress,
  currentStage,
  totalStages,
  nextStageTokens,
}: ICompanionProps) {
  const nextStage = currentStage >= totalStages - 1 ? 'harvest' : 'next stage'

  return (
    <>
      <Sprite rect={rect} tilesetUri={tilesetUri} scale={2} />
      <h4>
        {CATEGORY_ICONS[category]} {speciesName} <span class={`rarity-${rarity}`}>★</span>
      </h4>

      <progress max="100" value={progress}>
        70%
      </progress>
      <label>
        Stage {currentStage + 1} / {totalStages} · {nextStageTokens} to {nextStage}
      </label>
    </>
  )
}

render(<WithMessage view={App} />, document.body)
