import { openStripTabSettings } from "../helpers/settings"
import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  })
})

test("apps are managed after search in settings instead of the home menus", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "应用", exact: true })
  ).toHaveCount(0)
  await page.keyboard.press("Escape")
  await page
    .locator("[data-grid-scroll]")
    .click({ button: "right", position: { x: 4, y: 4 } })
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await expect(
    menu.getByRole("menuitem", { name: "应用", exact: true })
  ).toHaveCount(0)
  await menu.getByRole("menuitem", { name: "打开设置", exact: true }).click()

  const settings = page.getByRole("dialog", { name: "设置", exact: true })
  const general = settings.getByRole("group", { name: "常规", exact: true })
  await expect(general.getByRole("button")).toHaveText(["基础", "搜索", "应用"])
  await general.getByRole("button", { name: "应用", exact: true }).click()
  await expect(settings.getByText("便签", { exact: true })).toHaveCount(0)
  await settings.getByRole("button", { name: "打开组件", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "组件", exact: true })
  ).toBeVisible()
})

test("Settings appearance overrides the settings window and can resume following global styles", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const settings = page.getByRole("dialog", { name: "设置", exact: true })
  const globalSettings = settings
    .getByRole("group", { name: "个性化", exact: true })
    .getByRole("button", { name: "全局样式", exact: true })
  const localSettings = settings.getByRole("button", {
    name: "设置样式",
    exact: true,
  })
  const globalChoices = [
    ["圆角", "小"],
    ["边框", "淡"],
    ["阴影", "强"],
  ] as const
  await globalSettings.click()
  for (const [field, option] of globalChoices) {
    await settings
      .getByRole("tablist", { name: field, exact: true })
      .getByRole("tab", { name: option, exact: true })
      .click()
  }

  await localSettings.click()
  const preview = settings
    .getByRole("tabpanel", { name: "控件外观预览", exact: true })
    .locator("[data-appearance-preview]")
  await expect(preview).toBeVisible()
  const basicStyles = settings.getByRole("region", {
    name: "基础样式",
    exact: true,
  })
  const radius = basicStyles.getByRole("tablist", { name: "圆角", exact: true })
  const followGlobal = basicStyles.getByRole("button", {
    name: "跟随全局",
    exact: true,
  })
  await expect(followGlobal).toBeDisabled()
  await expect(radius.getByRole("tab")).toHaveText(["无", "小", "中", "大"])
  for (const [field, option] of globalChoices) {
    await expect(
      basicStyles
        .getByRole("tablist", { name: field, exact: true })
        .getByRole("tab", { name: option, exact: true })
    ).toHaveAttribute("aria-selected", "true")
  }

  await radius.getByRole("tab", { name: "无", exact: true }).click()
  await expect(settings).toHaveAttribute("data-ui-radius", "none")
  await expect(settings).toHaveCSS("border-radius", "0px")
  await expect(preview).toHaveCSS("border-radius", "0px")
  await expect(page.locator("html")).toHaveAttribute("data-ui-radius", "small")
  await basicStyles
    .getByRole("tablist", { name: "边框", exact: true })
    .getByRole("tab", { name: "强", exact: true })
    .click()
  await expect(settings).toHaveAttribute("data-ui-border", "strong")
  await basicStyles
    .getByRole("tablist", { name: "阴影", exact: true })
    .getByRole("tab", { name: "无", exact: true })
    .click()
  await expect(settings).toHaveAttribute("data-ui-shadow", "none")
  await followGlobal.click()
  await expect(settings).not.toHaveAttribute("data-ui-radius")
  await expect(settings).not.toHaveAttribute("data-ui-border")
  await expect(settings).not.toHaveAttribute("data-ui-shadow")
  await expect(followGlobal).toBeDisabled()
  for (const [field, option] of globalChoices) {
    await expect(
      basicStyles
        .getByRole("tablist", { name: field, exact: true })
        .getByRole("tab", { name: option, exact: true })
    ).toHaveAttribute("aria-selected", "true")
  }

  await globalSettings.click()
  await settings
    .getByRole("tablist", { name: "圆角", exact: true })
    .getByRole("tab", { name: "大", exact: true })
    .click()
  await localSettings.click()
  await expect(
    radius.getByRole("tab", { name: "大", exact: true })
  ).toHaveAttribute("aria-selected", "true")
})

