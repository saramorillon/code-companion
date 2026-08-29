import { render } from 'preact'
import { CATEGORY_ICONS } from '../../constants.js'
import { Category, Rarity, Rect } from '../../types.js'
import { Sprite } from '../components/Sprite.js'
import '../shared.css'
import { WithMessage } from '../WithMessage.js'
import './styles.css'

export interface IPantryProps {
  tilesetUri: string
  shelves: {
    speciesName: string
    category: Category
    baskets: Record<Rarity, { rect: Rect; count: number }>
  }[]
}

function App({ tilesetUri, shelves }: IPantryProps) {
  if (Object.keys(shelves).length === 0) {
    return <small>No harvests yet.</small>
  }

  return shelves.map((shelf) => <Shelf key={shelf.speciesName} tilesetUri={tilesetUri} shelf={shelf} />)
}

interface IShelfProps {
  tilesetUri: IPantryProps['tilesetUri']
  shelf: IPantryProps['shelves'][number]
}

function Shelf({ tilesetUri, shelf }: IShelfProps) {
  const { normal, silver, gold } = shelf.baskets
  const total = normal.count + silver.count + gold.count
  const name = total > 0 ? shelf.speciesName : '???'

  return (
    <>
      <h4>
        {CATEGORY_ICONS[shelf.category]} {name} {total > 0 && <small>×{total}</small>}
      </h4>

      <div class="grid">
        {normal.count > 0 && (
          <div class="grid-item">
            <Sprite rect={normal.rect} tilesetUri={tilesetUri} scale={2} />
            <small>
              <span class="rarity-normal">★</span> ×{normal.count}
            </small>
          </div>
        )}

        {silver.count > 0 && (
          <div class="grid-item">
            <Sprite rect={silver.rect} tilesetUri={tilesetUri} scale={2} />
            <small>
              <span class="rarity-silver">★</span> ×{silver.count}
            </small>
          </div>
        )}

        {gold.count > 0 && (
          <div class="grid-item">
            <Sprite rect={gold.rect} tilesetUri={tilesetUri} scale={2} />
            <small>
              <span class="rarity-gold">★</span> ×{gold.count}
            </small>
          </div>
        )}
      </div>
    </>
  )
}

render(<WithMessage view={App} />, document.body)
