export class Uri {
  static file(path: string) {
    return path
  }
}

export const workspace = {
  onDidChangeTextDocument: vi.fn(),
}

export const window = {
  activeTextEditor: {
    document: 'active document',
  },
}
