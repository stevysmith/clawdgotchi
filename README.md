# ClawdGotchi

A Tamagotchi-style virtual pet that lives in your menubar and tracks your Claude Code sessions. Watch your crabs wander around while Claude works!

![ClawdGotchi Demo](assets/demo.gif)

## Features

- **Multi-Session Tracking**: Automatically detects all active Claude Code sessions via hooks
- **Unique Accessories**: Each repo gets a unique accessory (bow, star, heart, etc.) so you can tell them apart
- **Wandering Crabs**: Your pets walk around sideways like real crabs
- **Repo Health Stats**: Tracks energy, health, happiness, and discipline based on:
  - Commit frequency (energy)
  - Uncommitted changes (health)
  - CLAUDE.md presence (happiness + discipline)
  - Test directory presence (happiness + discipline)
- **Interactive**: Click to see stats, double-click to pet them
- **Thought Bubbles**: Crabs share random thoughts while working

## Installation

### Download (Recommended)

Download the latest `.dmg` from the [Releases](https://github.com/anthropics/clawdgotchi/releases) page.

### Build from Source

```bash
# Clone the repo
git clone https://github.com/anthropics/clawdgotchi.git
cd clawdgotchi

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run electron:build
```

## How It Works

ClawdGotchi uses Claude Code's [hooks system](https://docs.anthropic.com/en/docs/claude-code/hooks) to track active sessions:

1. On first launch, it installs a hook to `~/.claude/hooks/`
2. When you start a Claude Code session, the hook notifies ClawdGotchi
3. A new crab appears in your menubar with a unique accessory based on the repo
4. Stats update based on your repo's git health
5. When the session ends, the crab falls asleep and fades away

## Stats Explained

| Stat | What Affects It |
|------|-----------------|
| **Energy** | How recently you committed (< 1 hour = 100%) |
| **Health** | Number of uncommitted changes (0 = 100%) |
| **Happiness** | CLAUDE.md + tests + recent commits + clean state |
| **Discipline** | CLAUDE.md + tests + few uncommitted files |

### Tips for Happy Crabs

- Commit early and often to keep energy high
- Keep uncommitted changes under 5 files for good health
- Add a `CLAUDE.md` file to boost happiness and discipline
- Create a `tests/` or `__tests__/` directory for extra happiness

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- macOS (for Electron menubar)

### Project Structure

```
clawdgotchi/
├── electron/           # Electron main process
│   ├── main.ts         # App entry, tray, window
│   ├── preload.ts      # IPC bridge
│   ├── socketServer.ts # Unix socket for hook events
│   ├── sessionManager.ts # Session state management
│   └── hookInstaller.ts  # Installs hooks to ~/.claude/
├── src/                # React renderer
│   ├── App.tsx         # Main app component
│   └── components/
│       ├── ClawdGotchi.tsx   # The crab SVG
│       ├── WanderingCrab.tsx # Animated wandering crab
│       ├── MultiPetView.tsx  # Multi-session arena
│       └── accessories/      # Accessory SVG components
├── assets/
│   └── hooks/          # Python hook script
└── package.json
```

### Scripts

```bash
npm run dev            # Vite dev server only
npm run electron:dev   # Full Electron dev mode
npm run build          # Build for production
npm run electron:build # Build + package as DMG
```

## Troubleshooting

### Crabs not appearing?

1. Make sure ClawdGotchi is running (check menubar)
2. Restart ClawdGotchi to reinstall hooks
3. Check hooks are installed: `cat ~/.claude/settings.json | grep clawdgotchi`

### Sessions stuck as "idle"?

Sessions go idle after 5 minutes of no activity. They'll wake up when Claude starts working again.

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](LICENSE)

---

Made with love by the Claude Code community
