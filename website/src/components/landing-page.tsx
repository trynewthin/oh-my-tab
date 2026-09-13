import homeImage from "../../../docs/store-assets/01-home.png"
import organizeImage from "../../../docs/store-assets/04-organize.png"
import playImage from "../../../docs/store-assets/05-play.png"
import { releaseUrl } from "./site-frame"

const features = [
  {
    number: "01",
    title: "常用网站，各有位置",
    text: "自由拖动标签，用文件夹收好相关网站。多选、成组和撤销让整理更轻松。",
  },
  {
    number: "02",
    title: "搜索从熟悉的地方开始",
    text: "先找到主页和文件夹里的书签，再用你选择的搜索引擎继续搜索网页。",
  },
  {
    number: "03",
    title: "实用，也保留一点趣味",
    text: "把日历、待办、点阵画布和像素花盆放进每天都会打开的新标签页。",
  },
  {
    number: "04",
    title: "页面跟着习惯变化",
    text: "浅色、深色、主题色、背景和动态效果都可以独立调整。",
  },
]

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

export function LandingContent() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Chrome / Edge 新标签页</p>
          <h1>
            每天打开的那一页，
            <span>认真布置一下。</span>
          </h1>
          <p className="hero-intro">
            把搜索、常用网站和小组件放在一起。Oh My Tab
            给你一个安静、顺手，也真正属于自己的浏览器起点。
          </p>
          <div className="hero-actions">
            <a className="button button--primary" href={releaseUrl}>
              下载最新版本 <Arrow />
            </a>
            <a className="button button--quiet" href="#showcase">
              看看界面
            </a>
          </div>
          <ul className="hero-notes" aria-label="产品特点">
            <li>本地保存</li>
            <li>按需联网</li>
            <li>自由布局</li>
          </ul>
        </div>
        <div className="hero-visual">
          <div className="browser-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>新标签页</span>
          </div>
          <img src={homeImage} alt="Oh My Tab 深色与浅色主页预览" />
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading">
          <p className="eyebrow">做得更顺手</p>
          <h2>功能不必抢镜，刚好在需要时出现。</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span>{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-section" id="showcase">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">真实界面</p>
            <h2>从整理到放松，都在同一张画布上。</h2>
          </div>
          <p>每张截图都来自实际产品界面与公开示例数据。</p>
        </div>
        <div className="showcase-grid">
          <figure className="showcase-card showcase-card--wide">
            <img src={organizeImage} alt="使用多选和文件夹整理常用网站" />
            <figcaption>把常用网站收拾得清清楚楚。</figcaption>
          </figure>
          <figure className="showcase-card">
            <img src={playImage} alt="日历、点阵画布与像素花盆组件" />
            <figcaption>也给每天留一点小爱好。</figcaption>
          </figure>
        </div>
      </section>

      <section className="privacy-callout">
        <p className="eyebrow">数据由你掌握</p>
        <h2>没有广告，也不靠分析你的使用习惯来运转。</h2>
        <p>
          书签、布局和图片默认保存在当前设备。搜索联想、网站图标和 WebDAV
          都由你主动开启。
        </p>
        <a href="/privacy">
          查看隐私政策 <Arrow />
        </a>
      </section>
    </main>
  )
}
