# Contributing to ClawdGotchi

Thanks for your interest in contributing! Here's how you can help.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/clawdgotchi.git`
3. Install dependencies: `npm install`
4. Run in dev mode: `npm run electron:dev`

## Development Workflow

1. Create a branch for your feature: `git checkout -b feature/my-feature`
2. Make your changes
3. Test locally with `npm run electron:dev`
4. Commit your changes with a descriptive message
5. Push and open a Pull Request

## Project Structure

- `electron/` - Main process code (Node.js)
- `src/` - Renderer process code (React)
- `assets/` - Icons, hooks, and static assets

## Ideas for Contributions

### New Accessories
Add new subtle accessories in `src/components/accessories/`:
1. Create a new SVG component
2. Add it to the `ACCESSORIES` array in `index.tsx`
3. Update `ACCESSORY_COUNT` in `sessionManager.ts`

### New Thoughts
Add fun thought bubbles in `src/components/WanderingCrab.tsx`:
- `THOUGHTS` array for idle crabs
- `ACTIVE_THOUGHTS` array for working crabs

### Beach Decorations
Add environment elements in `src/components/MultiPetView.tsx`

### Platform Support
Currently macOS only - Windows/Linux support would be great!

## Code Style

- TypeScript for type safety
- Functional React components with hooks
- Tailwind CSS for styling
- Keep components small and focused

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add new accessory type`
- `fix: crab not appearing on session start`
- `docs: update README with troubleshooting`

## Questions?

Open an issue if you have questions or want to discuss a feature before implementing.
