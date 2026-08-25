import { BasketViewModel } from '../../../types.js'
import { KindRarity } from '../../shared.js'

const SCALE = 2

export function Basket({ basket, tilesetUri }: { basket: BasketViewModel; tilesetUri: string }) {
  return (
    <div className="basket-entry">
      <div
        className="basket-sprite-outer"
        style={
          basket.rect
            ? { width: `${basket.rect.width * SCALE}px`, height: `${basket.rect.height * SCALE}px` }
            : undefined
        }
      >
        {basket.rect && (
          <div
            className="basket-sprite"
            style={{
              width: `${basket.rect.width}px`,
              height: `${basket.rect.height}px`,
              backgroundImage: `url(${tilesetUri})`,
              backgroundPosition: `-${basket.rect.x}px -${basket.rect.y}px`,
              transform: `scale(${SCALE})`,
            }}
          />
        )}
      </div>
      <div className="basket-info">
        <div className="basket-name-row">
          <span className="basket-name">{basket.speciesName}</span>
          <span className="basket-count">×{basket.count}</span>
        </div>
        <div className="basket-kind-rarity">
          <KindRarity kind={basket.kind} color={basket.color} />
        </div>
      </div>
    </div>
  )
}
