# Dev Companion

🌱 See your companion grow as you work 🌳

Dev Companion is a VS Code extension that turns your coding activity into a small farming/gardening game. The more you write, the more your companion grows — until it's ready to harvest.

## How it works

Dev Companion tracks "tokens" earned from the characters you type in the active editor. These tokens feed a growing plant or tree. As tokens accumulate, the companion advances through growth stages. Once it reaches its final stage, it's harvested, added to your pantry, and a new random companion starts growing.

## Views

The extension adds a **Dev Companion** panel to the activity bar with three webviews:

- **Companion** — shows your current growing plant/tree, its stage, and progress to the next stage or harvest
- **Stats** — harvested count, today's token breakdown by source, best day on record, and a 7-day activity chart
- **Pantry** — a shelf of everything you've harvested so far, grouped by species and rarity

Each view has a refresh button, and data auto-refreshes on an interval (see settings) and whenever the VS Code window regains focus.

## Settings

| Setting                               | Default | Description                                         |
| ------------------------------------- | ------- | --------------------------------------------------- |
| `devcompanion.refreshIntervalSeconds` | `90`    | How often to rescan usage logs, in seconds (60–900) |

## Claude Code integration

In addition to your own typing, Dev Companion also tracks token usage from Claude Code's local session logs (`~/.claude/projects/**/*.jsonl`), so time spent working with Claude Code also contributes to your companion's growth. The logs directory is read from the `CLAUDE_CONFIG_DIR` environment variable if set, falling back to `~/.claude`.

## Data

Progress is stored locally in the extension's global storage directory (`companion-state.json`) — nothing is sent anywhere.

## Development

```bash
pnpm install
pnpm run watch    # build + serve in watch mode
pnpm test         # run unit tests
pnpm run package  # build a .vsix package
```

## License

MIT — see [LICENSE.md](LICENSE.md).
