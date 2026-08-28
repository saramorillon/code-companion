import { render } from 'preact'
import { CATEGORY_ICONS } from '../../constants.js'
import { Category, Rarity, Rect } from '../../types.js'
import { Sprite } from '../components/Sprite.js'
import { WithMessage } from '../WithMessage.js'

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
      <div id="sprite-container">
        <Sprite rect={rect} tilesetUri={tilesetUri} scale={3} />
      </div>
      <div id="info">
        <div id="name-row">
          <span id="name">
            {CATEGORY_ICONS[category]} {speciesName}
          </span>
          <span className={`rarity-star ${rarity}`} />
        </div>
        <div id="progress-bar">
          <div id="progress-fill" style={{ '--progress': `${progress}%` }} />
        </div>
        <div id="remaining-text">
          Stage {currentStage + 1} / {totalStages} · {nextStageTokens} to {nextStage}
        </div>
      </div>
    </>
  )
}

render(<WithMessage view={App} />, document.body)
