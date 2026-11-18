import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"
import { parse } from "yaml"
import {
  releaseNoteLocales,
  validateReleaseNotes,
  type ReleaseNotes,
} from "../../src/lib/release-notes.ts"

type Channel = "nightly" | "stable"
type PublishedRelease = {
  tag_name: string
  draft: boolean
  prerelease: boolean
  published_at: string | null
}

export function requireUpdatedNotes(
  current: ReleaseNotes,
  previous: ReleaseNotes
) {
  for (const locale of releaseNoteLocales) {
    const previousEntries = new Set(previous.notes[locale])
    if (!current.notes[locale].some((note) => !previousEntries.has(note)))
      throw new Error(`Write new ${locale} release notes before publishing`)
  }
}

export function releaseNotesMarkdown(notes: ReleaseNotes, channel: Channel) {
  const bullets = (locale: (typeof releaseNoteLocales)[number]) =>
    notes.notes[locale].map((note) => `- ${note}`).join("\n")
  return (
    [
      "## 更新日志",
      bullets("zh-CN"),
      "## Release notes",
      bullets("en"),
      "## 安装",
      "下载 ZIP，解压后在 Chrome / Edge 扩展管理页开启开发者模式，选择「加载已解压的扩展程序」。CRX 使用固定密钥签名，浏览器可能限制商店外 CRX 安装。",
      ...(channel === "nightly"
        ? ["Nightly 预发布仅通过 GitHub Releases 分发。"]
        : []),
    ].join("\n\n") + "\n"
  )
}

function previousReleaseTag(repository: string, channel: Channel, tag: string) {
  const pages: PublishedRelease[][] = JSON.parse(
    execFileSync(
      "gh",
      [
        "api",
        "--paginate",
        "--slurp",
        `repos/${repository}/releases?per_page=100`,
      ],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
    )
  )
  const published = pages.flat().filter((release) => !release.draft)
  // A rerun of an already published tag should reproduce its original notes.
  if (published.some((release) => release.tag_name === tag)) return
  const tagPattern =
    channel === "nightly"
      ? /^v\d+\.\d+\.\d+-nightly\.[\w.-]+$/
      : /^v\d+\.\d+\.\d+$/
  return published
    .filter(
      (release) =>
        release.published_at &&
        release.prerelease === (channel === "nightly") &&
        tagPattern.test(release.tag_name)
    )
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .at(0)?.tag_name
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const {
    RELEASE_CHANNEL: channel,
    RELEASE_VERSION_NAME: version,
    GH_REPO,
  } = process.env
  if ((channel !== "nightly" && channel !== "stable") || !version)
    throw new Error("A planned release channel and version are required")
  const path =
    channel === "nightly"
      ? "src/content/nightly-release.yaml"
      : "src/content/current-release.yaml"
  const current = validateReleaseNotes(parse(readFileSync(path, "utf8")))
  const baseVersion =
    channel === "nightly" ? version.split("-nightly.")[0] : version
  if (current.version !== baseVersion)
    throw new Error(`Update ${path} to version ${baseVersion}`)

  if (GH_REPO) {
    const previousTag = previousReleaseTag(GH_REPO, channel, `v${version}`)
    if (previousTag) {
      const previousRef = `refs/tags/${previousTag}`
      // Another release may finish after this runner checked out the repo.
      execFileSync("git", ["fetch", "origin", `${previousRef}:${previousRef}`])
      const git = (args: string[]) =>
        execFileSync("git", args, { encoding: "utf8" })
      if (git(["ls-tree", "--name-only", previousRef, "--", path]).trim()) {
        const previous = validateReleaseNotes(
          parse(git(["show", `${previousRef}:${path}`]))
        )
        requireUpdatedNotes(current, previous)
      }
    }
  }
  process.stdout.write(releaseNotesMarkdown(current, channel))
}
