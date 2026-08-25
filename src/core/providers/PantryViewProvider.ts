import * as path from 'path'
import * as vscode from 'vscode'
import { GardenColor, HarvestEntry, BasketViewModel } from '../../types.js'
import { loadGardenAtlas, findSpecies } from '../gardenAtlas.js'
import { AbstractViewProvider } from './AbstractViewProvider.js'

export class PantryViewProvider extends AbstractViewProvider<HarvestEntry[]> {
  static readonly viewId = 'codecompanion.pantry'

  protected override buildState(data: HarvestEntry[]) {
    if (!this.view) return

    const atlas = loadGardenAtlas(this.extensionUri.fsPath)
    const tilesetUri = this.view.webview
      .asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, atlas.image)))
      .toString()

    const counts = new Map<string, number>()
    for (const entry of data) {
      const key = `${entry.speciesId}|${entry.color}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const baskets: BasketViewModel[] = []
    for (const [key, count] of counts) {
      const [speciesId, color] = key.split('|') as [string, GardenColor]
      const source = data.find((e) => e.speciesId === speciesId && e.color === color)!
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

    return { baskets, tilesetUri }
  }

  protected renderHtml(webview: vscode.Webview): string {
    const scriptUri = this.getUri(webview, 'dist', 'ui', 'pantry', 'App.js')
    const styleUri = this.getUri(webview, 'src', 'ui', 'pantry', 'styles.css')
    const sharedStyleUri = this.getUri(webview, 'src', 'ui', 'shared.css')

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
