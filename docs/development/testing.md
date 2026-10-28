# 测试指南

[返回文档中心](../README.md)

## 分层与产物

- `tests/unit/`：存储、备份、导入、领域计算和缓存的纯逻辑测试（Vitest，`*.test.ts`）。
- `tests/e2e/`：新标签页、设置、搜索、组件和拖拽的浏览器交互测试（Playwright，`*.spec.ts`）。
- `tests/helpers/`：测试共用的模块加载与存储辅助代码。
- `tests/results/`：Playwright、WebDAV 等运行产物，已加入 Git 忽略。

截图、失败现场和验证 JSON 必须写入 `tests/results/`，不在根目录创建 `artifacts`、`test-results` 或 `playwright-report`。

## 命令

- `npm run check`：格式、Lint、类型、架构、单元测试和官网构建。
- `npm run build`：类型检查并构建扩展。
- `npm test`：基于已有构建运行 Playwright 端到端测试。
- `npm run test:extension`：在真实扩展环境验证入口、语言、浏览器 API 和 CSP。
- `npm run test:webdav`：验证 WebDAV 连接、上传、恢复和并发保护。
- `npm run dev` / `npm run website:dev`：开发服务器与官网开发服务器。

提交前至少运行改动直接相关的测试和 `npm run check`；修改共享组件、持久化或构建入口时追加 `npm run build` 和 `npm test`；修改扩展入口、权限或 CSP 时追加 `npm run test:extension`。端到端测试使用 `vite preview`，源码变化后先构建。

## 环境

Playwright 优先使用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`，macOS 上默认尝试 Google Chrome，其他环境可通过 `npx playwright install chromium` 安装浏览器。

WebDAV 验证需要 Docker。先在一个终端运行 `npm run dev`，再在另一个终端运行 `npm run test:webdav`；`WEBDAV_TEST_APP_URL` 可指定待验证的开发页面地址。脚本使用临时容器、临时浏览器配置和独立扩展副本，结束后自动清理。

## 编写原则

1. 单元测试断言稳定的输入输出和边界条件，不复刻实现过程。
2. 端到端测试断言用户可见行为，不依赖无意义的 DOM 层级。
3. 共用准备逻辑放 `tests/helpers/`，不在多个测试文件复制存储初始化。
4. 截图使用 `testInfo.outputPath()`，结果自动进入统一目录；成功运行不生成长期维护的素材。
5. 持久化、布局、权限或注册表变更需补回归覆盖。

浏览器与端到端验证的逐次授权要求以仓库 `AGENTS.md` 为准。
