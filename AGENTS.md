# Repository Guidelines

## Project Structure & Module Organization

Application code lives in `src/`. Page composition belongs in `src/pages/`, reusable controls in `src/components/ui/`, grid widgets and drag behavior in `src/components/tab-grid/`, state actions in `src/stores/`, and storage, backup, import, and synchronization logic in `src/lib/`. Treat `src/components/tab-grid/model/registry.ts` as the source of truth for widget metadata, sizes, and capabilities.

Browser entry files and icons live in `public/`. Store and brand assets live in `docs/store-assets/` and `docs/brand/`. Automation is grouped under `scripts/assets/`, `scripts/release/`, and `scripts/verification/`. Tests are split into `tests/unit/`, `tests/e2e/`, and shared helpers in `tests/helpers/`. Generated results belong only in `tests/results/`.

Start with `docs/README.md` for architecture, testing, publishing, and deployment documentation.

## Build, Test, and Development Commands

- `npm ci`: install the locked dependency set.
- `npm run dev`: start the Vite development server.
- `npm run build`: type-check and build the extension into `dist/`.
- `npm run lint`: run ESLint across the repository.
- `npm run test:unit`: run Node unit tests.
- `npm test`: run Playwright tests against an existing build; run `npm run build` first.
- `npm run test:extension`: validate the unpacked extension and CSP behavior.
- `npm run test:webdav`: run the Docker-backed WebDAV integration check while the development server is running.

## Coding Style & Naming Conventions

Use TypeScript, React function components, strict typing, and the `@/` import alias for `src/`. Prettier enforces two-space indentation, double quotes, no semicolons, trailing ES5 commas, and an 80-column width. Run `npm run format` for TypeScript files. Use kebab-case filenames such as `grid-item-dialog.tsx`; use PascalCase for component names and camelCase for functions and variables. Keep data transformations outside render components and reuse shared collection or UI primitives instead of duplicating behavior.

## Testing Guidelines

Name Playwright tests `*.spec.ts` and unit tests `*.test.mjs`. Test user-visible behavior in E2E suites and stable input/output boundaries in unit suites. Add regression coverage for persisted-data, layout, permission, or component-registry changes. No numeric coverage threshold is enforced. Use `testInfo.outputPath()` for screenshots and never create root-level artifact directories.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style: `feat:`, `fix:`, `refactor:`, or `docs:` followed by a concise imperative summary. Keep commits focused. Pull requests should explain the behavior change, list validation performed, link relevant issues, and include before/after screenshots for visible UI changes. Update documentation, store copy, privacy disclosures, and tests when the corresponding behavior changes.

## Security & Configuration

Do not commit `.env` files, signing keys, backups, WebDAV credentials, or generated packages. Changes to permissions, network services, or stored data must also update `public/privacy.html` and the publishing guide.
