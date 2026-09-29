import assert from "node:assert/strict"
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  access,
  cp,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { chromium, expect } from "@playwright/test"
import sharp from "sharp"

const dir = await mkdtemp(path.join(tmpdir(), "omt-webdav-"))
const resultDir = "tests/results/webdav"
const project = `omt-dav-test-${randomUUID().slice(0, 8)}`
const appUrl = process.env.WEBDAV_TEST_APP_URL || "http://localhost:5173/"
const password = randomUUID()
const env = { ...process.env }
const httpdConfig = `ServerRoot "/usr/local/apache2"
Listen 80
ServerName webdav
LoadModule mpm_event_module modules/mod_mpm_event.so
LoadModule unixd_module modules/mod_unixd.so
LoadModule authn_core_module modules/mod_authn_core.so
LoadModule authn_file_module modules/mod_authn_file.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule authz_user_module modules/mod_authz_user.so
LoadModule auth_basic_module modules/mod_auth_basic.so
LoadModule dav_module modules/mod_dav.so
LoadModule dav_fs_module modules/mod_dav_fs.so
LoadModule log_config_module modules/mod_log_config.so
User daemon
Group daemon
ErrorLog /proc/self/fd/2
LogLevel warn
DocumentRoot "/data"
DavLockDB "/usr/local/apache2/var/DavLock"
<Directory "/">
  AllowOverride None
  Require all denied
</Directory>
<Directory "/data">
  Dav On
  AuthType Basic
  AuthName "Oh My Tab Test"
  AuthUserFile "/auth/users"
  Require valid-user
  LimitRequestBody 67108864
</Directory>
`
const caddyConfig = `localhost {
  tls internal
  header {
    Access-Control-Allow-Origin "${new URL(appUrl).origin}"
    Access-Control-Allow-Methods "GET, PUT, DELETE, PROPFIND, OPTIONS"
    Access-Control-Allow-Headers "Authorization, Content-Type, Depth, If-Match, If-None-Match"
    Access-Control-Expose-Headers "ETag"
    Vary "Origin"
  }
  @preflight method OPTIONS
  respond @preflight 204
  reverse_proxy webdav:80
}
`
const composeConfig = `services:
  webdav:
    image: httpd:2.4
    command: ["sh", "-c", "mkdir -p /data /usr/local/apache2/var && chown daemon:daemon /data /usr/local/apache2/var && exec httpd-foreground"]
    volumes:
      - ./httpd.conf:/usr/local/apache2/conf/httpd.conf:ro
      - ./auth:/auth:ro
      - webdav-data:/data
  https:
    image: caddy:2
    ports:
      - "127.0.0.1::443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - webdav
volumes:
  webdav-data:
  caddy-data:
  caddy-config:
`
const command = (args, options = {}) => {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    env,
    ...options,
  })
  if (result.status !== 0)
    throw new Error(`Docker ${args[0]} failed: ${result.stderr}`)
  return result.stdout.trim()
}
const compose = (...args) =>
  command([
    "compose",
    "-p",
    project,
    "-f",
    path.join(dir, "compose.yaml"),
    ...args,
  ])
