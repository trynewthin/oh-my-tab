# 开发架构

[返回文档中心](../README.md)

## 模块边界

- `src/main.tsx` / `src/popup.tsx`：新标签页与工具栏入口；`src/pages/` 组合页面。
- `src/components/`：界面与交互。通用控件在 `ui/`，网格与拖拽在 `tab-grid/`，视觉效果在 `effects/`。
- `src/stores/`：状态与 action；`src/application/`：启动、备份、同步等跨 store 流程。
- `src/lib/`：模型、计算和浏览器适配器，不依赖 store 或界面。
- `website/`：独立官网 workspace，部署配置在根目录 `vercel.json`。

持久化操作经 store 或 application 完成；视图不另建数据转换流程。文件夹与待办复用 `tab-grid/collection/`，其他共用表面放 `shared/`。导入方向和静态循环由 `npm run verify:architecture` 检查，规则以该脚本为准。

设置表单复用 `settings/shared/` 的设置行、控件表面样式与数值滑块；需要数值输入时由同一个滑块组件提供，不在页面内另建组合控件。分类底部重置保留独立的确认交互。

## 网格

组件元数据与尺寸以 `src/lib/grid/registry.ts` 为准，新增组件见[组件开发](widgets.md)。

`grid-layout.ts` 计算布局，`grid-operations.ts` 处理成组，`tab-transfer.ts` 处理主页与文件夹间移动；拖拽层只编排这些操作。删除撤销只恢复本次删除的内容，不覆盖之后的修改。

## 存储与迁移

扩展使用 `chrome.storage.local`，网页预览使用 IndexedDB，统一入口为 `src/lib/storage.ts`。完成数据恢复后才渲染主界面。

- 版本由 `src/lib/data-version.ts` 定义。历史转换放 `src/lib/migrations/`，先转换、校验、保存，再加载 store；不能依赖用户下次编辑才写回新格式。
- 当前存储优先于旧 localStorage，包括删除标记。提交成功后才清理旧副本和记录迁移完成；重试不能重复聚合或覆盖新写入。
- 完成标记不能代替逐项版本检查。已写入的数据版本不得因源码回退而重用；未知未来格式拒绝覆盖。
- 导入不修改用户选择的备份文件。备份结构与完整性检查在 `backup-codec.ts`，恢复编排在 `application/config-transfer.ts`。
- WebDAV 快照先上传，再以强 ETag 条件提交索引，最后清理旧文件。索引提交失败时仍须保留可用的源文件。

持久化格式变化需一起处理校验、迁移、导入导出和回归测试；移除历史转换前先确定最低支持版本。

## 动效

共享时钟、显隐生命周期和测量在 `src/components/effects/`。业务组件不另建逐帧时钟；离屏或页面隐藏时暂停，卸载时释放图形资源，尊重系统减少动态效果设置。

标签样式与纹理几何独立：纹理使用固定尺寸的正方形像素，顶部从完整一行开始，向下铺满容器；末行超出底边的部分裁切，不额外留白，也不拉伸像素。文件夹跨行连续性通过纹理行序号表达，不能用局部高度反算像素步长或裁切首行；边框限定纹理区域，圆角负责轮廓裁切。DOM 与 Canvas 渲染器遵循同一几何规则。
