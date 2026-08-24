import * as path from 'path'
import * as vscode from 'vscode'
import { HarvestEntry, GardenKind, GardenColor } from '../core/companionModel.js'
import { AtlasRect, loadGardenAtlas, findSpecies } from '../core/gardenAtlas.js'

interface BasketViewModel {
  speciesId: string
  speciesName: string
  kind: GardenKind
  color: GardenColor
  count: number
  rect: AtlasRect | null
}

export class PantryViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'codecompanion.pantry'

  private view: vscode.WebviewView | null = null
  private latestEntries: HarvestEntry[] | null = null
  private isReady = false

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView
    this.isReady = false
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    }
    webviewView.webview.html = this.renderHtml(webviewView.webview)

    // Le script de la webview se charge en async : un postMessage envoyé avant qu'il ait attaché
    // son listener 'message' est perdu. La webview signale donc qu'elle est prête à le recevoir.
    webviewView.webview.onDidReceiveMessage((message: { type: string }) => {
      if (message.type !== 'ready') return
      this.isReady = true
      if (this.latestEntries) {
        this.postEntries(this.latestEntries)
      }
    })
  }

  update(entries: HarvestEntry[]): void {
    this.latestEntries = entries
    if (!this.view || !this.isReady) return
    this.postEntries(entries)
  }

  private postEntries(entries: HarvestEntry[]): void {
    if (!this.view) return

    const atlas = loadGardenAtlas(this.extensionUri.fsPath)
    const tilesetUri = this.view.webview
      .asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, atlas.image)))
      .toString()

    const counts = new Map<string, number>()
    for (const entry of entries) {
      const key = `${entry.speciesId}|${entry.color}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const baskets: BasketViewModel[] = []
    for (const [key, count] of counts) {
      const [speciesId, color] = key.split('|') as [string, GardenColor]
      const source = entries.find((e) => e.speciesId === speciesId && e.color === color)!
      const species = findSpecies(atlas, source.kind, speciesId)
      baskets.push({
        speciesId,
        speciesName: species?.name ?? speciesId,
        kind: source.kind,
        color,
        count,
        rect: species?.basketIcon[color] ?? null,
      })
    }

    baskets.sort(
      (a, b) =>
        a.kind.localeCompare(b.kind) || a.speciesId.localeCompare(b.speciesId) || a.color.localeCompare(b.color),
    )

    this.view.webview.postMessage({ type: 'baskets', baskets, tilesetUri })
  }

  private renderHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'dist', 'ui', 'pantry', 'main.js')),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'pantry', 'styles.css')),
    )
    const sharedStyleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src', 'ui', 'shared.css')),
    )

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource}; script-src ${webview.cspSource};" />
  <link rel="stylesheet" href="${sharedStyleUri.toString()}" />
  <link rel="stylesheet" href="${styleUri.toString()}" />
</head>
<body>
  <script src="${scriptUri.toString()}"></script>
</body>
</html>`
  }
}
