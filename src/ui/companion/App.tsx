import { render } from 'preact'
import { StateMessage } from '../../types.js'
import { WithMessage } from '../WithMessage.js'
import { Info } from './components/Info.js'
import { SpriteContainer } from './components/SpriteContainer.js'

function App({ state, rect, tilesetUri }: StateMessage) {
  return (
    <>
      <SpriteContainer rect={rect} tilesetUri={tilesetUri} />
      <Info state={state} />
    </>
  )
}

render(<WithMessage view={App} />, document.body)
