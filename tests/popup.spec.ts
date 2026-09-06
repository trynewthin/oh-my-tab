import { expect, test } from "@playwright/test"

for (const [theme, effectStyle] of [
  ["light", "burning"],
  ["dark", "burning"],
  ["dark", "particles"],
] as const) {
  test(`popup uses shared ${effectStyle} background and opaque ${theme} controls`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ theme, effectStyle }) => {
        localStorage.setItem(
          "omt.theme-mode",
          JSON.stringify({ state: { theme }, version: 0 })
        )
        localStorage.setItem(
          "omt.home-settings",
          JSON.stringify({
            state: {
              color: "#a58bc6",
              effectStyle,
              burningAmplitude: 1,
              transitionsEnabled: false,
            },
            version: 0,
          })
        )
        Object.defineProperty(window, "chrome", {
          value: {
            tabs: {
              query: async () => [
                { title: "示例网页", url: "https://example.com/page" },
              ],
            },
          },
        })
      },
      { theme, effectStyle }
    )
    await page.goto("/popup.html")
    await expect(page.getByLabel("名称", { exact: true })).toHaveValue(
      "示例网页"
    )
    await expect(
      page.locator(`[data-effect-style="${effectStyle}"]`)
    ).toBeVisible()
    for (const name of ["名称", "链接"]) {
      const appearance = await page
        .getByLabel(name, { exact: true })
        .evaluate((node) => {
          const style = getComputedStyle(node)
          return {
            background: style.backgroundColor,
            border: style.borderColor,
            width: style.borderTopWidth,
          }
        })
      expect(appearance.background).not.toBe("rgba(0, 0, 0, 0)")
      expect(appearance.border).not.toBe("rgba(0, 0, 0, 0)")
      expect(appearance.width).toBe("1px")
    }
    await page.getByRole("button", { name: "添加", exact: true }).click()
    await expect(
      page.getByRole("button", { name: "成功", exact: true })
    ).toBeVisible()
    const items = await page.evaluate(
      () => JSON.parse(localStorage.getItem("omt.tab-grid")!).state.items
    )
    expect(
      items.some(
        (item: { url: string }) => item.url === "https://example.com/page"
      )
    ).toBe(true)
  })
}

for (const inFolder of [false, true]) {
  test(`popup updates an existing ${inFolder ? "folder" : "homepage"} bookmark without duplicates`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ inFolder }) => {
        const bookmark = {
          id: "saved",
          kind: "tab",
          name: "自定义名称",
          url: "https://example.com/",
          size: "medium",
          color: "#a58bc6",
          dynamicEffect: true,
        }
        localStorage.setItem(
          "omt.tab-grid",
          JSON.stringify({
            state: {
              items: inFolder
                ? [
                    {
                      id: "folder",
                      kind: "folder",
                      name: "资料",
                      size: "large",
                      color: "#42b883",
                      tabs: [bookmark],
                    },
                  ]
                : [bookmark],
              layouts: {
                12: { [inFolder ? "folder" : "saved"]: { x: 4, y: 3 } },
              },
            },
            version: 0,
          })
        )
        Object.defineProperty(window, "chrome", {
          value: {
            tabs: {
              query: async () => [
                { title: "网页标题", url: "https://example.com" },
              ],
            },
          },
        })
      },
      { inFolder }
    )
    await page.goto("/popup.html")
    await expect(
      page.getByRole("button", { name: "更新", exact: true })
    ).toBeVisible()
    await expect(page.getByLabel("名称", { exact: true })).toHaveValue(
      "自定义名称"
    )
    await page.getByLabel("名称", { exact: true }).fill("更新后的名称")
    await page.getByRole("button", { name: "更新", exact: true }).click()
    await expect(
      page.getByRole("button", { name: "成功", exact: true })
    ).toBeVisible()
    const state = await page.evaluate(
      () => JSON.parse(localStorage.getItem("omt.tab-grid")!).state
    )
    expect(state.items).toHaveLength(1)
    const bookmark = inFolder ? state.items[0].tabs[0] : state.items[0]
    if (inFolder) expect(state.items[0].tabs).toHaveLength(1)
    expect(bookmark).toMatchObject({
      id: "saved",
      name: "更新后的名称",
      size: "medium",
      color: "#a58bc6",
      dynamicEffect: true,
    })
    expect(state.layouts[12][inFolder ? "folder" : "saved"]).toEqual({
      x: 4,
      y: 3,
    })
  })
}
