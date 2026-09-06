import { chromium } from '@playwright/test'
import { readFile, mkdir, access } from 'node:fs/promises'
import ts from 'typescript'

const baseURL = process.env.SHOWCASE_URL || 'http://127.0.0.1:4173'
const source = await readFile('src/components/tab-grid/mock-data.ts', 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { mockGridItems } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const ids = ['mock-work','mock-design','mock-github','mock-figma','mock-notion','mock-youtube','mock-more-linear','mock-more-spotify','mock-more-wikipedia','mock-more-reading','mock-more-tools']
const items = mockGridItems.filter(i => ids.includes(i.id))
const work = items.find(i => i.id === 'mock-work')
work.dynamicEffect = true
const positions = {
 'mock-work': {x:0,y:0}, 'mock-design':{x:4,y:0}, 'mock-github':{x:8,y:0},
 'mock-figma':{x:8,y:1}, 'mock-notion':{x:4,y:2}, 'mock-youtube':{x:8,y:2},
 'mock-more-linear':{x:0,y:4}, 'mock-more-spotify':{x:4,y:4}, 'mock-more-wikipedia':{x:8,y:4},
}
const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chromeExists = await access(systemChrome).then(() => true, () => false)
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (chromeExists ? systemChrome : undefined), headless:true })
const context = await browser.newContext({ viewport:{width:1280,height:960}, deviceScaleFactor:1.5, reducedMotion:'reduce' })
const logos = new Map()
await Promise.all(items.flatMap(i => i.kind === 'folder' ? i.tabs : [i]).map(async item => {
 const host = new URL(item.url).hostname
 if (logos.has(host)) return
 logos.set(host, null)
 try {
  const response = await fetch(`https://icons.duckduckgo.com/ip3/${host}.ico`, { signal:AbortSignal.timeout(10000) })
  if(response.ok) logos.set(host, {body:Buffer.from(await response.arrayBuffer()), contentType:response.headers.get('content-type') || 'image/x-icon'})
 } catch {}
}))
logos.set('vite.dev', {body:await readFile('public/vite.svg'),contentType:'image/svg+xml'})
await context.route('**/__favicon?**', async route => {
 const query = new URL(route.request().url()).searchParams
 const url = query.get('url') || query.get('origin')
 if(query.get('kind') === 'page') return route.fulfill({status:200, contentType:'text/html',body:'<html><head></head></html>'})
 const logo = logos.get(new URL(url).hostname)
 return route.fulfill(logo ? {status:200,...logo} : {status:404,body:''})
})
await context.addInitScript(({items, positions}) => {
 localStorage.setItem('omt.onboarding', JSON.stringify({state:{seen:true},version:0}))
 if (!localStorage.getItem('showcase-seeded')) {
  localStorage.setItem('omt.tab-grid',JSON.stringify({state:{items,layouts:{12:positions},mockDataVersion:2},version:0}))
  localStorage.setItem('omt.home-settings',JSON.stringify({state:{topComponent:'dot-matrix',content:'text',text:'OH MY TAB',pet:'cat',color:'#a58bc6'},version:0}))
  localStorage.setItem('omt.theme-mode',JSON.stringify({state:{theme:'dark'},version:0}))
  localStorage.setItem('showcase-seeded','true')
 }
}, {items, positions})
const page = await context.newPage()
const errors=[]
page.on('pageerror',e=>errors.push(e.message))
await mkdir('docs/screenshots',{recursive:true})
try {
 await page.goto(baseURL)
 await page.getByRole('textbox',{name:'对话输入'}).waitFor()
 await page.evaluate(()=>document.fonts.ready)
 await page.waitForTimeout(1800)
 await page.screenshot({path:'docs/screenshots/home-dark.png'})
 await page.getByRole('button',{name:'工作台',exact:true}).click({button:'right'})
 await page.getByRole('menuitem',{name:'随机颜色',exact:true}).waitFor()
 await page.waitForTimeout(250)
 await page.screenshot({path:'docs/screenshots/context-menu.png'})
 await page.keyboard.press('Escape')
 await page.getByRole('button',{name:'工作台',exact:true}).click()
 await page.getByRole('dialog',{name:'工作台',exact:true}).waitFor()
 await page.waitForTimeout(450)
 await page.screenshot({path:'docs/screenshots/folder.png'})
 await page.getByRole('button',{name:'关闭文件夹'}).click()
 await page.waitForTimeout(350)
 await page.getByRole('button',{name:'打开设置',exact:true}).click()
 await page.getByRole('button',{name:'主页设置',exact:true}).click()
 await page.mouse.move(20,20)
 await page.waitForTimeout(350)
 await page.screenshot({path:'docs/screenshots/settings.png'})
 await page.getByRole('button',{name:'关闭',exact:true}).click()
 await page.evaluate(()=>{localStorage.setItem('omt.theme-mode',JSON.stringify({state:{theme:'light'},version:0}))})
 await page.reload()
 await page.waitForTimeout(500)
 await page.screenshot({path:'docs/screenshots/home-light.png'})
 const popup=await context.newPage()
 await popup.addInitScript(()=>{window.chrome={tabs:{query:async()=>[{url:'https://react.dev',title:'React — The library for web and native user interfaces'}]}}})
 await popup.goto(baseURL+'/popup.html')
 await popup.getByRole('button',{name:'添加',exact:true}).waitFor()
 await popup.evaluate(()=>document.fonts.ready)
 await popup.locator('main').screenshot({path:'docs/screenshots/popup.png'})
 if(errors.length) throw new Error(errors.join('\n'))
 console.log('Captured six showcase images using isolated mock data.')
} finally {await context.close();await browser.close()}
