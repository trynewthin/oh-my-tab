import type { SiteResources } from "../types"

const resources: SiteResources = {
  language: {
    switchLabel: "切换语言",
  },
  header: {
    brandLabel: "Oh My Tab 首页",
    navLabel: "主导航",
    features: "功能",
    showcase: "界面",
    privacy: "隐私",
    download: "下载",
    chromeStore: "Chrome 商店",
    githubLabel: "访问 GitHub",
  },
  footer: {
    invitation: "随你怎么摆。",
    install: "开始布置",
    installLabel: "前往 Chrome 商店安装 Oh My Tab",
    stageLabel: "Oh My Tab · 查看开源项目",
  },
  landing: {
    hero: {
      titleLead: "打开新的一页，",
      titleTail: "回到自己的节奏。",
      chromeStore: "前往 Chrome 商店",
      release: "下载最新版本",
      themeLabel: "预览主题",
      themeDark: "深色",
      themeLight: "浅色",
      previewAltDark: "Oh My Tab 深色主题，包含书签文件夹、日历和像素组件",
      previewAltLight: "Oh My Tab 浅色主题，包含书签文件夹、日历和像素组件",
    },
    features: {
      heading: "凑近一点看。",
      details: {
        colors: {
          title: "颜色，藏在细节里。",
          text: "柔和底色、细密点阵，给每组收藏一点自己的辨识度。",
        },
        todos: {
          title: "把今天，轻轻勾掉。",
          text: "待办也有圆润的轮廓。完成一项，就留下一枚小小的对勾。",
        },
        calendar: {
          title: "日子有自己的颜色。",
          text: "月份、日期、今天的位置，安安静静地排好。",
        },
        plant: {
          title: "养朵花，画朵花。",
          text: "一盆像素植物，一张点阵画布。忙完了，也可以玩一会儿。",
        },
      },
    },
    showcase: {
      heading: "井井有条，也有一点可爱。",
      organize: {
        title: "常用网站，各有位置",
        text: "用文件夹收起一组站点，展开后依然可以直接浏览和打开。",
      },
      organizeAlt: "展开文件夹浏览常用网站的产品界面",
      widgets: {
        title: "每天，也留一点小爱好",
        text: "日历、待办、像素花盆和点阵画布，共享同一张自由画布。",
      },
      widgetsAlt: "日历、待办、像素花盆和点阵画布组件",
    },
  },
  privacy: {
    title: "隐私政策",
    intro:
      "Oh My Tab 不运营收集扩展数据的服务器，也不集成广告或分析追踪服务。这里说明哪些数据留在本地，以及你主动启用联网功能时会发生什么。",
    updatedLabel: "更新日期：2026 年 9 月 13 日",
    summaryLabel: "隐私摘要",
    summary: {
      local: {
        title: "默认留在本地",
        text: "书签、布局、设置和图片保存在当前设备。",
      },
      consent: {
        title: "联网需要主动开启",
        text: "联想、图标和 WebDAV 都由你选择并授权。",
      },
      revoke: {
        title: "随时可以停止",
        text: "你可以关闭服务、撤销权限或清除本地数据。",
      },
    },
    tocLabel: "隐私政策目录",
    sections: {
      "local-data": {
        title: "本地数据",
        paragraphs: [
          "网站标题和链接、文件夹、布局、搜索引擎、偏好、点阵图片与植物进度保存在 Chrome 本地存储；开发预览使用 IndexedDB。背景原图和图标缓存由同一存储层管理。",
          "点击工具栏快捷收藏时，扩展只读取当前标签页的标题和网址来填写收藏表单，不持续读取浏览历史。主动授权导入浏览器书签后，扩展读取书签标题、网址和文件夹结构，用于增量添加到首页；不会修改、删除或持续监听浏览器原有书签。",
          "书签导入、图片裁剪和点阵转换都在本地完成。背景图片按原始字节保存，只有在你主动使用 WebDAV 上传备份时才会发送到你指定的服务器。",
        ],
      },
      "network-services": {
        title: "搜索与可选联网服务",
        paragraphs: [
          "提交搜索时，关键词会发送给浏览器默认搜索服务，或你主动选择的搜索引擎，并遵循该服务的隐私政策。",
          "搜索联想默认关闭。启用并授权后，输入停顿 250 毫秒会把不超过 200 字的关键词发送给当前选择的 Google、Microsoft Bing、DuckDuckGo、Yahoo、Brave、Ecosia 或 Yandex 联想服务。浏览器默认、Startpage 和自定义引擎不请求在线联想。",
          "网站图标下载默认关闭。启用并授权后，缓存缺失或手动刷新时会把网站域名发送给 Favicon.im，失败时发送给 DuckDuckGo。请求不包含书签标题、完整网址路径或查询参数。",
          "这些请求使用 HTTPS，不携带 Cookie 或来源页地址；服务仍会获得 IP 地址和处理请求所需的网络信息，并可能按自身政策保留日志。",
        ],
      },
      webdav: {
        title: "可选 WebDAV 备份",
        paragraphs: [
          "你可以填写自己的 HTTPS WebDAV 目录和账户信息。点击连接、上传或下载时，扩展直接向所选服务器发送认证信息和相应请求，不经过开发者服务器。",
          "上传的 ZIP 包含网站标题与链接、布局、设置、点阵、植物进度、教程状态和原始背景图片。服务器地址和用户名保存在当前设备；密码只在本次设置面板打开期间保留于内存，不写入本地备份或同步文件。",
          "数据不会定时自动上传。覆盖云端备份与恢复本机数据都需要确认；删除连接只清除本机连接信息，不删除本地内容或服务器上的备份。",
        ],
      },
      control: {
        title: "控制、保留与删除",
        paragraphs: [
          "你可以在设置中关闭联网服务，并在浏览器扩展管理中撤销网站或书签权限。关闭后不会再发起新的服务请求；已经发送的数据无法撤回，已有图标缓存会继续保留，直到你主动清除。",
          "书签可以在主页删除。设置中的“缓存 → 管理”可以查看分类用量并清除所选数据；最近一天写入的闲置图片暂不清除。卸载扩展会删除扩展本地存储，已经导出的 ZIP 和 WebDAV 备份需要在对应位置单独删除。",
          "ZIP 备份未加密，包含网站链接、设置和原始背景图片，请只交给可信接收者。隐私授权和 WebDAV 连接信息不会随备份导入。旧版 localStorage 数据只作为迁移回退副本保留，并在卸载扩展时一并删除。",
        ],
      },
      "use-and-sharing": {
        title: "数据用途与共享限制",
        paragraphs: [
          "用户数据只用于提供上述功能，不出售，不用于广告、信用评估或与产品功能无关的目的。Oh My Tab 对用户数据的使用遵守 Chrome Web Store 用户数据政策，包括 Limited Use 限制。",
          "使用第三方搜索、图标或 WebDAV 服务时，数据由你选择的服务接收，其保留与删除方式由相应服务的政策决定。开发者无法代第三方承诺日志保留期限。",
        ],
      },
      contact: {
        title: "联系与政策更新",
        paragraphs: [
          "支持邮箱为 an172048@outlook.com。你也可以通过 GitHub Issues 提交问题；请勿在公开反馈中附带私人书签、账户信息或其他敏感数据。",
          "数据处理方式发生变化时，我们会更新本政策，并在法律或平台规则要求时重新告知和征求授权。",
        ],
      },
    },
  },
}

export default resources
