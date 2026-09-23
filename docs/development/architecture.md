# 开发架构

[返回文档中心](../README.md)

## 总体边界

Oh My Tab 的网页预览与浏览器扩展共用 React 应用。新标签页负责搜索、组件网格和设置；工具栏弹窗只负责收藏当前网页。跨 store 的用例编排放在 `src/application/`。存储和书签适配器位于 `src/lib/`，联网授权与浏览器搜索能力集中在 privacy store，工具栏入口负责读取当前标签页；其他界面组件不再分散实现平台差异。

| 入口                   | 职责                             |
| ---------------------- | -------------------------------- |
| `src/main.tsx`         | 新标签页与开发预览入口           |
| `src/popup.tsx`        | 浏览器工具栏弹窗入口             |
| `src/router/`          | 页面路由                         |
| `public/manifest.json` | Manifest V3 清单、权限与扩展入口 |

## 目录职责

| 路径                                  | 职责                                         |
| ------------------------------------- | -------------------------------------------- |
| `src/pages/`                          | 页面组合和入口级交互                         |
| `src/components/ui/`                  | 通用基础控件                                 |
| `src/components/effects/`             | 与业务数据无关的视觉效果底层                 |
| `src/components/tab-grid/`            | 网格组件、拖拽和组件编辑界面                 |
| `src/lib/grid/`                       | 组件注册、创建、数据校验、布局与领域操作     |
| `src/components/tab-grid/collection/` | 文件夹与待办共用的标题、列表、滚动和展开结构 |
| `src/components/tab-grid/shared/`     | 多种网格组件共用的视觉表面                   |
| `src/stores/`                         | 状态操作、持久化入口和跨组件状态             |
| `src/application/`                    | 启动恢复、备份、同步、搜索等应用用例编排     |
| `src/lib/`                            | 纯模型、领域计算及浏览器和存储基础设施适配器 |
| `scripts/`                            | 素材生成、发布校验和集成验证脚本             |
| `tests/`                              | 端到端测试、单元测试、辅助代码和测试产物     |
| `website/`                            | 产品官网与隐私政策独立前端                   |

## 依赖规则

1. 页面负责组合，不复制组件内部行为或状态操作。
2. 组件通过 store action 修改持久化状态，不在视图里拼接新的全局状态对象。
3. 可独立计算的布局、校验、导入和领域规则放在 `src/lib/`，保持无 React 和 store 依赖。
4. 跨 store、存储与网络适配器的流程放在 `src/application/`；application 不依赖页面或组件。
5. 多个业务组件需要相同行为时，先抽到 `collection/`、`shared/` 或 `components/ui/`，再由业务组件组合。
6. 平台访问集中在现有边界：存储和书签使用 `src/lib/` 适配器，权限与浏览器搜索使用 privacy store，当前标签页读取留在 popup 入口。
7. `npm run verify:architecture` 检查 `lib`、`stores`、`application`、`components`、`pages` 的导入方向，并拒绝内部静态循环；其余职责约定依靠评审和测试保障。

## 网格组件

`src/lib/grid/registry.ts` 是组件元数据、尺寸和能力的统一来源。菜单、组件选择页、编辑器、布局计算和右键操作都读取注册表，不各自维护功能判断。

网格占位以 **1×1 为正方形单位**。允许的占格只在 `GRID_OCCUPANCY` 中维护，组件用 `gridSize(token, occupancy, role?)` 报名，不能自写宽高。持久化仍用每种组件自己的 `small` / `large` 等令牌，令牌只在该 kind 内有效。`src/components/tab-grid/template/` 提供标准模板组件，新组件和标签升级可按它接入。

新增或修改组件时按以下顺序处理：

1. 在 `types.ts` 定义持久化数据结构。
2. 在 `registry.ts` 从 `GRID_OCCUPANCY` 声明默认值、尺寸、入口和能力。
3. 在 `factory.ts` 创建完整记录。
4. 在 `validation.ts` 校验保存和导入的数据。
5. 接入展示、编辑和共享操作界面。
6. 为注册信息、数据操作和关键交互补充对应测试。

文件夹和待办共用 collection 结构。新增列表型组件应扩展这些公共结构，避免重新实现标题间距、列数、滚动渐隐和展开面板。

## 状态与布局

`src/stores/tab-grid-store.ts` 是网格数据的操作入口。保存、删除、批量删除、成组、书签导入和待办更新都通过 action 完成。删除撤销只恢复本次删除的数据和坐标，不覆盖其后的其他操作。

`grid-layout.ts` 负责网格推导、碰撞处理和不同列数的布局恢复；`grid-operations.ts` 负责成组转换；`tab-transfer.ts` 负责标签在主页与文件夹之间移动。拖拽事件只协调这些操作，不承担数据转换规则。

自由网格顶栏由主页组合，配置保存在 `home-settings-store.ts`，与网格组件和布局坐标独立。左右区域保存系统操作或网页快捷入口，中间显示时间或文字；顶栏和网格共用 `resolveGridGeometry` 推导的可视宽度以保持对齐。网页图标复用现有 favicon 缓存。

## 存储与兼容

`src/lib/storage.ts` 统一持久化接口：扩展使用 `chrome.storage.local`，开发预览使用 IndexedDB。应用完成数据恢复后再显示主要界面，跨页面写入带版本检查。

`src/lib/backup-codec.ts` 负责 ZIP 格式和完整性校验；`src/application/backup.ts` 组织资源与状态快照，`src/application/config-transfer.ts` 校验并恢复配置，`src/application/webdav.ts` 编排远端备份协议与授权状态。

更改持久化字段时必须同时更新：

1. 类型与校验。
2. 默认创建逻辑。
3. 旧数据迁移或兼容读取。
4. ZIP 导入导出。
5. 单元测试和数据完整性测试。

## 视觉与动画

`src/components/effects/` 提供共享时钟、显隐生命周期、容器测量和纹理绘制。业务组件只提供显示状态、方向、颜色和完成回调，不创建独立的逐帧时钟或退出定时器。

电子点阵、燃烧、粒子、文件夹光效和花盆由 PixiJS 渲染。离屏或页面隐藏时停止调度，组件卸载时释放场景与纹理。系统“减少动态效果”设置通过共享生命周期统一生效。

## 相关文档

- [测试指南](testing.md)
- [Chrome Web Store 发布](../publishing/chrome-web-store.md)