test("Settings applies materials and lets the window background show through the glass side panel", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const settings = page.getByRole("dialog", { name: "设置", exact: true })
  await settings.getByRole("button", { name: "设置样式", exact: true }).click()
  const materials = settings.getByRole("region", { name: "材质", exact: true })
  const select = (name: string) =>
    materials.getByRole("combobox", { name, exact: true })
  const options = [
    ["背景", "像素火焰"],
    ["侧边面板", "折光玻璃"],
    ["控件", "浮游点阵"],
  ] as const
  for (const [field, option] of options) {
    await select(field).click()
    await page.getByRole("option", { name: option, exact: true }).click()
    await expect(select(field)).toHaveText(option)
  }
  await expect(
    settings.locator(
      ':scope > div > [data-settings-material-surface="background"]'
    )
  ).toHaveAttribute("data-material", "burning")
  const sidebar = settings.locator("aside")
  const glassPanel = sidebar.locator(
    '[data-settings-material-surface="sidebar"] [data-effect-style="liquid-glass"]'
  )
  const glassPreview = settings.locator(
    '[data-appearance-preview] [data-settings-material-surface="sidebar"]'
  )
  await expect(sidebar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
  await expect(glassPanel).not.toHaveCSS("backdrop-filter", "none")
  await expect(glassPreview.locator("..")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)"
  )
  await expect(
    glassPreview.locator('[data-effect-style="liquid-glass"]')
  ).not.toHaveCSS("backdrop-filter", "none")
  await expect(select("控件")).not.toHaveCSS("background-image", "none")
  await select("侧边面板").click()
  await page.getByRole("option", { name: "无", exact: true }).click()
  await expect(glassPanel).toHaveCount(0)
  await expect(sidebar).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
  await select("控件").click()
  await page.getByRole("option", { name: "无", exact: true }).click()
  await expect(select("控件")).toHaveCSS("background-image", "none")
})

test("Settings opens a live editor for an assigned material and saves its settings", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const settings = page.getByRole("dialog", { name: "设置", exact: true })
  await settings.getByRole("button", { name: "设置样式", exact: true }).click()
  for (const placement of ["背景", "侧边面板", "控件"]) {
    await expect(
      settings.getByRole("button", {
        name: `配置${placement}材质`,
        exact: true,
      })
    ).toBeDisabled()
  }
  const control = settings.getByRole("combobox", { name: "控件", exact: true })
  const edit = settings.getByRole("button", {
    name: "配置控件材质",
    exact: true,
  })
  const dialog = page.getByRole("dialog", {
    name: "控件 · 像素火焰",
    exact: true,
  })
  const strength = dialog.getByRole("slider", { name: "纹理强度", exact: true })
  const sample = dialog.locator("[data-material-control-preview]")

  await control.click()
  await page.getByRole("option", { name: "像素火焰", exact: true }).click()
  await expect(edit).toBeEnabled()
  await expect(control).not.toHaveCSS("background-image", "none")
  await edit.click()
  await expect(sample).not.toHaveCSS("background-image", "none")
  await strength.press("Home")
  await expect(sample).toHaveCSS("background-image", "none")
  await dialog.getByRole("button", { name: "取消", exact: true }).click()
  await expect(control).not.toHaveCSS("background-image", "none")

  await edit.click()
  await expect(strength).toHaveValue("1")
  await strength.press("Home")
  await dialog.getByRole("button", { name: "保存", exact: true }).click()
  await expect(control).toHaveCSS("background-image", "none")
  await control.click()
  await page.getByRole("option", { name: "无", exact: true }).click()
  await expect(edit).toBeDisabled()
})

test("Settings previews the background mask before saving it", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const settings = page.getByRole("dialog", { name: "设置", exact: true })
  await settings.getByRole("button", { name: "设置样式", exact: true }).click()
  const edit = settings.getByRole("button", { name: "背景蒙版", exact: true })
  const background = settings.getByRole("combobox", {
    name: "背景",
    exact: true,
  })
  const windowMask = page.locator(
    '[data-app-window="settings"] > div > [data-settings-material-surface="background"] [data-settings-background-mask]'
  )
  const dialog = page.getByRole("dialog", { name: "背景蒙版", exact: true })
  const strength = dialog.getByRole("slider", { name: "蒙版强度" })
  const blur = dialog.getByRole("slider", { name: "蒙版模糊" })

  await expect(edit).toBeDisabled()
  await background.click()
  await page.getByRole("option", { name: "费尔岛针织", exact: true }).click()
  await expect(windowMask).toHaveAttribute("style", /60%, transparent/)
  await edit.click()
  await strength.press("Home")
  await blur.press("End")
  const draftMask = dialog.locator("[data-settings-background-mask]")
  await expect(draftMask).toHaveAttribute("style", / 0%, transparent/)
  await expect(draftMask).toHaveCSS("backdrop-filter", "blur(32px)")
  await expect(windowMask).toHaveAttribute("style", /60%, transparent/)
  await dialog.getByRole("button", { name: "取消", exact: true }).click()

  await edit.click()
  await expect(strength).toHaveValue("60")
  await expect(blur).toHaveValue("0")
  await blur.press("End")
  await dialog.getByRole("button", { name: "保存", exact: true }).click()
  await expect(windowMask).toHaveCSS("backdrop-filter", "blur(32px)")
  await background.click()
  await page.getByRole("option", { name: "无", exact: true }).click()
  await expect(edit).toBeDisabled()
  await expect(windowMask).toHaveCount(0)
})

