import { useState } from "react"
import { chromeStoreUrl, releaseUrl } from "./site-frame"

const details = [
  {
    title: "颜色，藏在细节里。",
    text: "柔和底色、细密点阵，给每组收藏一点自己的辨识度。",
    image: "home-dark",
    view: "28 270 290 300",
    tone: "lilac",
  },
  {
    title: "把今天，轻轻勾掉。",
    text: "待办也有圆润的轮廓。完成一项，就留下一枚小小的对勾。",
    image: "widgets",
    view: "310 100 300 310",
    tone: "blue",
  },
  {
    title: "日子有自己的颜色。",
    text: "月份、日期、今天的位置，安安静静地排好。",
    image: "widgets",
    view: "24 100 300 310",
    tone: "rose",
  },
  {
    title: "养朵花，画朵花。",
    text: "一盆像素植物，一张点阵画布。忙完了，也可以玩一会儿。",
    image: "widgets",
    view: "608 90 570 320",
    tone: "green",
  },
]

export function LandingContent() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            打开新的一页，
            <span>回到自己的节奏。</span>
          </h1>
          <div className="hero-actions">
            <a className="button button--primary" href={chromeStoreUrl}>
              前往 Chrome 商店
            </a>
            <a className="button button--quiet" href={releaseUrl}>
              下载最新版本
            </a>
          </div>
        </div>
        <div className="preview-toolbar">
          <div className="theme-switch" role="group" aria-label="预览主题">
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              ☾ 深色
            </button>
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              ☼ 浅色
            </button>
          </div>
        </div>
        <div className={`hero-visual hero-visual--${theme}`}>
          <div className="browser-bar" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <img
            width="2400"
            height="1840"
            src={`/showcase/home-${theme}.webp`}
            alt={`Oh My Tab ${theme === "dark" ? "深色" : "浅色"}主题，包含书签文件夹、日历和像素组件`}
          />
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading">
          <h2>凑近一点看。</h2>
        </div>
        <div className="detail-grid">
          {details.map((detail) => (
            <article
              className={`detail-card detail-card--${detail.tone}`}
              key={detail.title}
            >
              <div className="detail-art">
                <svg viewBox={detail.view} role="img" aria-label={detail.title}>
                  <image
                    href={`/showcase/${detail.image}.webp`}
                    width="1200"
                    height={detail.image === "home-dark" ? 920 : 460}
                  />
                </svg>
              </div>
              <div className="detail-copy">
                <h3>{detail.title}</h3>
                <p>{detail.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-section" id="showcase">
        <div className="section-heading section-heading--split">
          <div>
            <h2>井井有条，也有一点可爱。</h2>
          </div>
        </div>
        <div className="showcase-list">
          <article className="showcase-item">
            <div className="showcase-copy">
              <h3>常用网站，各有位置</h3>
              <p>用文件夹收起一组站点，展开后依然可以直接浏览和打开。</p>
            </div>
            <div className="showcase-shot">
              <img
                loading="lazy"
                width="2400"
                height="920"
                src="/showcase/organize.webp"
                alt="展开文件夹浏览常用网站的产品界面"
              />
            </div>
          </article>
          <article className="showcase-item showcase-item--reverse">
            <div className="showcase-copy">
              <h3>每天，也留一点小爱好</h3>
              <p>日历、待办、像素花盆和点阵画布，共享同一张自由画布。</p>
            </div>
            <div className="showcase-shot">
              <img
                loading="lazy"
                width="2400"
                height="920"
                src="/showcase/widgets.webp"
                alt="日历、待办、像素花盆和点阵画布组件"
              />
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
