# 仓库开发规范

## 代码约定

- 使用 TypeScript + React，保持严格类型，通过 `@/` 导入模块。
- 文件名使用 kebab-case，组件名使用 PascalCase，函数名使用 camelCase；格式与代码风格由 Prettier 和 ESLint 统一管理。

## 目录边界

- 页面组合放在 `src/pages/`，共享控件放在 `src/components/ui/`，网格行为放在 `src/components/tab-grid/`，状态操作放在 `src/stores/`，跨 store 流程放在 `src/application/`，模型和适配器放在 `src/lib/`。
- 小组件的元数据、尺寸和能力统一定义在 `src/lib/grid/registry.ts`。依赖边界见[开发架构](docs/development/architecture.md)。

## 开发与验证

- `npm ci` 安装依赖；`npm run dev` 启动 Vite 开发服务。
- 按改动范围选择验证：`npm run check` 执行格式、Lint、类型、架构检查及单元测试；`npm run build` 将扩展构建到 `dist/`。交付时如实说明验证情况。
- 单元测试位于 `tests/unit/*.test.ts`（Vitest），端到端测试位于 `tests/e2e/*.spec.ts`（Playwright），共享辅助工具位于 `tests/helpers/`。直接导入源码模块；`tests/unit/setup.ts` 提供浏览器存储桩。
- 测试应覆盖用户可见行为与数据边界，尤其是持久化数据、布局、权限和小组件注册。生成的测试产物放在 `tests/results/`；截图路径使用 `testInfo.outputPath()`。
- **每次进行浏览器验证前，都必须单独获得用户明确确认**，包括页面导航、检查、截图和自动化操作。未获确认、确认含糊或用户未回复时，不得操作浏览器。
- 浏览器和 WebDAV 环境配置见[测试指南](docs/development/testing.md)。

## 交付要求

- 以 `nightly` 为开发基线，默认直接提交并推送到该分支；仅在用户明确要求时创建分支或 PR。提交方式以用户最新指令为准。
- 提交应聚焦单一主题，遵循 Conventional Commits（`feat:`、`fix:`、`refactor:`、`docs:`、`chore:`）。PR 说明行为变化、验证情况和关联 issue；涉及可见界面变化时，在已获浏览器验证授权的前提下附上截图。
- 每次发布正式版或 Nightly 预览版，都要为用户撰写本次实际改动的中英文更新日志。应用内和 GitHub Release 使用同一份渠道日志，发布流程见[发布指南](docs/publishing/chrome-web-store.md)。
- 仅在现有文档的说明或表述不再准确时更新文档。实现细节保留在代码和测试中，避免在文档中重复。
- 权限、网络访问、数据收集、共享、保留或删除行为发生实际变化时，同步更新隐私说明和发布指南。
- 禁止提交 `.env` 文件、签名密钥、凭据、备份或生成的安装包。发布草稿放在已忽略的 `materials/` 中；正式商店素材放在 `docs/` 中。