test("custom search engines validate URLs and persist selection", async ({
  page,
}) => {
  await page.goto("/#/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "搜索", exact: true }).click()
  await expect(
    dialog.getByRole("heading", { name: "搜索", exact: true })
  ).toBeVisible()
  const openInNewTab = dialog.getByRole("switch", {
    name: "搜索时跳转到新标签",
    exact: true,
  })
  await expect(openInNewTab).toBeChecked()
  await openInNewTab.uncheck()
  await dialog.getByRole("button", { name: "添加", exact: true }).click()
  const add = page.getByRole("dialog", { name: "添加搜索引擎", exact: true })
  await add.getByLabel("名称", { exact: true }).fill("Example Search")
  await add
    .getByLabel("搜索地址", { exact: true })
    .fill("javascript:alert('{query}')")
  await add.getByRole("button", { name: "保存", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await add
    .getByLabel("搜索地址", { exact: true })
    .fill("http://127.0.0.1:4173/search?q={query}")
  await add.getByRole("button", { name: "保存", exact: true }).click()
  await dialog
    .getByRole("button", { name: "使用 Example Search", exact: true })
    .click()
  await dialog.getByRole("button", { name: "关闭", exact: true }).click()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        selectedId: string
        openInNewTab: boolean
        engines: { id: string; name: string }[]
      }>(page, "omt.search-engines")
      const engine = state.engines.find(
        (item) => item.name === "Example Search"
      )
      return {
        selected: engine?.id === state.selectedId,
        openInNewTab: state.openInNewTab,
      }
    })
    .toEqual({ selected: true, openInNewTab: false })
  await page.reload()
  await expect(
    page.getByRole("button", { name: "搜索引擎：Example Search", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await expect(openInNewTab).not.toBeChecked()
  await dialog.getByRole("button", { name: "关闭", exact: true }).click()
  const input = page.getByRole("combobox", { name: "对话输入" })
  await input.fill("same tab")
  await input.press("Enter")
  await page.waitForURL("**/search?q=same%20tab")
})

test("personalization persists theme color and home settings filter unsupported text", async ({
  page,
}) => {
  await page.goto("/#/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "主页", exact: true }).click()
  await dialog
    .getByRole("group", { name: "个性化", exact: true })
    .getByRole("button", { name: "全局样式", exact: true })
    .click()
  const componentRadius = dialog.getByRole("slider", {
    name: "主页组件圆角",
    exact: true,
  })
  const background = dialog.getByRole("group", {
    name: "当前背景",
    exact: true,
  })
  await expect(componentRadius).toHaveCount(0)
  await expect(background).toHaveCount(0)
  await dialog.getByRole("button", { name: "选择主题色", exact: true }).click()
  await page.getByLabel("主题色", { exact: true }).fill("#a855f7")
  await page.keyboard.press("Escape")
  await dialog.getByRole("button", { name: "主页", exact: true }).click()
  await expect(componentRadius).toBeVisible()
  await background.getByRole("button", { name: "纯色", exact: true }).click()
  await expect(
    dialog.getByRole("group", { name: "背景色", exact: true })
  ).toBeVisible()
  await dialog.getByLabel("点阵显示内容").click()
  await page.getByRole("option", { name: "字符", exact: true }).click()
  await dialog.getByLabel("显示字符").fill("HELLO中文 2026")
  await expect(dialog.getByLabel("显示字符")).toHaveValue("HELLO 2026")
  await expect
    .poll(async () => {
      const state = await readStoredState<{ color: string; text: string }>(
        page,
        "omt.home-settings"
      )
      return { color: state.color, text: state.text }
    })
    .toEqual({ color: "#a855f7", text: "HELLO 2026" })
  await page.reload()
  await expect(
    page.getByRole("img", { name: "HELLO 2026", exact: true })
  ).toBeVisible()
  expect(
    (await readStoredState<{ color: string }>(page, "omt.home-settings")).color
  ).toBe("#a855f7")
})

test("personalization persists global burning controls", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "材质", exact: true }).click()
  const amplitude = dialog.getByRole("slider", { name: "燃烧幅度" })
  await expect(amplitude).toHaveValue("1")
  await amplitude.focus()
  await amplitude.press("End")
  await expect(amplitude).toHaveValue("2")
  const entrance = dialog.getByRole("switch", { name: "过渡效果" })
  await expect(entrance).not.toBeChecked()
  await entrance.click()
  await expect(entrance).toBeChecked()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        burningAmplitude: number
        transitionsEnabled: boolean
      }>(page, "omt.home-settings")
      return [state.burningAmplitude, state.transitionsEnabled]
    })
    .toEqual([2, true])
  await page.reload()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await dialog.getByRole("button", { name: "材质", exact: true }).click()
  await expect(amplitude).toHaveValue("2")
  await expect(entrance).toBeChecked()
})

