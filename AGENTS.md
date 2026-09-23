# Repository Guidelines

## Project Structure & Module Organization

Application code lives in `src/`. Page composition belongs in `src/pages/`, reusable controls in `src/components/ui/`, grid widgets and drag behavior in `src/components/tab-grid/`, state actions in `src/stores/`, application orchestration in `src/application/`, and pure models plus browser/storage adapters in `src/lib/`. Treat `src/lib/grid/registry.ts` as the source of truth for widget metadata, sizes, and capabilities. See `docs/development/architecture.md` for the maintained boundaries.

Browser entries and icons live in `public/`; canonical store assets live in `docs/`. Automation is grouped under `scripts/assets/`, `scripts/release/`, and `scripts/verification/`. Tests use `tests/unit/`, `tests/e2e/`, and `tests/helpers/`; their generated results belong in `tests/results/`. Local publishing drafts belong in the ignored `materials/` directory and must not be committed.

The product website and hosted privacy policy are maintained as the `website/` workspace and deployed through the root `vercel.json`.

## Build, Test, and Development Commands

- `npm ci`: install the locked dependency set.
- `npm run dev`: start the Vite development server.
- `npm run check`: run formatting, lint, types, architecture, unit tests, and the website build.
- `npm run build`: type-check and build the extension into `dist/`.
- `npm test`: run Playwright tests against an existing build; run `npm run build` first.
- `npm run test:extension`: validate the unpacked extension and CSP behavior.
- `npm run test:webdav`: run the Docker-backed WebDAV integration check while the development server is running.

See `docs/development/testing.md` for individual checks, browser setup, and WebDAV requirements.

## Coding Style & Naming Conventions

Use TypeScript, React function components, strict typing, and the `@/` alias. Prettier and ESLint own mechanical formatting. Use kebab-case filenames, PascalCase components, and camelCase functions. Keep data transformations outside render components and reuse shared primitives.

## Testing Guidelines

Name Playwright tests `*.spec.ts` and unit tests `*.test.ts` (Vitest). Test user-visible behavior in E2E suites and stable input/output boundaries in unit suites. Import source modules directly and stub dependencies with `vi.mock`/`vi.stubGlobal`; `tests/unit/setup.ts` supplies shared IndexedDB/location/locks stubs. Add regression coverage for persisted data, layout, permission, or registry changes. Use `testInfo.outputPath()` for screenshots.

Agents MUST NOT run end-to-end tests autonomously. Before every end-to-end test run, agents MUST ask the user for a separate, explicit confirmation, even if the task request mentions testing. If that confirmation is absent, ambiguous, or unanswered, treat it as a refusal and do not run the test. This applies to direct commands and indirect scripts that trigger end-to-end tests.

Agents MUST NOT autonomously open or operate a browser to verify UI changes, including inspecting pages, taking screenshots, or using browser automation. Before each browser-based verification session, agents MUST separately ask for the user's explicit confirmation. If confirmation is absent, ambiguous, or unanswered, treat it as a refusal; do not open or operate the browser. The need to verify a UI change does not override this rule.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style, including `feat:`, `fix:`, `refactor:`, `docs:`, and `chore:`, followed by a concise imperative summary. Keep commits focused. Pull requests should explain the behavior change, list validation performed, link relevant issues, and include before/after screenshots for visible UI changes. Update documentation, store copy, privacy disclosures, and tests when the corresponding behavior changes.

## Security & Configuration

Do not commit `.env` files, signing keys, backups, WebDAV credentials, or generated packages. Changes to permissions, network services, or stored data must also update the privacy policy copy in `website/src/i18n/locales/` and the publishing guide.