let browser
let extensionContext
const failures = []
const checks = []
function pass(message) {
  checks.push(message)
  console.log(`PASS: ${message}`)
}
try {
  await mkdir(path.join(dir, "auth"))
  const auth = command(
    [
      "run",
      "--rm",
      "-i",
      "--entrypoint",
      "htpasswd",
      "httpd:2.4",
      "-niB",
      "omt-test",
    ],
    { input: password + "\n" }
  )
  await writeFile(path.join(dir, "auth/users"), auth + "\n")
  await writeFile(path.join(dir, "httpd.conf"), httpdConfig)
  await writeFile(path.join(dir, "Caddyfile"), caddyConfig)
  await writeFile(path.join(dir, "compose.yaml"), composeConfig)
  compose("up", "-d")
  const port = compose("port", "https", "443").split(":").at(-1)
  const serverUrl = `https://localhost:${port}/`
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (await access(chrome).then(
      () => chrome,
      () => undefined
    ))
  browser = await chromium.launch({ executablePath })
  const contexts = await Promise.all(
    [0, 1].map(async () => {
      const context = await browser.newContext({
        // The UI follows the browser language, so this script's zh-CN label
        // selectors need a deterministic locale instead of the runner's.
        locale: "zh-CN",
        ignoreHTTPSErrors: true,
        viewport: { width: 1438, height: 961 },
      })
      await context.addInitScript(() => {
        if (!localStorage.getItem("test-seeded")) {
          localStorage.setItem(
            "omt.onboarding",
            JSON.stringify({ state: { seen: true }, version: 0 })
          )
          localStorage.setItem("test-seeded", "true")
        }
      })
      return context
    })
  )
  const [a, b] = await Promise.all(
    contexts.map(async (context) => {
      const page = await context.newPage()
      page.setDefaultTimeout(10000)
      page.on("pageerror", (error) => failures.push(error.message))
      await page.goto(appUrl)
      await page
        .getByRole("button", { name: "打开设置", exact: true })
        .waitFor()
      return page
    })
  )
  // Use only the isolated profiles' stores to prepare distinguishable devices.
  async function setText(page, text) {
    await page.evaluate(async (text) => {
      const { useHomeSettingsStore } =
        await import("/src/stores/home-settings-store.ts")
      const { flushStorage } = await import("/src/lib/storage.ts")
      useHomeSettingsStore.getState().setText(text)
      await flushStorage()
    }, text)
  }
  async function getText(page) {
    return page.evaluate(
      async () =>
        (
          await import("/src/stores/home-settings-store.ts")
        ).useHomeSettingsStore.getState().text
    )
  }
  const image = [
    ...(await sharp({
      create: { width: 16, height: 16, channels: 4, background: "#528bed" },
    })
      .png()
      .toBuffer()),
  ]
  await a.evaluate(async (image) => {
    const storage = await import("/src/lib/storage.ts")
    const home = (await import("/src/stores/home-settings-store.ts"))
      .useHomeSettingsStore
    const id = await storage.putAsset(
      new Blob([new Uint8Array(image)], { type: "image/png" })
    )
    home.getState().setBackgroundImage(id)
    home.getState().setBackgroundType("image")
    await storage.flushStorage()
  }, image)
  await setText(a, "DEVICE A")
  await setText(b, "DEVICE B")
  async function openSettings(page) {
    await page.getByRole("button", { name: "打开设置", exact: true }).click()
    await page.getByRole("button", { name: "常规", exact: true }).click()
    return page.locator('section[aria-labelledby="sync-settings-title"]')
  }
  async function configure(page) {
    const section = await openSettings(page)
    await section
      .getByRole("combobox", { name: "多端同步", exact: true })
      .click()
    await page.getByRole("option", { name: "WebDAV", exact: true }).click()
    await section.getByRole("button", { name: "管理", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "WebDAV", exact: true })
    await dialog.getByLabel("服务器目录", { exact: true }).fill(serverUrl)
    await dialog.getByLabel("用户名", { exact: true }).fill("omt-test")
    return { section, dialog }
  }
  async function connect(page) {
    const { section, dialog } = await configure(page)
    await dialog.getByLabel("密码", { exact: true }).fill(password)
    await dialog.getByRole("button", { name: "连接", exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(
      section.getByRole("status", { name: "已连接", exact: true })
    ).toBeVisible()
    return section
  }
  const { section: sa, dialog: da } = await configure(a)
  await da.getByLabel("密码", { exact: true }).fill("incorrect")
  await da.getByRole("button", { name: "连接", exact: true }).click()
  await expect(
    a.getByText("WebDAV 认证失败或没有访问权限", { exact: true })
  ).toBeVisible()
  await da.getByLabel("密码", { exact: true }).fill(password)
  await da.getByRole("button", { name: "连接", exact: true }).click()
  await expect(da).not.toBeVisible()
  await expect(
    sa.getByRole("status", { name: "已连接", exact: true })
  ).toBeVisible()
  pass(
    "incorrect credentials rejected; successful connection replaces Manage with controls"
  )
  await sa.getByRole("button", { name: "同步", exact: true }).click()
  await expect(a.getByText("同步完成", { exact: true })).toBeVisible()
  await a.reload()
  const reloaded = await openSettings(a)
  await expect(
    reloaded.getByRole("status", { name: "已连接", exact: true })
  ).toBeVisible()
  await reloaded
    .getByRole("button", { name: "已连接，点击配置 WebDAV", exact: true })
    .click()
  const settings = a.getByRole("dialog", { name: "WebDAV", exact: true })
  await expect(settings.getByLabel("密码", { exact: true })).toHaveValue(
    password
  )
  await expect(
    settings.getByLabel("保留上传快照数", { exact: true })
  ).toHaveValue("5")
  await settings.getByLabel("保留上传快照数", { exact: true }).fill("2")
  await settings
    .getByRole("button", { name: "保存并连接", exact: true })
    .click()
  pass("credentials, device identity and retention survive reload")
  const sb = await connect(b)
  await Promise.all([
    b.waitForEvent("load"),
    sb.getByRole("button", { name: "同步", exact: true }).click(),
  ])
  await expect.poll(() => getText(b)).toBe("DEVICE A")
  const restoredImage = await b.evaluate(async () => {
    const home = (
      await import("/src/stores/home-settings-store.ts")
    ).useHomeSettingsStore.getState()
    const { getAsset } = await import("/src/lib/storage.ts")
    return [
      ...new Uint8Array(
        await (await getAsset(home.backgroundImage)).arrayBuffer()
      ),
    ]
  })
  assert.deepEqual(restoredImage, image)
  pass(
    "first sync uses the remote version directly and restores byte-identical images"
  )
  for (const text of ["A SECOND", "A THIRD"]) {
    await setText(a, text)
    await reloaded.getByRole("button", { name: "同步", exact: true }).click()
    await expect(
      reloaded.getByRole("button", { name: "同步", exact: true })
    ).toBeEnabled()
  }
  const history = await a.evaluate(async () => {
    const { readWebdavSettings } =
      await import("/src/application/webdav-settings.ts")
    const { fetchRemoteBackup } = await import("/src/application/webdav.ts")
    const { saved } = await readWebdavSettings()
    const remote = await fetchRemoteBackup(saved, "oh-my-tab-sync.json")
    return JSON.parse(await remote.blob.text())
  })
  assert.equal(history.snapshots.length, 2)
  assert.equal(history.garbage.length, 0)
  pass("snapshot retention setting prunes expired uploads on real WebDAV")
  await setText(b, "B LOCAL EDIT")
  const bControls = await openSettings(b)
  await bControls.getByRole("button", { name: "同步", exact: true }).click()
  const choice = b.getByRole("dialog", { name: "选择同步版本", exact: true })
  await expect(choice).toBeVisible()
  await expect(
    choice
      .getByRole("list", { name: "同步快照", exact: true })
      .getByRole("listitem")
  ).toHaveCount(2)
  await choice.getByRole("button", { name: "取消", exact: true }).click()
  assert.equal(await getText(b), "B LOCAL EDIT")
  pass(
    "established devices with changes on both sides ask for a version; cancellation preserves local data"
  )
  await setText(b, "DEVICE A")
  await Promise.all([
    b.waitForEvent("load"),
    bControls.getByRole("button", { name: "同步", exact: true }).click(),
  ])
  await expect.poll(() => getText(b)).toBe("A THIRD")
  pass("small update from another device downloads without a version prompt")
  await setText(a, "A SECOND")
  await reloaded.getByRole("button", { name: "同步", exact: true }).click()
  await expect(
    a.getByText("相同内容的快照已存在，无需重复上传", { exact: true })
  ).toBeVisible()
  await setText(a, "A THIRD")
  await reloaded
    .getByRole("button", { name: "管理同步快照", exact: true })
    .click()
  const snapshotDialog = a.getByRole("dialog", {
    name: "同步快照",
    exact: true,
  })
  const snapshotRows = snapshotDialog.getByRole("listitem")
  await expect(snapshotRows).toHaveCount(2)
  const manualSync = snapshotDialog.getByRole("button", {
    name: "手动同步",
    exact: true,
  })
  await manualSync.click()
  await expect(manualSync).toBeEnabled()
  const manualHistory = await a.evaluate(async () => {
    const { readWebdavSettings } =
      await import("/src/application/webdav-settings.ts")
    const { fetchRemoteBackup } = await import("/src/application/webdav.ts")
    const { saved } = await readWebdavSettings()
    const remote = await fetchRemoteBackup(saved, "oh-my-tab-sync.json")
    return JSON.parse(await remote.blob.text())
  })
  assert.equal(manualHistory.version, 3)
  assert.equal(manualHistory.snapshots.length, 2)
  assert.equal(manualHistory.snapshots[0].manual, true)
  assert.notEqual(manualHistory.snapshots[0].id, history.snapshots[0].id)
  await snapshotRows
    .last()
    .getByRole("button", { name: "重命名", exact: true })
    .click()
  const renameDialog = a.getByRole("dialog", {
    name: "重命名快照",
    exact: true,
  })
  await renameDialog
    .getByLabel("快照名称", { exact: true })
    .fill("测试保留快照")
  await renameDialog.getByRole("button", { name: "取消", exact: true }).click()
  await expect(
    snapshotDialog.getByText("测试保留快照", { exact: true })
  ).not.toBeVisible()
  await snapshotRows
    .last()
    .getByRole("button", { name: "重命名", exact: true })
    .click()
  await renameDialog
    .getByLabel("快照名称", { exact: true })
    .fill("测试保留快照")
  await renameDialog.getByRole("button", { name: "保存", exact: true }).click()
  await expect(renameDialog).not.toBeVisible()
  await expect(
    snapshotRows.last().getByText("测试保留快照", { exact: true })
  ).toBeVisible()
  await expect(
    snapshotRows.last().getByText("保留", { exact: true })
  ).toBeVisible()
  await snapshotRows
    .last()
    .getByRole("button", { name: "删除", exact: true })
    .click()
  const deleteSnapshotDialog = a.getByRole("alertdialog", {
    name: "删除同步快照？",
    exact: true,
  })
  await expect(deleteSnapshotDialog).toBeVisible()
  await deleteSnapshotDialog
    .getByRole("button", { name: "取消", exact: true })
    .click()
  await expect(snapshotRows).toHaveCount(2)
  await snapshotRows
    .last()
    .getByRole("button", { name: "删除", exact: true })
    .click()
  await deleteSnapshotDialog
    .getByRole("button", { name: "确认删除", exact: true })
    .click()
  await expect(deleteSnapshotDialog).not.toBeVisible()
  await expect(snapshotRows).toHaveCount(1)
  await snapshotDialog
    .getByRole("button", { name: "关闭", exact: true })
    .click()
  pass(
    "regular sync deduplicates content; manual sync creates a fresh snapshot, renaming keeps it and deletion requires confirmation"
  )
  await reloaded.getByRole("button", { name: "删除", exact: true }).click()
  const removal = a.getByRole("alertdialog", {
    name: "删除 WebDAV 连接？",
    exact: true,
  })
  await expect(removal).toBeVisible()
  const hasConnection = () =>
    a.evaluate(async () => {
      const { readWebdavSettings } =
        await import("/src/application/webdav-settings.ts")
      return !!(await readWebdavSettings()).saved
    })
  assert.equal(await hasConnection(), true)
  await removal.getByRole("button", { name: "取消", exact: true }).click()
  await expect(removal).not.toBeVisible()
  assert.equal(await hasConnection(), true)
  await reloaded.getByRole("button", { name: "删除", exact: true }).click()
  await expect(removal).toBeVisible()
  await a.keyboard.press("Escape")
  await expect(removal).not.toBeVisible()
  assert.equal(await hasConnection(), true)
  await reloaded.getByRole("button", { name: "删除", exact: true }).click()
  await removal.getByRole("button", { name: "确认删除", exact: true }).click()
  await expect(removal).not.toBeVisible()
  await expect(
    reloaded.getByRole("button", { name: "管理", exact: true })
  ).toBeVisible()
  assert.equal(await getText(a), "A THIRD")
  const removed = await a.evaluate(async () => {
    const { readWebdavSettings } =
      await import("/src/application/webdav-settings.ts")
    return !(await readWebdavSettings()).saved
  })
  assert.equal(removed, true)
  pass(
    "cancel and Escape preserve the connection; confirmed deletion clears credentials and preserves business data"
  )
  const extensionDir = path.join(dir, "extension")
  await cp("dist", extensionDir, { recursive: true })
  const manifestPath = path.join(extensionDir, "manifest.json")
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  manifest.host_permissions = ["https://localhost/*"]
  await writeFile(manifestPath, JSON.stringify(manifest))
  extensionContext = await chromium.launchPersistentContext(
    path.join(dir, "profile"),
    {
      executablePath: chromium.executablePath(),
      headless: true,
      locale: "zh-CN",
      ignoreHTTPSErrors: true,
      viewport: { width: 1438, height: 961 },
      args: [
        `--disable-extensions-except=${extensionDir}`,
        `--load-extension=${extensionDir}`,
      ],
    }
  )
  await extensionContext.addInitScript(() => {
    if (
      location.protocol === "chrome-extension:" &&
      !localStorage.getItem("test-seeded")
    ) {
      localStorage.setItem(
        "omt.onboarding",
        JSON.stringify({ state: { seen: true }, version: 0 })
      )
      localStorage.setItem("test-seeded", "true")
    }
  })
  const extensionPage = await extensionContext.newPage()
  extensionPage.setDefaultTimeout(10000)
  extensionPage.on("pageerror", (error) => failures.push(error.message))
  await extensionPage.goto("chrome://newtab/")
  await extensionPage
    .getByRole("button", { name: "打开设置", exact: true })
    .waitFor()
  assert.ok(extensionPage.url().startsWith("chrome-extension://"))
  const extensionControls = await connect(extensionPage)
  await Promise.all([
    extensionPage.waitForEvent("load"),
    extensionControls
      .getByRole("button", { name: "同步", exact: true })
      .click(),
  ])
  const extensionData = await extensionPage.evaluate(async () => {
    const values = await chrome.storage.local.get([
      "omt.home-settings",
      "omt.webdav",
    ])
    const home = JSON.parse(values["omt.home-settings"]).state
    const image = await chrome.storage.local.get([home.backgroundImage])
    return {
      text: home.text,
      image: image[home.backgroundImage].value,
      hasPassword: !!JSON.parse(values["omt.webdav"]).password,
    }
  })
  assert.equal(extensionData.text, "A THIRD")
  assert.equal(extensionData.hasPassword, true)
  assert.deepEqual(
    [...Buffer.from(extensionData.image.split(",")[1], "base64")],
    image
  )
  const extensionReopened = await openSettings(extensionPage)
  await expect(
    extensionReopened.getByRole("status", { name: "已连接", exact: true })
  ).toBeVisible()
  pass(
    "Chrome extension restores data and persists credentials in chrome.storage.local"
  )
  assert.deepEqual(failures, [])
  await mkdir(resultDir, { recursive: true })
  await writeFile(
    path.join(resultDir, "verification.json"),
    JSON.stringify(
      {
        checks,
        pageErrors: failures,
        server: "Apache WebDAV + Caddy HTTPS",
        isolatedProfiles: 3,
        extensionHostPermission: "pre-authorized loopback test server",
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(error)
  await mkdir(resultDir, { recursive: true })
  for (const [index, context] of (browser?.contexts() ?? []).entries()) {
    await context
      .pages()[0]
      ?.screenshot({ path: path.join(resultDir, `failure-${index}.png`) })
      .catch(() => {})
  }
  try {
    console.error(compose("logs", "--tail", "20", "webdav"))
  } catch {}
  process.exitCode = 1
} finally {
  await extensionContext?.close()
  await browser?.close()
  try {
    compose("down", "-v", "--remove-orphans")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
