import { policySections } from "../content/privacy"

export function PrivacyContent() {
  return (
    <main className="policy-page">
      <header className="policy-hero">
        <p className="eyebrow">Privacy at Oh My Tab</p>
        <h1>隐私政策</h1>
        <p>
          Oh My Tab 不运营收集扩展数据的服务器，也不集成广告或分析追踪服务。
          这里说明哪些数据留在本地，以及你主动启用联网功能时会发生什么。
        </p>
        <time dateTime="2026-09-13">更新日期：2026 年 9 月 13 日</time>
      </header>

      <section className="policy-summary" aria-label="隐私摘要">
        <article>
          <span>01</span>
          <strong>默认留在本地</strong>
          <p>书签、布局、设置和图片保存在当前设备。</p>
        </article>
        <article>
          <span>02</span>
          <strong>联网需要主动开启</strong>
          <p>联想、图标和 WebDAV 都由你选择并授权。</p>
        </article>
        <article>
          <span>03</span>
          <strong>随时可以停止</strong>
          <p>你可以关闭服务、撤销权限或清除本地数据。</p>
        </article>
      </section>

      <div className="policy-layout">
        <aside>
          <p>目录</p>
          <nav aria-label="隐私政策目录">
            {policySections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>
        <div className="policy-body">
          {policySections.map((section) => (
            <section id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
