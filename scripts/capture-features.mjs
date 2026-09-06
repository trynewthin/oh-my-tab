import { chromium } from '@playwright/test'
import { mkdir, readFile, access } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'

const url = process.env.SHOWCASE_URL || 'http://127.0.0.1:5173'
const source = await readFile('src/components/tab-grid/mock-data.ts', 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { mockGridItems } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const ids = ['mock-work','mock-design','mock-github','mock-figma','mock-notion','mock-youtube','mock-more-linear','mock-more-spotify']
const items = mockGridItems.filter(item => ids.includes(item.id)).map(item => ({...item,dynamicEffect:true}))
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (await access(chrome).then(()=>chrome,()=>undefined))
await mkdir('docs/demos',{recursive:true})
await mkdir('artifacts/feature-videos',{recursive:true})
const browser=await chromium.launch({executablePath})
async function record(name, action) {
 const context=await browser.newContext({viewport:{width:1100,height:760},recordVideo:{dir:'artifacts/feature-videos',size:{width:1100,height:760}}})
 await context.addInitScript(({items})=>{
  if(localStorage.getItem('demo-seeded'))return
  localStorage.setItem('omt.onboarding',JSON.stringify({state:{seen:true},version:0}))
  localStorage.setItem('omt.tab-grid',JSON.stringify({state:{items,layouts:{},mockDataVersion:2},version:0}))
  localStorage.setItem('omt.home-settings',JSON.stringify({state:{topComponent:'dot-matrix',content:'text',text:'OH MY TAB',color:'#a58bc6',transitionsEnabled:true,burningAmplitude:1,effectStyle:'burning'},version:0}))
  localStorage.setItem('omt.theme-mode',JSON.stringify({state:{theme:'dark'},version:0}))
  localStorage.setItem('demo-seeded','true')
 },{items})
 await context.route('**/__suggestions?**',route=>route.fulfill({json:['react',['react tutorial','react hooks','react native']]}))
 const page=await context.newPage()
 const video=page.video()
 await page.goto(url)
 await page.getByRole('combobox',{name:'对话输入'}).waitFor()
 await page.waitForTimeout(1500)
 if(name==='personalization')await page.screenshot({path:'docs/screenshots/home-dark.png'})
 await action(page)
 await page.waitForTimeout(1000)
 const path=await video.path()
 await context.close()
 const result=spawnSync('ffmpeg',['-y','-ss','1','-i',path,'-vf','fps=8,scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=none','-loop','0',`docs/demos/${name}.gif`],{encoding:'utf8'})
 if(result.status!==0)throw new Error(result.stderr)
 console.log(`Created docs/demos/${name}.gif`)
}
try {
 await record('personalization',async page=>{
  await page.getByRole('button',{name:'打开设置',exact:true}).click()
  await page.getByRole('button',{name:'个性化',exact:true}).click()
  await page.waitForTimeout(1700)
  await page.getByLabel('粒子效果',{exact:true}).click()
  await page.getByRole('option',{name:'浮游粒子',exact:true}).click()
  await page.waitForTimeout(1800)
  await page.getByRole('button',{name:'选择主题色',exact:true}).click()
  await page.getByRole('button',{name:'青色',exact:true}).click()
  await page.keyboard.press('Escape')
  await page.mouse.move(850,440,{steps:20})
  await page.waitForTimeout(1700)
 })
 await record('organize',async page=>{
  await page.getByRole('button',{name:'更多操作',exact:true}).click()
  await page.getByRole('button',{name:'批量操作',exact:true}).click()
  await page.getByRole('checkbox',{name:'选择GitHub',exact:true}).click()
  await page.waitForTimeout(400)
  await page.getByRole('checkbox',{name:'选择Figma',exact:true}).click()
  await page.waitForTimeout(700)
  await page.getByRole('button',{name:'成组',exact:true}).click()
  await page.getByLabel('文件夹名称').fill('项目收藏')
  await page.waitForTimeout(600)
  await page.getByRole('button',{name:'确认成组',exact:true}).click()
  await page.waitForTimeout(700)
  await page.getByRole('button',{name:'项目收藏',exact:true}).click()
  await page.waitForTimeout(1300)
 })
 await record('components-search',async page=>{
  await page.getByRole('button',{name:'更多操作',exact:true}).click()
  await page.getByRole('button',{name:'添加组件',exact:true}).click()
  await page.waitForTimeout(1300)
  await page.getByRole('button',{name:'添加标签',exact:true}).click()
  await page.waitForTimeout(900)
  await page.getByRole('button',{name:'取消',exact:true}).click()
  await page.getByRole('dialog',{name:'组件',exact:true}).getByRole('button',{name:'关闭',exact:true}).click()
  await page.getByRole('combobox',{name:'对话输入'}).pressSequentially('react',{delay:180})
  await page.waitForTimeout(1500)
 })
} finally {await browser.close()}
