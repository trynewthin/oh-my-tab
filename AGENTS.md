# Repository Guidelines

## Code

- TypeScript + React, strict typing, `@/` imports; kebab-case files, PascalCase components, camelCase functions. Prettier and ESLint own formatting.
- Keep page composition in `src/pages/`, shared controls in `src/components/ui/`, grid behavior in `src/components/tab-grid/`, state actions in `src/stores/`, cross-store workflows in `src/application/`, and models/adapters in `src/lib/`.
- Widget metadata, sizes, and capabilities belong in `src/lib/grid/registry.ts`. See [architecture](docs/development/architecture.md) for dependency boundaries.
- The website and hosted privacy policy live in `website/`; root `vercel.json` controls deployment.

## Verification

- **未经用户明确要求，禁止主动运行验证**，包括测试、构建、Lint、类型检查、架构检查、冒烟脚本、DOM/SSR 模拟、截图、浏览器自动化及用于验证的 HTTP 探测。不得为验证安装临时依赖或创建测试脚手架。界面修改交由用户查看，不主动追加检查或询问是否验证；允许只读代码检查和用户要求的开发服务操作。如实简述验证状态。

- `npm ci` installs dependencies; `npm run dev` starts Vite.
- `npm run check` runs format, lint, types, architecture, unit tests, and the website build.
- `npm run build` produces the extension in `dist/`.
- Tests: `tests/unit/*.test.ts` (Vitest), `tests/e2e/*.spec.ts` (Playwright), shared helpers in `tests/helpers/`. Import source modules directly; `tests/unit/setup.ts` provides browser storage stubs.
- Cover user-visible behavior and data boundaries, especially persisted data, layout, permissions, and widget registration. Put generated results in `tests/results/`; use `testInfo.outputPath()` for screenshots.
- **Before every browser verification session, obtain separate explicit user confirmation**, including navigation, inspection, screenshots, and automation. Missing, ambiguous, or unanswered confirmation means do not operate the browser.
- See [testing](docs/development/testing.md) for browser and WebDAV setup.

## Delivery

- Use focused Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). PRs state behavior changes, verification, and related issues; include screenshots for visible UI changes when browser verification is authorized.
- Update existing documentation only when its instructions or claims become inaccurate. Keep implementation details in code and tests, not duplicated prose.
- Update privacy disclosures and publishing guidance when permissions, network access, data collection, sharing, retention, or deletion actually change.
- Never commit `.env` files, signing keys, credentials, backups, or generated packages. Publishing drafts stay in ignored `materials/`; canonical store assets live in `docs/`.
