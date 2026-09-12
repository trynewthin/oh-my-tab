import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, access, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { chromium, expect } from '@playwright/test'
import sharp from 'sharp'

const dir = await mkdtemp(path.join(tmpdir(), 'omt-webdav-'))
const project = `omt-dav-test-${randomUUID().slice(0, 8)}`
const appUrl = process.env.WEBDAV_TEST_APP_URL || 'http://localhost:5173/'
const password = randomUUID()
const env = { ...process.env, DAV_DOMAIN: 'localhost', DEV_ORIGIN: new URL(appUrl).origin }
const command = (args, options = {}) => {
  const result = spawnSync('docker', args, { encoding: 'utf8', env, ...options })
  if (result.status !== 0) throw new Error(`Docker ${args[0]} failed: ${result.stderr}`)
  return result.stdout.trim()
}
const compose = (...args) => command(['compose', '-p', project, '-f', path.join(dir, 'compose.yaml'), ...args])
let browser
let extensionContext
const failures = []
const checks = []
function pass(message) { checks.push(message); console.log(`PASS: ${message}`) }
try {
  await mkdir(path.join(dir, 'auth'))
  const auth = command(['run', '--rm', '-i', '--entrypoint', 'htpasswd', 'httpd:2.4', '-niB', 'omt-test'], { input: password + '\n' })
  await writeFile(path.join(dir, 'auth/users'), auth + '\n')
  await writeFile(path.join(dir, 'httpd.conf'), await readFile('deploy/webdav/httpd.conf', 'utf8'))
  const caddy = (await readFile('deploy/webdav/Caddyfile', 'utf8')).replace('{$DAV_DOMAIN} {', '{$DAV_DOMAIN} {\n  tls internal')
  await writeFile(path.join(dir, 'Caddyfile'), caddy)
  const yaml = (await readFile('deploy/webdav/compose.yaml', 'utf8')).replace('      - "80:80"\n      - "443:443"', '      - "127.0.0.1::443"')
  await writeFile(path.join(dir, 'compose.yaml'), yaml)
  compose('up', '-d')
  const port = compose('port', 'https', '443').split(':').at(-1)
  const serverUrl = `https://localhost:${port}/`
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || await access(chrome).then(() => chrome, () => undefined)
  browser = await chromium.launch({ executablePath })
  const contexts = await Promise.all([0, 1].map(async () => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1438, height: 961 } })
    await context.addInitScript(() => {
      if (!localStorage.getItem('test-seeded')) {
        localStorage.setItem('omt.onboarding', JSON.stringify({ state: { seen: true }, version: 0 }))
        localStorage.setItem('test-seeded', 'true')
      }
    })
    return context
  }))
  const [a, b] = await Promise.all(contexts.map(async context => {
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => failures.push(error.message))
    await page.goto(appUrl)
    await page.getByRole('button', { name: '打开设置', exact: true }).waitFor()
    return page
  }))
  // Use only the isolated profiles' stores to prepare distinguishable devices.
  async function setText(page, text) {
    await page.evaluate(async text => {
      const { useHomeSettingsStore } = await import('/src/stores/home-settings-store.ts')
      const { flushStorage } = await import('/src/lib/storage.ts')
      useHomeSettingsStore.getState().setText(text)
      await flushStorage()
    }, text)
  }
  async function getText(page) {
    return page.evaluate(async () => (await import('/src/stores/home-settings-store.ts')).useHomeSettingsStore.getState().text)
  }
  const image = [...await sharp({ create: { width: 16, height: 16, channels: 4, background: '#528bed' } }).png().toBuffer()]
  await a.evaluate(async image => {
    const storage = await import('/src/lib/storage.ts')
    const home = (await import('/src/stores/home-settings-store.ts')).useHomeSettingsStore
    const id = await storage.putAsset(new Blob([new Uint8Array(image)], { type: 'image/png' }))
    home.getState().setBackgroundImage(id)
    home.getState().setBackgroundType('image')
    await storage.flushStorage()
  }, image)
  await setText(a, 'DEVICE A')
  await setText(b, 'DEVICE B')
  async function openDav(page) {
    await page.getByRole('button', { name: '打开设置', exact: true }).click()
    await page.getByRole('button', { name: '常规', exact: true }).click()
    await page.getByRole('combobox', { name: '多端同步', exact: true }).click()
    await page.getByRole('option', { name: 'WebDAV', exact: true }).click()
    await page.locator('section[aria-labelledby="sync-settings-title"]').getByRole('button', { name: '管理', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'WebDAV', exact: true })
    await dialog.getByLabel('服务器目录', { exact: true }).fill(serverUrl)
    await dialog.getByLabel('用户名', { exact: true }).fill('omt-test')
    return dialog
  }
  const da = await openDav(a)
  await expect(da.getByRole('button', { name: '上传', exact: true })).toBeDisabled()
  await da.getByLabel('密码', { exact: true }).fill('incorrect')
  await da.getByRole('button', { name: '连接', exact: true }).click()
  await expect(a.getByText('WebDAV 认证失败或没有访问权限', { exact: true })).toBeVisible()
  await expect(da.getByRole('button', { name: '上传', exact: true })).toBeDisabled()
  pass('wrong credentials rejected; transfer buttons remain disabled')
  await da.getByLabel('密码', { exact: true }).fill(password)
  await da.getByRole('button', { name: '连接', exact: true }).click()
  await expect(da.getByText('已连接', { exact: true })).toBeVisible()
  await da.getByRole('button', { name: '上传', exact: true }).click()
  await expect(da.getByText('已上传本机数据，其他设备可下载恢复', { exact: true })).toBeVisible()
  pass('real HTTPS WebDAV connection and ZIP upload through the UI')
  const db = await openDav(b)
  await db.getByLabel('密码', { exact: true }).fill(password)
  await db.getByRole('button', { name: '连接', exact: true }).click()
  await expect(db.getByText('已连接', { exact: true })).toBeVisible()
  await db.getByRole('button', { name: '下载', exact: true }).click()
  await expect(db.getByText('云端数据将替换本地数据，是否继续？', { exact: true })).toBeVisible()
  assert.equal(await getText(b), 'DEVICE B')
  await db.getByRole('button', { name: '取消', exact: true }).click()
  assert.equal(await getText(b), 'DEVICE B')
  pass('download confirmation and cancel preserve device B data')
  await db.getByRole('button', { name: '下载', exact: true }).click()
  await Promise.all([b.waitForEvent('load'), db.getByRole('button', { name: '确认覆盖本机', exact: true }).click()])
  await expect.poll(() => getText(b)).toBe('DEVICE A')
  const restoredImage = await b.evaluate(async () => {
    const home = (await import('/src/stores/home-settings-store.ts')).useHomeSettingsStore.getState()
    const { getAsset } = await import('/src/lib/storage.ts')
    return [...new Uint8Array(await (await getAsset(home.backgroundImage)).arrayBuffer())]
  })
  assert.deepEqual(restoredImage, image)
  pass('device B restores device A settings and byte-identical original image')
  // Exercise real conditional PUT against Apache; do not mock fetch.
  const conditional = await a.evaluate(async ({ url, password }) => {
    const dav = await import('/src/lib/webdav.ts')
    const connection = { url, username: 'omt-test', password }
    const old = await dav.fetchRemoteBackup(connection)
    const data = await (await import('/src/lib/backup.ts')).createBackup()
    await dav.uploadRemoteBackup(connection, data, old.etag, true)
    try { await dav.uploadRemoteBackup(connection, data, old.etag, true); return false } catch (error) { return error.message.includes('云端数据已变化') }
  }, { url: serverUrl, password })
  assert.equal(conditional, true)
  pass('stale ETag rejected by actual WebDAV server')
  const remoteBefore = await a.evaluate(async ({ url, password }) => {
    const remote = await (await import('/src/lib/webdav.ts')).fetchRemoteBackup({ url, username: 'omt-test', password })
    return [...new Uint8Array(await remote.blob.arrayBuffer())]
  }, { url: serverUrl, password })
  await da.getByRole('button', { name: '删除', exact: true }).click()
  await expect(da.getByText('删除只会关闭连接，不会删除本地数据或云端备份。', { exact: true })).toBeVisible()
  await da.getByRole('button', { name: '确认删除', exact: true }).click()
  await expect(da.getByRole('button', { name: '连接', exact: true })).toBeVisible()
  await expect(da.getByRole('button', { name: '下载', exact: true })).toBeDisabled()
  assert.equal(await getText(a), 'DEVICE A')
  const remoteAfter = await a.evaluate(async ({ url, password }) => {
    const remote = await (await import('/src/lib/webdav.ts')).fetchRemoteBackup({ url, username: 'omt-test', password })
    return [...new Uint8Array(await remote.blob.arrayBuffer())]
  }, { url: serverUrl, password })
  assert.deepEqual(remoteAfter, remoteBefore)
  pass('disconnect leaves local data and remote ZIP unchanged')
  const extensionDir = path.join(dir, 'extension')
  await cp('dist', extensionDir, { recursive: true })
  const manifestPath = path.join(extensionDir, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  // Pre-authorize only the loopback test server in this disposable copy.
  // Native browser permission prompts require separate interactive coverage.
  manifest.host_permissions = ['https://localhost/*']
  await writeFile(manifestPath, JSON.stringify(manifest))
  extensionContext = await chromium.launchPersistentContext(path.join(dir, 'profile'), {
    executablePath: chromium.executablePath(),
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1438, height: 961 },
    args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`],
  })
  await extensionContext.addInitScript(() => {
    if (location.protocol === 'chrome-extension:' && !localStorage.getItem('test-seeded')) {
      localStorage.setItem('omt.onboarding', JSON.stringify({ state: { seen: true }, version: 0 }))
      localStorage.setItem('test-seeded', 'true')
    }
  })
  const extensionPage = await extensionContext.newPage()
  extensionPage.setDefaultTimeout(10000)
  extensionPage.on('pageerror', error => failures.push(error.message))
  await extensionPage.goto('chrome://newtab/')
  await extensionPage.getByRole('button', { name: '打开设置', exact: true }).waitFor()
  assert.ok(extensionPage.url().startsWith('chrome-extension://'))
  const de = await openDav(extensionPage)
  await de.getByLabel('密码', { exact: true }).fill(password)
  await de.getByRole('button', { name: '连接', exact: true }).click()
  await expect(de.getByText('已连接', { exact: true })).toBeVisible()
  await de.getByRole('button', { name: '下载', exact: true }).click()
  await expect(de.getByText('云端数据将替换本地数据，是否继续？', { exact: true })).toBeVisible()
  await Promise.all([extensionPage.waitForEvent('load'), de.getByRole('button', { name: '确认覆盖本机', exact: true }).click()])
  const extensionData = await extensionPage.evaluate(async () => {
    const values = await chrome.storage.local.get(['omt.home-settings'])
    const home = JSON.parse(values['omt.home-settings']).state
    const image = await chrome.storage.local.get([home.backgroundImage])
    return { text: home.text, image: image[home.backgroundImage].value }
  })
  assert.equal(extensionData.text, 'DEVICE A')
  assert.deepEqual([...Buffer.from(extensionData.image.split(',')[1], 'base64')], image)
  const reopened = await openDav(extensionPage)
  await reopened.getByLabel('密码', { exact: true }).fill(password)
  await reopened.getByRole('button', { name: '连接', exact: true }).click()
  await expect(reopened.getByText('已连接', { exact: true })).toBeVisible()
  await reopened.getByRole('button', { name: '上传', exact: true }).click()
  await reopened.getByRole('button', { name: '确认覆盖云端', exact: true }).click()
  await expect(reopened.getByText('已上传本机数据，其他设备可下载恢复', { exact: true })).toBeVisible()
  pass('Chrome extension connects, restores original image into chrome.storage.local and uploads ZIP')
  assert.deepEqual(failures, [])
  await mkdir('artifacts', { recursive: true })
  await writeFile('artifacts/webdav-verification.json', JSON.stringify({ checks, pageErrors: failures, server: 'Apache WebDAV + Caddy HTTPS', isolatedProfiles: 3, extensionHostPermission: "pre-authorized loopback test server" }, null, 2))
} catch (error) {
  console.error(error)
  await mkdir('artifacts', { recursive: true })
  for (const [index, context] of (browser?.contexts() ?? []).entries()) {
    await context.pages()[0]?.screenshot({ path: `artifacts/webdav-failure-${index}.png` }).catch(() => {})
  }
  try { console.error(compose('logs', '--tail', '20', 'webdav')) } catch {}
  process.exitCode = 1
} finally {
  await extensionContext?.close()
  await browser?.close()
  try { compose('down', '-v', '--remove-orphans') } finally { await rm(dir, { recursive: true, force: true }) }
}
