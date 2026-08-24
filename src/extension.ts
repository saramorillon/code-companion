import * as vscode from 'vscode'
import { CompanionService } from './core/companionService.js'
import { CompanionViewProvider } from './core/companionView.js'
import { PantryViewProvider } from './core/pantryView.js'
import { StatsViewProvider } from './core/statsView.js'
import { TypingTracker } from './core/typingTracker.js'

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

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(CompanionViewProvider.viewId, companionViewProvider),
    vscode.window.registerWebviewViewProvider(PantryViewProvider.viewId, pantryViewProvider),
    vscode.window.registerWebviewViewProvider(StatsViewProvider.viewId, statsViewProvider),
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
