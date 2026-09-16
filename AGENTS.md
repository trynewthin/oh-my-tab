# Repository Guidelines

## Project Structure & Module Organization

Application code lives in `src/`. Page composition belongs in `src/pages/`, reusable controls in `src/components/ui/`, grid widgets and drag behavior in `src/components/tab-grid/`, state actions in `src/stores/`, and storage, backup, import, and synchronization logic in `src/lib/`. Treat `src/components/tab-grid/model/registry.ts` as the source of truth for widget metadata, sizes, and capabilities.

Browser entries and icons live in `public/`; store assets live in `docs/`. Automation is grouped under `scripts/assets/`, `scripts/release/`, and `scripts/verification/`. Tests use `tests/unit/`, `tests/e2e/`, and `tests/helpers/`. Generated results belong only in `tests/results/`.

The product website and hosted privacy policy are maintained as the `website/` workspace and deployed through the root `vercel.json`.

## Build, Test, and Development Commands

- `npm ci`: install the locked dependency set.
- `npm run dev`: start the Vite development server.
- `npm run build`: type-check and build the extension into `dist/`.
- `npm run lint`: run ESLint across the repository.
- `npm run test:unit`: run the Vitest unit suite in `tests/unit/` (the Vite config is shared, so `@/` imports and `import.meta.env` work).
- `npm test`: run Playwright tests against an existing build; run `npm run build` first.
- `npm run test:extension`: validate the unpacked extension and CSP behavior.
- `npm run test:webdav`: run the Docker-backed WebDAV integration check while the development server is running.
- `npm run website:dev`: start the product website workspace.
- `npm run website:build`: type-check and build the website for Vercel.

## Coding Style & Naming Conventions

Use TypeScript, React function components, strict typing, and the `@/` alias. Prettier enforces two-space indentation, double quotes, no semicolons, trailing ES5 commas, and an 80-column width. Use kebab-case filenames, PascalCase components, and camelCase functions. Keep data transformations outside render components and reuse shared primitives.

## Testing Guidelines

Name Playwright tests `*.spec.ts` and unit tests `*.test.ts` (Vitest). Test user-visible behavior in E2E suites and stable input/output boundaries in unit suites. Import source modules directly and stub dependencies with `vi.mock`/`vi.stubGlobal`; `tests/unit/setup.ts` supplies shared IndexedDB/location/locks stubs. Add regression coverage for persisted data, layout, permission, or registry changes. Use `testInfo.outputPath()` for screenshots.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style: `feat:`, `fix:`, `refactor:`, or `docs:` followed by a concise imperative summary. Keep commits focused. Pull requests should explain the behavior change, list validation performed, link relevant issues, and include before/after screenshots for visible UI changes. Update documentation, store copy, privacy disclosures, and tests when the corresponding behavior changes.

## Security & Configuration

Do not commit `.env` files, signing keys, backups, WebDAV credentials, or generated packages. Changes to permissions, network services, or stored data must also update `website/src/content/privacy.ts` and the publishing guide.
