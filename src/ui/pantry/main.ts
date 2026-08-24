import { renderKindAndRarity } from '../shared.js'

type GardenKind = 'tree' | 'crop'
type GardenColor = 'normal' | 'silver' | 'gold'

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

const emptyState = document.getElementById('empty-state')!
const basketList = document.getElementById('basket-list')!

const SCALE = 2

window.addEventListener('message', (event: MessageEvent<BasketsMessage>) => {
  const message = event.data
  if (message.type !== 'baskets') return
  render(message.baskets, message.tilesetUri)
})

function render(baskets: BasketViewModel[], tilesetUri: string): void {
  emptyState.style.display = baskets.length === 0 ? 'block' : 'none'
  basketList.innerHTML = ''

  for (const basket of baskets) {
    basketList.appendChild(renderBasket(basket, tilesetUri))
  }
}

function renderBasket(basket: BasketViewModel, tilesetUri: string): HTMLElement {
  const row = document.createElement('div')
  row.className = 'basket-entry'

  const spriteOuter = document.createElement('div')
  spriteOuter.className = 'basket-sprite-outer'

  const sprite = document.createElement('div')
  sprite.className = 'basket-sprite'
  if (basket.rect) {
    spriteOuter.style.width = `${basket.rect.width * SCALE}px`
    spriteOuter.style.height = `${basket.rect.height * SCALE}px`
    sprite.style.width = `${basket.rect.width}px`
    sprite.style.height = `${basket.rect.height}px`
    sprite.style.backgroundImage = `url(${tilesetUri})`
    sprite.style.backgroundPosition = `-${basket.rect.x}px -${basket.rect.y}px`
    sprite.style.transform = `scale(${SCALE})`
  }
  spriteOuter.append(sprite)

  const info = document.createElement('div')
  info.className = 'basket-info'

  const nameRow = document.createElement('div')
  nameRow.className = 'basket-name-row'
  nameRow.append(textSpan(basket.speciesName, 'basket-name'))
  nameRow.append(textSpan(`×${basket.count}`, 'basket-count'))

  const kindRarity = document.createElement('div')
  kindRarity.className = 'basket-kind-rarity'
  renderKindAndRarity(kindRarity, basket.kind, basket.color)

  info.append(nameRow, kindRarity)
  row.append(spriteOuter, info)
  return row
}

function textSpan(text: string, className: string): HTMLElement {
  const span = document.createElement('span')
  span.className = className
  span.textContent = text
  return span
}
