const core = {
  app: {
    newTabTitle: "Oh My Tab",
    popupTitle: "Quick Add · Oh My Tab",
  },
  startup: {
    newTabError:
      "Startup failed. Keep the error details below; do not uninstall the extension or clear its data.",
    popupError:
      "Startup failed. Keep the error details below; do not uninstall the extension or clear its data.",
  },
  language: {
    label: "Language",
    followSystem: "Follow system",
    chinese: "Chinese (Simplified)",
    english: "English",
  },
  storage: {
    chromeLabel: "Chrome local storage",
    indexedDbLabel: "IndexedDB local storage",
    blocked: "Close other pages running an older version and try again",
    staleWrite: "Data was updated in another page. Please try again.",
    saveFailed: "Save failed",
    persistFailed:
      "Failed to save data. Check the browser storage space and try again.",
    permission: "Reload the extension to enable Chrome storage access",
    missingAsset: "Image asset missing. Re-import a backup or upload it again.",
    invalidImage: "Invalid image data",
  },
  hydrate: {
    readFailed: "Failed to read local data",
    updateFailed: "Failed to read updates. Reopen the page.",
  },
}

export default core
