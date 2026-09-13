import logoUrl from "../../../public/icons/icon-128.png"

const repositoryUrl = "https://github.com/trynewthin/oh-my-tab"
const releaseUrl = `${repositoryUrl}/releases/latest`
const privacyUrl = "/privacy"

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Oh My Tab 首页">
        <img src={logoUrl} alt="" />
        <span>Oh My Tab</span>
      </a>
      <nav aria-label="主导航">
        <a href="/#features">功能</a>
        <a href="/#showcase">界面</a>
        <a href={privacyUrl}>隐私</a>
        <a href={repositoryUrl}>GitHub</a>
      </nav>
      <a className="header-action" href={releaseUrl}>
        下载扩展
      </a>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="brand brand--small" href="/">
        <img src={logoUrl} alt="" />
        <span>Oh My Tab</span>
      </a>
      <p>让新标签页回到你自己的节奏。</p>
      <div>
        <a href={privacyUrl}>隐私政策</a>
        <a href={`${repositoryUrl}/issues`}>问题反馈</a>
      </div>
    </footer>
  )
}

export { releaseUrl, repositoryUrl }
