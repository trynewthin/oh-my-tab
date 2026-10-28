# Chrome Web Store 发布

[返回文档中心](../README.md)

审核状态以 Chrome Web Store 开发者后台为准，版本更新内容以对应 GitHub Release 为准。

## 材料位置

- `docs/store-assets/description.txt`：完整商品说明，唯一维护位置。
- `docs/store-assets/`：五张 1280×800 功能截图，以及 440×280、1400×560 两张宣传图。
- `docs/brand/oh-my-tab-icon.png`：扩展图标源文件。
- `website/src/i18n/locales/{zh-CN,en}.ts`：隐私政策正文，发布到 https://ohmytab.vercel.app/privacy。
- `public/manifest.json`：清单与权限的唯一来源。
- `packages/`：待上传的 Chrome Store ZIP，已忽略；`scripts/release/verify-packages.py` 校验包结构与密钥残留。
- `materials/`：按平台分类的本地准备区，已忽略；只有确认随仓库维护的成品才复制到 `docs/store-assets/`。

## 单一用途

提供可自定义的新标签页，帮助用户整理和访问常用网站，并从新标签页发起搜索。书签、布局、顶栏入口与操作配置、偏好（含标签材质与效果蔓延范围）和图片保存在本地；用户可以导出备份，或主动通过自选 HTTPS WebDAV 服务手动传输。

## 权限说明

- `activeTab`：用户点击工具栏快捷收藏时读取当前标签页标题和网址，用于填写收藏表单。
- `search`：用户提交搜索时通过 Chrome Search API 使用浏览器默认搜索服务。
- `storage` / `unlimitedStorage`：在本地保存书签、布局、顶栏配置、个性化、原图、缓存和设备连接设置；原图不受默认配额限制。
- `bookmarks`（可选）：用户主动授权导入后读取书签标题、网址和目录结构，不修改浏览器原有书签。
- HTTPS 主机（可选）：访问用户选择的 WebDAV、搜索联想、图标服务及手动触发的天气和 RSS；运行时只申请当前功能所需的具体主机。

隐私后台须如实申报本地存储的网站标题和网址、搜索输入向所选服务的传输、域名向图标服务的传输、手动天气坐标与完整订阅源 URL 的传输，以及用户指定 WebDAV 服务接收的凭据和完整备份；不得声明“不处理用户数据”。产品不出售数据，不将数据用于单一用途之外的目的，也不执行远程代码。

## 生成商店图片

1. 启动开发页面：`npm run dev -- --host 127.0.0.1`。
2. 在另一个终端运行 `npm run store-assets`。
3. 脚本校验五张功能图为 1280×800 RGB PNG，宣传图为 440×280 和 1400×560。
4. 人工确认截图来自当前界面和公开示例数据，没有测试标记或个人信息。

## 送审前检查

1. 运行 `npm run check`、`npm run build`、`npm test` 和 `npm run test:extension`。
2. 确认扩展 ZIP 根目录直接包含 `manifest.json`，包内无 `.pem` 或 `.key`。
3. 确认 `https://ohmytab.vercel.app/privacy` 已发布当前政策，后台数据声明与之一致。
4. 上传商品说明、五张功能截图和两张宣传图。
5. 逐条对照 `public/manifest.json` 填写权限理由，不沿用旧版本的权限列表。
6. 确认 `src/content/current-release.yaml` 的版本号与 `package.json`、`public/manifest.json` 一致。
7. 在后台完成账号验证、两步验证和隐私声明后提交审核。
