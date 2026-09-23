const shell = {
  common: {
    close: "关闭",
    notifications: "操作通知",
    dismissNotification: "关闭通知",
  },
  home: {
    gridScroll: "滚动标签网格",
    quickBar: "顶栏",
    searchInput: "搜索",
    searchPlaceholder: "搜索点什么…",
    searchButton: "搜索",
    searchButtonTitle: "在新标签页搜索",
    searchButtonTitleCurrentTab: "在当前标签页搜索",
    openedInNewTab: "已在新标签页打开",
    suggestions: "搜索建议",
    matchedBookmarks: "匹配书签",
    conversationInput: "对话输入",
    searchFailed: "搜索失败，请重试",
    previewBrowserDefault:
      "开发预览：已选择浏览器默认。实际搜索请在扩展中测试。",
  },
  engineSelect: {
    triggerLabel: "搜索引擎：{{name}}",
    menuLabel: "选择搜索引擎",
    browserDefault: "浏览器默认",
    custom: "自定义搜索引擎",
  },
  moreActions: {
    trigger: "更多操作",
    menuLabel: "更多操作菜单",
    themeGroup: "深浅色模式",
    themeLight: "浅色",
    themeDark: "深色",
    themeSystem: "系统",
    themeSystemAria: "跟随系统",
    addTab: "添加标签",
    addFolder: "添加文件夹",
    addComponent: "添加组件",
    tidy: "一键整理",
    tidyDone: "已整理网格",
    undo: "撤销",
    batch: "批量操作",
    batchOn: "已开启",
  },
  settingsButton: {
    open: "打开设置",
    title: "设置",
  },
  dotMatrix: {
    time: "时间 {{time}}",
    blank: "空白点阵",
    breathing: "呼吸海浪点阵",
    pet: "颜文字宠物 {{name}}",
  },
  colorPicker: {
    select: "选择{{label}}",
    presets: "{{label}}预设",
    hexValue: "{{label}}十六进制值",
    colors: {
      blue: "蓝色",
      purple: "紫色",
      green: "绿色",
      cyan: "青色",
      amber: "琥珀",
      coral: "珊瑚",
      pink: "粉色",
      gray: "灰色",
    },
  },
  onboarding: {
    skip: "跳过教程",
    previous: "上一步",
    next: "下一步",
    start: "开始使用",
    consentPrompt: "选择需要的联网服务后继续教程。",
    decline: "不同意",
    agree: "我同意",
    consentDenied: "未获得网站访问授权，联网服务保持关闭",
    consentFailed: "权限更新失败，请重试",
    steps: {
      welcome: {
        title: "欢迎使用 Oh My Tab",
      },
      search: {
        title: "搜索与打开结果",
        text: "输入关键词后显示本地匹配书签。可在关于中授权启用搜索联想，启用后输入关键词会发送给所选引擎的联想服务。默认搜索使用浏览器设置，也可自行选择搜索引擎。点击书签直接打开网站，点击联想词使用当前搜索引擎搜索。直接按 Enter 或点击向上箭头搜索输入内容，提交后自动清空。",
      },
      moreActions: {
        title: "四宫格：更多操作",
        text: "点击搜索框左侧的四宫格，展开添加标签、添加文件夹、添加组件、批量操作和深浅色模式。旁边的齿轮可直接打开设置。",
      },
      components: {
        title: "组件：预览与添加",
        text: "在更多菜单中选择「添加组件」，或右键网格空白处打开组件窗口。选择组件预览和大小，再次点击确认添加到主页，随后可通过右键「编辑」修改内容。",
      },
      batch: {
        title: "批量操作：成组与删除",
        text: "选择「批量操作」后，点击组件进行多选；选中项会恢复动态效果并显示光晕。选中一个文件夹和若干标签时会移入该文件夹；仅标签或多个文件夹时会组成新文件夹。包含其他组件时不可成组。点击「完成」退出多选。",
      },
      theme: {
        title: "深浅色模式",
        text: "在更多菜单中点击「深浅色模式」，依次切换浅色、深色和跟随系统。当前模式显示在菜单右侧，选择会自动保存。",
      },
      engine: {
        title: "选择搜索引擎",
        text: "点击搜索引擎名称或图标展开列表，选择后会用于后续搜索。底部的「自定义搜索引擎」可进入管理页面，添加、编辑或移除引擎。",
      },
      gridDrag: {
        title: "网格：拖拽与布局恢复",
        text: "拖动组件调整位置，空位会保留。宽屏最多显示五列；不同列数分别保存排版，缩放窗口后切回来会恢复。将标签拖到文件夹上，重合足够后文件夹会发光，标签颜色也会靠近文件夹，松手即可放入。展开文件夹后也可将标签拖出。",
      },
      gridManage: {
        title: "右键管理与删除撤销",
        text: "右键可编辑组件内容；标签和文件夹还支持调整尺寸、随机颜色和切换动态效果，标签可刷新图标。删除需要再次确认；删除后顶部通知提供「撤销」，可恢复标签或整个文件夹，批量删除也能一次恢复。",
      },
      settings: {
        title: "设置：按分类管理",
        text: "点击齿轮进入设置，左侧按常规、个性化和关于分类管理各项功能。设置会自动保存，点击「关闭」回到主页。",
      },
      dotMatrix: {
        title: "主页：电子点阵",
        text: "选择显示或隐藏点阵，并切换时间、字符、宠物或呼吸模式。字符支持英文、数字和符号，超长内容自动滚动；宠物提供各有动作的颜文字角色。点阵颗粒大小固定，列数随窗口宽度调整。",
      },
      personalization: {
        title: "个性化：主题色与燃烧",
        text: "主题色统一应用于点阵、通知和多选栏。点击色块选择预设色、自定义颜色或输入十六进制值。「燃烧幅度」调整全局强度，「过渡效果」控制入场和退出动画，页面背景可实时预览。",
      },
      importBookmarks: {
        title: "常规：导入浏览器书签",
        text: "点击「从浏览器书签导入」旁的「导入」，首次使用时允许书签访问，即可直接读取当前浏览器书签。新书签会增量添加，重复网址自动跳过，同名文件夹合并；多级目录以路径名称保留。导入结果会在顶部通知中显示。",
      },
      dataManagement: {
        title: "数据管理：备份与恢复",
        text: "在「常规 → 数据」点击「备份」保存包含原图的备份。点击「恢复」选择 ZIP 或旧版文本文件，校验后确认覆盖本机数据。将多端同步方案选为 WebDAV，点击「WebDAV」的「管理」填写自己的目录，可在多台设备间手动上传、下载备份；恢复前建议先备份本机数据。",
      },
      quickSave: {
        title: "快捷收藏当前网页",
        text: "在浏览器工具栏固定 Oh My Tab 扩展。浏览其他网页时点击扩展图标，可读取当前页面标题和链接，快速添加到主页。",
      },
      replay: {
        title: "随时重看教程",
        text: "完成或跳过后，教程不会再次自动弹出。需要重看时，打开「设置 → 常规」，点击「重新开始教程」。",
      },
    },
  },
  popup: {
    extensionOnly: "请从浏览器扩展图标打开",
    unsupported: "当前标签不支持",
    readCurrentPageFailed: "读取当前页面失败",
    nameLabel: "名称",
    urlLabel: "链接",
    saveFailed: "保存失败，请重试",
    success: "成功",
    loading: "读取中…",
    updating: "更新中…",
    adding: "添加中…",
    update: "更新",
    add: "添加",
  },
}

export default shell
