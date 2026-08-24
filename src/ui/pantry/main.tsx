import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { GardenColor, GardenKind, KindRarity } from '../shared.js'

interface AtlasRect {
  x: number
  y: number
  width: number
  height: number
}

interface BasketViewModel {
  speciesId: string
  speciesName: string
  kind: GardenKind
  color: GardenColor
  count: number
  rect: AtlasRect | null
}

interface BasketsMessage {
  type: 'baskets'
  baskets: BasketViewModel[]
  tilesetUri: string
}

const SCALE = 2

function App() {
  const [data, setData] = useState<{ baskets: BasketViewModel[]; tilesetUri: string } | null>(null)

  useEffect(() => {
    const onMessage = (event: MessageEvent<BasketsMessage>) => {
      if (event.data.type !== 'baskets') return
      setData({ baskets: event.data.baskets, tilesetUri: event.data.tilesetUri })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const baskets = data?.baskets ?? []
  const tilesetUri = data?.tilesetUri ?? ''

  return (
    <>
      <div id="empty-state" style={{ display: baskets.length === 0 ? 'block' : 'none' }}>
        No harvests yet.
      </div>
      <div id="basket-list">
        {baskets.map((basket) => (
          <Basket key={`${basket.speciesId}|${basket.color}`} basket={basket} tilesetUri={tilesetUri} />
        ))}
      </div>
    </>
  )
}

function Basket({ basket, tilesetUri }: { basket: BasketViewModel; tilesetUri: string }) {
  return (
    <div className="basket-entry">
      <div
        className="basket-sprite-outer"
        style={basket.rect ? { width: `${basket.rect.width * SCALE}px`, height: `${basket.rect.height * SCALE}px` } : undefined}
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

render(<App />, document.body)
