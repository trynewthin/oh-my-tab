const shell = {
  common: {
    close: "Close",
    notifications: "Notifications",
    dismissNotification: "Dismiss notification",
  },
  home: {
    gridScroll: "Scroll tab grid",
    searchInput: "Search",
    searchPlaceholder: "Search for something…",
    searchButton: "Search",
    searchButtonTitle: "Search in a new tab",
    searchButtonTitleCurrentTab: "Search in the current tab",
    openedInNewTab: "Opened in a new tab",
    suggestions: "Search suggestions",
    matchedBookmarks: "Matching bookmarks",
    conversationInput: "Conversation input",
    searchFailed: "Search failed. Please try again.",
    previewBrowserDefault:
      "Dev preview: browser search selected. Test real search in the extension.",
  },
  engineSelect: {
    triggerLabel: "Search engine: {{name}}",
    menuLabel: "Choose a search engine",
    browserDefault: "Browser default",
    custom: "Custom search engines",
  },
  moreActions: {
    trigger: "More actions",
    menuLabel: "More actions menu",
    themeGroup: "Color mode",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    themeSystemAria: "Follow system",
    addTab: "Add tab",
    addFolder: "Add folder",
    addComponent: "Add component",
    tidy: "Tidy up",
    tidyDone: "Grid tidied",
    undo: "Undo",
    batch: "Batch select",
    batchOn: "On",
  },
  settingsButton: {
    open: "Open settings",
    title: "Settings",
  },
  dotMatrix: {
    time: "Time {{time}}",
    blank: "Blank matrix",
    breathing: "Breathing wave matrix",
    pet: "Emoticon pet {{name}}",
  },
  colorPicker: {
    select: "Choose {{label}}",
    presets: "{{label}} presets",
    hexValue: "{{label}} hex value",
    colors: {
      blue: "Blue",
      purple: "Purple",
      green: "Green",
      cyan: "Cyan",
      amber: "Amber",
      coral: "Coral",
      pink: "Pink",
      gray: "Gray",
    },
  },
  onboarding: {
    skip: "Skip tour",
    previous: "Previous",
    next: "Next",
    start: "Get started",
    consentPrompt:
      "Choose the online services you want, then continue the tour.",
    decline: "Decline",
    agree: "Agree",
    consentDenied: "Website access was not granted; online services stay off.",
    consentFailed: "Could not update permissions. Please try again.",
    steps: {
      welcome: {
        title: "Welcome to Oh My Tab",
      },
      search: {
        title: "Search and open results",
        text: "Type keywords to see matching local bookmarks. You can grant search suggestions in About; once enabled, your keywords are sent to the selected engine's suggestion service. By default search uses your browser setting, but you can pick an engine yourself. Click a bookmark to open the site, or click a suggestion to search it with the current engine. Press Enter or click the up arrow to search what you typed; the box clears after submitting.",
      },
      moreActions: {
        title: "The four-square button: more actions",
        text: "Click the four-square button at the left of the search box to reveal add tab, add folder, add component, batch select, and color mode. The gear beside it opens settings directly.",
      },
      components: {
        title: "Components: preview and add",
        text: "Choose Add component in the more actions menu, or right-click empty grid space to open the component window. Pick a preview and size, then click again to confirm adding it to the home page; afterwards you can edit it via right-click Edit.",
      },
      batch: {
        title: "Batch select: group and delete",
        text: "Choose Batch select, then click components to multi-select them; selected items restore their dynamic effects and show a glow. Selecting one folder with several tabs moves them into that folder; tabs alone or several folders form a new folder. Grouping is unavailable when other components are included. Click Done to leave multi-select.",
      },
      theme: {
        title: "Color mode",
        text: "In the more actions menu click Color mode to cycle through light, dark, and follow system. The current mode shows at the right of the menu and your choice is saved automatically.",
      },
      engine: {
        title: "Choosing a search engine",
        text: "Click the engine name or icon to expand the list; the choice is used for later searches. Custom search engines at the bottom opens the management page where you can add, edit, or remove engines.",
      },
      gridDrag: {
        title: "Grid: dragging and layout restore",
        text: "Drag components to rearrange them; gaps are preserved. Wide screens show up to five columns, and each column count keeps its own layout, so resizing and returning restores it. Drag a tab onto a folder; once they overlap enough the folder glows and the tab color shifts toward it, then release to drop it in. You can also drag tabs out of an expanded folder.",
      },
      gridManage: {
        title: "Right-click management and delete undo",
        text: "Right-click to edit a component's content; tabs and folders also support resizing, a random color, and toggling dynamic effects, and tabs can refresh their icon. Deleting requires a second confirmation; afterwards a notification at the top offers Undo to restore the tab or the whole folder, and batch deletes can be restored in one step too.",
      },
      settings: {
        title: "Settings: organized by category",
        text: "Click the gear to open settings; the left side groups features under General, Personalization, and About. Settings save automatically; click Close to return home.",
      },
      dotMatrix: {
        title: "Home: dot matrix",
        text: "Show or hide the matrix, and switch between time, characters, pets, or breathing mode. Characters support English letters, digits, and symbols, with long content scrolling automatically; pets offer emoticon characters each with their own motions. Dot size is fixed while the column count follows the window width.",
      },
      personalization: {
        title: "Personalization: theme color and burn",
        text: "The theme color applies consistently to the matrix, notifications, and the selection bar. Click a swatch to choose a preset, a custom color, or enter a hex value. Burn amount adjusts the global intensity, transition controls entrance and exit animations, and the page background previews live.",
      },
      importBookmarks: {
        title: "General: import browser bookmarks",
        text: "Click Import beside Import from browser bookmarks and allow bookmark access on first use to read your current browser bookmarks directly. New bookmarks are added incrementally, duplicate URLs are skipped automatically, folders with the same name are merged, and nested directories keep their path names. The result appears in a notification at the top.",
      },
      dataManagement: {
        title: "Data management: backup and restore",
        text: "In General → Data click Backup to save a backup that includes original images. Click Restore to choose a ZIP or a legacy text file, then confirm overwriting local data after validation. Set the multi-device sync option to WebDAV and fill in your own directory under Manage for WebDAV to upload and download backups manually across devices; backing up local data first is recommended before restoring.",
      },
      quickSave: {
        title: "Quickly bookmark the current page",
        text: "Pin the Oh My Tab extension to the browser toolbar. While browsing another page, click the extension icon to read the current page's title and link and quickly add it to the home page.",
      },
      replay: {
        title: "Replay the tour anytime",
        text: "After you finish or skip it, the tour will not pop up again automatically. To replay it, open Settings → General and click Restart tour.",
      },
    },
  },
  popup: {
    extensionOnly: "Open this from the browser extension icon",
    unsupported: "This tab is not supported",
    readCurrentPageFailed: "Could not read the current page",
    nameLabel: "Name",
    urlLabel: "URL",
    saveFailed: "Could not save. Please try again.",
    success: "Saved",
    loading: "Loading…",
    updating: "Updating…",
    adding: "Adding…",
    update: "Update",
    add: "Add",
  },
}

export default shell
