import * as vscode from 'vscode'
import { CompanionService } from './core/companionService.js'
import { CompanionViewProvider } from './ui/companionView.js'
import { PantryViewProvider } from './ui/pantryView.js'
import { StatsViewProvider } from './ui/statsView.js'
import { TypingTracker } from './ui/typingTracker.js'

let refreshTimer: ReturnType<typeof setInterval> | null = null

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const storageDir = context.globalStorageUri.fsPath

  const service = await CompanionService.create(storageDir, context.extensionUri.fsPath)
  const companionViewProvider = new CompanionViewProvider(context.extensionUri)
  const pantryViewProvider = new PantryViewProvider(context.extensionUri)
  const statsViewProvider = new StatsViewProvider(context.extensionUri)
  const typingTracker = new TypingTracker()

  const refresh = async () => {
    const state = await service.refresh(typingTracker.takePendingChars())
    companionViewProvider.update(state)
    pantryViewProvider.update(service.harvestEntries())
    statsViewProvider.update(service.stats())
  }

  // Une vue peut se résoudre avant que le premier refresh() n'ait fini de tourner (I/O des logs
  // Claude Code) : sans ce refresh() supplémentaire déclenché à la résolution, la webview
  // resterait vide jusqu'au prochain cycle périodique (jusqu'à refreshIntervalSeconds plus tard).
  const onResolved = (provider: vscode.WebviewViewProvider): vscode.WebviewViewProvider => ({
    resolveWebviewView: (...args) => {
      provider.resolveWebviewView(...args)
      void refresh()
    },
  })

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(CompanionViewProvider.viewId, onResolved(companionViewProvider)),
    vscode.window.registerWebviewViewProvider(PantryViewProvider.viewId, onResolved(pantryViewProvider)),
    vscode.window.registerWebviewViewProvider(StatsViewProvider.viewId, onResolved(statsViewProvider)),
  )

  await refresh()
  scheduleRefresh(refresh)

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codecompanion.refreshIntervalSeconds')) {
        scheduleRefresh(refresh)
      }
    }),
  )

  context.subscriptions.push(
    vscode.window.onDidChangeWindowState((windowState) => {
      if (windowState.focused) {
        void refresh()
      }
    }),
  )

  context.subscriptions.push(vscode.commands.registerCommand('codecompanion.refresh', refresh))
}

function scheduleRefresh(refresh: () => Promise<void>): void {
  if (refreshTimer) clearInterval(refreshTimer)
  const seconds = vscode.workspace.getConfiguration('codecompanion').get<number>('refreshIntervalSeconds', 90)
  refreshTimer = setInterval(refresh, seconds * 1000)
}

export function deactivate(): void {
  if (refreshTimer) clearInterval(refreshTimer)
}
