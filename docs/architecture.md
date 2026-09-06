# 项目架构

## 视觉效果

`src/components/effects/` 是视觉效果的公共底层，不依赖标签、文件夹或其他业务数据类型。

| 模块 | 职责 |
| --- | --- |
| `burning-texture.ts` | 根据颜色、坐标、时间、显现进度与幅度计算单个方格颜色；无 React 状态。 |
| `burning-clock.ts` | 共享 30 FPS 时钟，页面隐藏或减少动态效果时暂停更新，最后一个订阅者退出时释放监听。 |
| `use-visual-transition.ts` | 统一 `hidden → entering → visible → exiting` 生命周期、进度、动画中断、全局开关与减少动态效果。 |
| `effect-surface.tsx` | 测量容器、绘制方格、接入共享生命周期和时钟；不可见时停止逐帧绘制。 |
| `motion-presence.tsx` | 复用同一生命周期实现上下进出，退出完成后隐藏内容或通知调用方移除数据。 |

方格显现使用 surface 时间配置，浮层移动使用 overlay 时间配置。动画参数集中定义在生命周期模块；新组件只提供显示状态、方向和完成回调，不自行添加退出定时器。

`TabBackground` 只负责把标签颜色和图标组合成标签背景。Toast、多选工具栏、个性化背景直接使用 `EffectSurface`，不再构造虚假的标签数据。组件可以决定何时激活燃烧，但不负责帧调度和动画清理。

拖拽位置补间、文件夹展开和点阵角色动作属于各自交互逻辑，不参与燃烧显现进度计算。

`particle-texture.ts` 提供浮游粒子的独立计算，`pointer-tracker.ts` 统一管理指针监听。切换效果仅更换绘制算法，继续复用时钟、过渡和组件容器。

## 状态与操作

- `tab-grid-store.ts` 是主页组件数据的操作入口。保存、删除、批量删除、成组、书签导入都通过其 action 执行。
- 单项删除委托批量删除 action，共用局部撤销。撤销仅恢复被删组件和对应坐标，不回滚后续其他操作。
- `grid-layout.ts` 负责布局推导、碰撞处理及布局补全；已有列数直接恢复，新列数参考最近布局的视觉顺序。
- `grid-operations.ts` 负责成组的数据转换；`bookmark-import.ts` 负责 HTML 解析和增量去重，不直接写入持久化状态。
- `grid-selection-store.ts` 只保存选择模式与组件 ID。浮层退出动画属于视觉层。
- `toast-store.ts` 保存消息与关闭意图；`MotionPresence` 完成退出后调用 remove。消息阅读时长属于 Toaster 的通知逻辑，与动画时长分离。

## 界面边界

- `grid-item-dialog.tsx` 负责组件分类和预览选择。
- `component-configuration.tsx` 负责标签、文件夹配置与提交。
- 设置页复用颜色选择器、统一控件布局和 Toast；页面不重复实现通知排版。
- `tab-grid.tsx` 负责拖拽交互协调、可见网格和操作入口。布局与数据转换保持在独立模块，新增操作不应继续堆入拖拽事件处理器。

## 配置兼容

主题色、燃烧幅度和过渡开关仍写入 `omt.home-settings`，由 `config-transfer.ts` 统一校验、导入导出。沿用此存储位置可直接读取现有用户配置，避免并存两套主题色来源。

历史 `burningEntrance` 字段映射到 `transitionsEnabled`；缺失燃烧幅度时使用 100%。历史布局记录继续可读取，当前可见网格最多五列。更改持久化字段时必须同时更新恢复逻辑、配置校验和兼容测试。

## 验证

`tests/effects.spec.ts` 覆盖过渡中断、反向切换、减少动态效果、火焰隐藏与 Toast 退出清理。组件操作、配置、点阵、搜索和宽屏布局有独立的页面回归测试。纯配置编码与图标缓存通过单元测试验证。
