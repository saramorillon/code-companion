export interface TextChange {
  text: string
}

export function countInsertedChars(changes: readonly TextChange[]): number {
  let total = 0
  for (const change of changes) {
    if (change.text.length > 0) total += change.text.length
  }
  return total
}

export class TypedCharsAccumulator {
  private pendingChars = 0

  add(changes: readonly TextChange[]): void {
    this.pendingChars += countInsertedChars(changes)
  }

  takePendingChars(): number {
    const chars = this.pendingChars
    this.pendingChars = 0
    return chars
  }
}
