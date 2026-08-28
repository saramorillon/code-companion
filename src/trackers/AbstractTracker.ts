import { AppState } from '../types.js'

export abstract class AbstractTracker {
  protected tokens = 0

  constructor(public key: string) {}

  abstract start(state: AppState): void | Promise<void>

  async update(state: AppState) {
    await this._update(state)
    const tokens = this.tokens
    this.tokens = 0
    return tokens
  }

  protected _update(_state: AppState): void | Promise<void> {}

  stop(): void | Promise<void> {}
}