test("top-bar preview reflects browser search without adding active search controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, { chrome: { search: { query: async () => {} } } })
  })
  await page.goto("/")
  const engineLabel = "搜索引擎：浏览器默认"
  await expect(
    page.getByRole("button", { name: engineLabel, exact: true })
  ).toBeVisible()
  const homeSearchRadius = await page
    .getByRole("button", { name: "搜索", exact: true })
    .evaluate((button) => getComputedStyle(button).borderRadius)
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "主页", exact: true }).click()

  const preview = dialog.locator("[data-traditional-preview]")
  await expect(preview.locator(`[aria-label="${engineLabel}"]`)).toBeVisible()
  const previewSearch = preview.locator('button[aria-label="搜索"]')
  await expect(previewSearch).toBeDisabled()
  await expect(previewSearch).toHaveCSS("border-radius", homeSearchRadius)
  await expect(preview.getByRole("combobox")).toHaveCount(0)
  await expect(preview.locator("[data-tour]")).toHaveCount(0)
})

test("both top-bar search forms follow control appearance in the page and preview", async ({
  page,
}) => {
  await page.goto("/")
  const homeSearch = page.locator("main [data-home-search-control]")
  const defaultShadow = await homeSearch.evaluate(
    (element) => getComputedStyle(element).boxShadow
  )
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog
    .getByRole("group", { name: "个性化", exact: true })
    .getByRole("button", { name: "全局样式", exact: true })
    .click()
  for (const name of ["圆角", "边框", "阴影"]) {
    await dialog
      .getByRole("tablist", { name, exact: true })
      .getByRole("tab", { name: "无", exact: true })
      .click()
  }
  await expect(homeSearch).not.toHaveCSS("box-shadow", defaultShadow)
  await dialog.getByRole("button", { name: "主页", exact: true }).click()
  const previewSearch = dialog.locator("[data-home-search-control]")
  const expectUnstyledSearch = async () => {
    for (const search of [homeSearch, previewSearch]) {
      await expect(search).toHaveCSS("border-radius", "0px")
      await expect(search).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)")
    }
  }
  await expectUnstyledSearch()
  await dialog.getByRole("combobox", { name: "搜索框样式" }).click()
  await page.getByRole("option", { name: "简约", exact: true }).click()
  await expect(previewSearch).toHaveAttribute("data-search-input-shell", "")
  await expectUnstyledSearch()

  const configuredShadow = await homeSearch.evaluate(
    (element) => getComputedStyle(element).boxShadow
  )
  for (const search of [
    page.locator("main [data-home-search-appearance]"),
    dialog.locator("[data-home-search-appearance]"),
  ]) {
    for (const label of ["更多操作", "打开设置"]) {
      const shortcut = search.locator(`button[aria-label="${label}"]`)
      await expect(shortcut).toHaveCSS("border-radius", "0px")
      await expect(shortcut).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)")
      await expect(shortcut).toHaveCSS("box-shadow", configuredShadow)
    }
  }
})

