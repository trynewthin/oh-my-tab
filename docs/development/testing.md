# 测试指南

[返回文档中心](../README.md)

## 测试分层

| 目录             | 内容                                             |
| ---------------- | ------------------------------------------------ |
| `tests/unit/`    | 存储、备份、导入、领域计算和缓存等纯逻辑测试     |
| `tests/e2e/`     | 新标签页、设置、搜索、组件和拖拽等浏览器交互测试 |
| `tests/helpers/` | 测试共用的模块加载与存储辅助代码                 |
| `tests/results/` | Playwright、WebDAV 等测试生成的临时产物          |

`tests/results/` 已加入 Git 忽略。截图、失败现场和验证 JSON 都必须写入该目录，不在根目录创建 `artifacts`、`test-results` 或 `playwright-report`。

## 常用命令

| 命令                     | 用途                                   |
| ------------------------ | -------------------------------------- |
| `npm run lint`           | 检查代码规范                           |
| `npm run typecheck`      | 检查 TypeScript 类型                   |
| `npm run test:unit`      | 运行 Node 单元测试                     |
| `npm test`               | 基于已有构建运行 Playwright 端到端测试 |
| `npm run test:extension` | 在真实扩展环境验证新标签页入口和 CSP   |
| `npm run test:webdav`    | 验证 WebDAV 连接、上传、恢复和并发保护 |

提交前至少运行与改动直接相关的测试。修改共享组件、持久化或构建入口时，再运行完整的 `build`、`lint`、单元测试和端到端测试。

端到端测试使用 `vite preview`，首次运行或源码变化后先执行 `npm run build`。

## 环境要求

Playwright 优先使用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`，macOS 上默认尝试 Google Chrome，其他环境可通过 `npx playwright install chromium` 安装浏览器。

WebDAV 集成验证需要 Docker。先在一个终端运行：

```bash
npm run dev
```

再在另一个终端运行：

```bash
npm run test:webdav
```

可以用 `WEBDAV_TEST_APP_URL` 指定待验证的开发页面地址。脚本使用临时容器、临时浏览器配置和独立扩展副本，结束后自动清理这些运行环境。

## 编写原则

1. 单元测试覆盖稳定的输入输出和边界条件，不复刻实现过程。
2. 端到端测试从用户可见行为断言，避免依赖无意义的 DOM 层级。
3. 共用准备逻辑放在 `tests/helpers/`，不要在多个测试文件复制存储初始化。
4. 需要截图时使用 Playwright 的 `testInfo.outputPath()`，让结果自动进入统一目录。
5. 测试失败应保留足以定位问题的结果，成功运行不生成长期维护的文档素材。
