type AppPlatform = "chromium-extension" | "firefox-extension" | "web"

type ExtensionChrome = {
  runtime?: {
    getManifest?: () => { action?: { default_popup?: string } }
  }
}

export const appEnvironment = {
  get platform(): AppPlatform {
    switch (globalThis.location?.protocol) {
      case "chrome-extension:":
        return "chromium-extension"
      case "moz-extension:":
        return "firefox-extension"
      default:
        return "web"
    }
  },
  get hasToolbarPopup(): boolean {
    if (appEnvironment.platform === "web") return false
    const { chrome } = globalThis as typeof globalThis & {
      chrome?: ExtensionChrome
    }
    return Boolean(chrome?.runtime?.getManifest?.()?.action?.default_popup)
  },
}
