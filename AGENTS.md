# Repository Guidelines

## Code

- TypeScript + React, strict typing, `@/` imports; kebab-case files, PascalCase components, camelCase functions. Prettier and ESLint own formatting.
- Keep page composition in `src/pages/`, shared controls in `src/components/ui/`, grid behavior in `src/components/tab-grid/`, state actions in `src/stores/`, cross-store workflows in `src/application/`, and models/adapters in `src/lib/`.
- Widget metadata, sizes, and capabilities belong in `src/lib/grid/registry.ts`. See [architecture](docs/development/architecture.md) for dependency boundaries.
- The website and hosted privacy policy live in `website/`; root `vercel.json` controls deployment.

## Verification

- `npm ci` installs dependencies; `npm run dev` starts Vite.
- `npm run check` runs format, lint, types, architecture, unit tests, and the website build.
- `npm run build` produces the extension in `dist/`.
- Tests: `tests/unit/*.test.ts` (Vitest), `tests/e2e/*.spec.ts` (Playwright), shared helpers in `tests/helpers/`. Import source modules directly; `tests/unit/setup.ts` provides browser storage stubs.
- Cover user-visible behavior and data boundaries, especially persisted data, layout, permissions, and widget registration. Put generated results in `tests/results/`; use `testInfo.outputPath()` for screenshots.
- **Before every E2E run, obtain separate explicit user confirmation**, including commands or scripts that indirectly run E2E tests. A task mentioning testing is not permission. Missing, ambiguous, or unanswered confirmation means do not run.
- **Before every browser verification session, obtain separate explicit user confirmation**, including navigation, inspection, screenshots, and automation. Missing, ambiguous, or unanswered confirmation means do not operate the browser.
- See [testing](docs/development/testing.md) for browser and WebDAV setup.

## Delivery

- Use focused Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). PRs state behavior changes, verification, and related issues; include screenshots for visible UI changes when browser verification is authorized.
- Update existing documentation only when its instructions or claims become inaccurate. Keep implementation details in code and tests, not duplicated prose.
- Update privacy disclosures and publishing guidance when permissions, network access, data collection, sharing, retention, or deletion actually change.
- Never commit `.env` files, signing keys, credentials, backups, or generated packages. Publishing drafts stay in ignored `materials/`; canonical store assets live in `docs/`.
