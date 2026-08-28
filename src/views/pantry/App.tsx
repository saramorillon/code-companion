import { render } from 'preact'
import { CATEGORY_ICONS } from '../../constants.js'
import { Category, Rarity, Rect } from '../../types.js'
import { Sprite } from '../components/Sprite.js'
import { WithMessage } from '../WithMessage.js'

export interface IPantryProps {
  tilesetUri: string
  baskets: Record<
    string,
    {
      rect: Rect
      speciesName: string
      category: Category
      rarity: Rarity
      count: number
    }
  >
}

function App({ tilesetUri, baskets }: IPantryProps) {
  if (Object.keys(baskets).length === 0) {
    return <div id="empty-state">No harvests yet.</div>
  }

  return (
    <div id="basket-list">
      {Object.entries(baskets).map(([key, basket]) => (
        <div key={key} className="basket-entry">
          <Sprite rect={basket.rect} tilesetUri={tilesetUri} scale={2} />
          <div className="basket-info">
            <div className="basket-name-row">
              <span className="basket-name">
                {CATEGORY_ICONS[basket.category]} {basket.speciesName}
              </span>
              <span className="basket-count">×{basket.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

render(<WithMessage view={App} />, document.body)
