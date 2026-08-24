import { FC } from 'preact/compat'
import { useEffect, useState } from 'preact/hooks'

declare function acquireVsCodeApi(): { postMessage(message: unknown): void }
const vscode = acquireVsCodeApi()

interface StateEvent<T> {
  type: 'state'
  state: T
}

export function WithMessage<T>({ view }: { view: FC<T> }) {
  const [state, setState] = useState<T | null>(null)

  useEffect(() => {
    const onMessage = (event: MessageEvent<StateEvent<T>>) => {
      if (event.data.type !== 'state') return
      setState(event.data.state)
    }
    window.addEventListener('message', onMessage)
    vscode.postMessage({ type: 'ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!state) {
    return null
  }

  return view(state)
}
