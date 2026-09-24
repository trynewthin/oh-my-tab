![Oh My Tab 浏览器新标签页](docs/store-assets/promo-marquee.png)

# Oh My Tab

**简体中文** · [English](README.en.md)

把常用网站、文件夹和小组件放进一个可以自由整理的新标签页。

[下载最新版本](https://github.com/trynewthin/oh-my-tab/releases/latest) · [官方网站](https://ohmytab.vercel.app/) · [查看隐私政策](https://ohmytab.vercel.app/privacy)

## 用顺手的方式打开每一天

Oh My Tab 会替换 Chrome 或 Edge 的新标签页。你可以拖动卡片安排位置，把相关网站收进文件夹，也可以直接搜索主页和文件夹里的书签。

- **整理常用网站**：添加标签和文件夹，自由拖动、排序与调整大小。
- **设置网格列数**：分别选择宽屏和窄屏列数；宽屏布局缩小到 80% 后切换到窄屏列数，并在仍放不下时整体缩放。默认使用 4 列和 2 列。
- **快速搜索**：搜索已有书签，或使用你选择的搜索引擎继续搜索网页。支持自由摆放的搜索框组件，可选 4×1、8×1、12×1 三种大小。
- **快捷按钮**：用 1×1 按钮切换主题、一键整理、进入多选，或打开设置与组件库。
- **实用小组件**：加入时钟、倒计时、便签、专注计时、天气、图片、书签列表、RSS、GitHub 仓库和世界时钟，也可以继续使用日历、待办、点阵画布和像素花盆。
- **个性化外观**：切换浅色、深色或跟随系统，搭配主题色、随机配色与动态效果，调整样式时直接查看预览。支持中英文切换。
- **迁移现有书签**：按需导入 Chrome 或 Edge 书签，并自动处理重复网址和同名文件夹。
- **备份自己的布局**：通过 ZIP 导入、导出完整数据，也可以手动连接 WebDAV 在设备间传递快照。

## 安装

可以从 [Chrome 应用商店](https://chromewebstore.google.com/detail/aihmkimlgdondkkeghfnkiknnocoiioa) 安装，或手动加载发行版：

1. 从 [Releases](https://github.com/trynewthin/oh-my-tab/releases) 下载最新的 ZIP 文件并解压。
2. 在 Chrome 打开 `chrome://extensions/`，或在 Edge 打开 `edge://extensions/`。
3. 开启「开发者模式」，选择「加载已解压的扩展程序」。
4. 选择包含 `manifest.json` 的解压目录。

安装后打开一个新标签页即可开始使用。将扩展固定到工具栏后，还可以把当前网页快速添加到主页。

## 开始使用

1. 打开「更多操作」，添加网站、文件夹或小组件。
2. 拖动卡片调整位置；把相关网站拖进同一个文件夹。
3. 右键点击卡片，编辑内容、调整大小或删除。
4. 点击设置按钮，更换主题、搜索引擎、背景与动态效果。

## 数据和隐私

书签、布局、偏好和背景图片默认保存在当前设备。Oh My Tab 不包含广告或行为分析。

搜索联想、第三方网站图标、浏览器书签导入、WebDAV，以及天气、GitHub、RSS 组件的联网读取都需要你主动开启或操作。天气不调用设备定位，联网组件不会在添加或预览时自动请求。ZIP 备份未加密，请像保管普通备份文件一样妥善保存。权限用途和联网范围见[隐私政策](https://ohmytab.vercel.app/privacy)。

<details>
<summary>开发与贡献</summary>

需要 Node.js 22.12 或更高版本。

```bash
npm ci
npm run dev
```

提交修改前可以运行：

```bash
npm run check
npm run build
npm test
npm run test:extension
```

开发、测试和发布资料见[项目文档](docs/README.md)。

</details>

## 致谢

界面基于 React、shadcn/ui 和 Tailwind CSS，拖拽使用 dnd kit，动画使用 GSAP，图标使用 Phosphor Icons。