test("appearance previews use full-size samples and keep settings navigation available", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "文件夹", exact: true }).click()

  const preview = dialog.locator("[data-appearance-preview]")
  const folderSamples = preview.locator(
    '[data-appearance-preview-size="large"]'
  )
  await expect(folderSamples).toHaveCount(2)
  await expect(folderSamples.first()).toHaveCSS("width", "286px")
  await expect(folderSamples.first()).toHaveCSS("height", "286px")
  await expect(preview).toHaveCSS("overflow", "hidden")
  await expect(preview).toHaveAttribute("inert", "")
  await expect(preview.getByText("收藏", { exact: true })).toBeAttached()
  await expect(
    preview.getByRole("button", { name: "收藏", exact: true })
  ).toHaveCount(0)
  const folderShadow = dialog.getByRole("tablist", {
    name: "阴影",
    exact: true,
  })
  await folderShadow.getByRole("tab", { name: "无", exact: true }).click()
  await expect(preview.locator(".folder-glass").first()).toHaveCSS(
    "box-shadow",
    "none"
  )
  await folderShadow.getByRole("tab", { name: "大", exact: true }).click()
  await expect(preview.locator(".folder-glass").first()).not.toHaveCSS(
    "box-shadow",
    "none"
  )

  await openStripTabSettings(dialog)
  await expect(
    preview.locator('[data-appearance-preview-size="medium"]')
  ).toHaveCSS("height", "135px")
  await expect(
    preview.locator('[data-appearance-preview-size="small"]')
  ).toHaveCount(2)
  await dialog.getByRole("button", { name: "方形标签", exact: true }).click()
  await expect(preview.locator("[data-appearance-preview-size]")).toHaveCount(3)
  await expect(
    preview.locator('[data-appearance-preview-size="square-large"]')
  ).toHaveCSS("width", "286px")
  await expect(
    preview.locator('[data-appearance-preview-size="square-medium"]')
  ).toHaveCSS("width", "135px")
  await expect(
    preview.locator('[data-appearance-preview-size="square-small"]')
  ).toHaveCSS("width", "59.5px")
  await dialog.getByRole("tab", { name: "边框与阴影", exact: true }).click()
  await dialog
    .getByRole("tablist", { name: "阴影", exact: true })
    .getByRole("tab", { name: "中", exact: true })
    .click()
  const squareSurface = preview.locator("[data-tab-surface]").first()
  await expect(squareSurface).not.toHaveCSS("box-shadow", "none")

  await openStripTabSettings(dialog)
  await expect(preview.locator("[data-tab-surface]").first()).toHaveCSS(
    "box-shadow",
    "none"
  )
  await dialog.getByRole("tab", { name: "背景", exact: true }).click()
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "选择背景样式", exact: true })
  ).toBeVisible()
})

test("mobile settings uses full-screen application navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox()
      return bounds
        ? [bounds.x, bounds.y, bounds.width, bounds.height].map(Math.round)
        : null
    })
    .toEqual([0, 0, 390, 844])
  await expect(
    dialog.locator("header").getByRole("button", { name: "添加", exact: true })
  ).toBeVisible()

  await dialog.getByRole("button", { name: "设置分类", exact: true }).click()
  const navigation = page.getByRole("navigation", { name: "设置分类" })
  await expect(navigation).toBeVisible()
  await navigation.getByRole("button", { name: "文件夹", exact: true }).click()

  await expect(
    dialog.locator("header").getByText("文件夹", { exact: true })
  ).toBeVisible()
  await expect(navigation).not.toBeVisible()
  await expect(dialog).toBeVisible()
})

test("clicking the blurred backdrop closes an application", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await expect(dialog).toBeVisible()

  await page.mouse.click(10, 10)
  await expect(dialog).not.toBeVisible()
})

test("bookmark entrance settles into its saved static background", async ({
  page,
}) => {
  await page.clock.install()
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.home-settings",
      JSON.stringify({
        state: { transitionsEnabled: true, burningAmplitude: 1 },
        version: 0,
      })
    )
    localStorage.setItem(
      "omt.tab-grid",
      JSON.stringify({
        state: {
          items: [
            {
              id: "entry",
              kind: "tab",
              name: "入场",
              url: "https://example.com",
              size: "small",
              color: "#6c8bd4",
              dynamicEffect: false,
            },
          ],
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  const tile = page.locator('[data-grid-item-id="entry"]')
  await expect(tile.locator('[data-burning-entrance="running"]')).toHaveCount(1)
  await page.clock.runFor(1800)
  await expect(tile.locator('[data-burning-entrance="running"]')).toHaveCount(0)
  const pixels = () =>
    tile
      .locator("[data-burn-cell]")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLElement).style.backgroundColor)
      )
  const still = await pixels()
  expect(still.some((value) => value !== "transparent")).toBe(true)
  await page.clock.runFor(1000)
  expect(await pixels()).toEqual(still)
})
