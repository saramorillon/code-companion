import { render } from 'preact'
import { BasketsMessage } from '../../types.js'
import { WithMessage } from '../WithMessage.js'
import { Basket } from './components/Basket.js'

function App({ baskets, tilesetUri }: BasketsMessage) {
  if (baskets.length === 0) {
    return <div id="empty-state">No harvests yet.</div>
  }

  return (
    <div id="basket-list">
      {baskets.map((basket) => (
        <Basket key={`${basket.speciesId}|${basket.color}`} basket={basket} tilesetUri={tilesetUri} />
      ))}
    </div>
  )
}

render(<WithMessage view={App} />, document.body)
