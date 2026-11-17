const core = {
  app: {
    newTabTitle: "Oh My Tab",
    popupTitle: "快速添加 · Oh My Tab",
  },
  startup: {
    newTabError: "启动失败。请保留以下错误信息，不要卸载扩展或清空数据。",
    popupError: "启动失败。请保留以下错误信息，不要卸载扩展或清空数据。",
  },
  language: {
    label: "语言",
    followSystem: "跟随系统",
    chinese: "简体中文",
    english: "English",
  },
  storage: {
    chromeLabel: "Chrome 本地存储",
    indexedDbLabel: "IndexedDB 本地存储",
    blocked: "请关闭其他旧版页面后重试",
    staleWrite: "数据已在其他页面更新，请重新操作",
    readOnly: "数据来自更新版本，已保护原值；请更新应用后再编辑",
    legacyChanged:
      "旧版页面在迁移后修改了数据，两份数据均已保留；请关闭旧版页面并处理存储冲突后重试",
    saveFailed: "保存失败",
    persistFailed: "数据保存失败，请检查浏览器存储空间后重试",
    permission: "请重新加载扩展以启用 Chrome 存储权限",
    missingAsset: "图片资源缺失，请重新导入备份或上传图片",
    invalidImage: "图片数据无效",
  },
  hydrate: {
    readFailed: "本地数据读取失败",
    updateFailed: "读取更新失败，请重新打开页面",
  },
}

export default core
