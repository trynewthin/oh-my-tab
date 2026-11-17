import { readFileSync, writeFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

type Channel = "ci" | "nightly" | "stable"
type Context = {
  event: string
  ref: string
  sha: string
  runNumber: string
  date: string
  version: string
  manifestVersion: string
}

export function releasePlan(context: Context) {
  const { event, ref, sha, runNumber, date, version, manifestVersion } = context
  if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version) ||
    version !== manifestVersion
  )
    throw new Error(
      "package.json and manifest.json must have the same X.Y.Z version"
    )
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid commit SHA")
  let channel: Channel = "ci"
  let release = false
  let tag = ""
  let versionName = version
  if (event === "push" && ref.startsWith("refs/tags/")) {
    tag = ref.slice("refs/tags/".length)
    if (tag === `v${version}`) channel = "stable"
    else if (
      tag.startsWith(`v${version}-nightly.`) &&
      /^[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*$/.test(
        tag.slice(`v${version}-nightly.`.length)
      )
    ) {
      channel = "nightly"
      versionName = tag.slice(1)
    } else
      throw new Error(
        "Release tags must match the current version: vX.Y.Z or vX.Y.Z-nightly.<identifier>"
      )
    release = true
  } else if (
    (event === "push" || event === "workflow_dispatch") &&
    ref === "refs/heads/nightly"
  ) {
    if (!/^[1-9]\d*$/.test(runNumber) || !/^\d{8}$/.test(date))
      throw new Error("Invalid nightly build identifier")
    channel = "nightly"
    versionName = `${version}-nightly.${date}.${runNumber}`
    tag = `v${versionName}`
    release = true
  } else if (
    ref === "refs/heads/stable" &&
    (event === "push" || event === "workflow_dispatch")
  )
    channel = "stable"
  return {
    channel,
    release,
    tag,
    version_name: versionName,
    package_name: `oh-my-tab-${channel === "ci" ? `${version}-${sha.slice(0, 7)}` : versionName}`,
  }
}

export function labelManifest<
  T extends { version: string; version_name?: string },
>(manifest: T, channel: string, versionName: string) {
  const result = { ...manifest }
  if (channel === "nightly") {
    if (!versionName.startsWith(`${manifest.version}-nightly.`))
      throw new Error("Nightly label must match the manifest version")
    result.version_name = versionName
  } else if (channel === "stable" || channel === "ci")
    delete result.version_name
  else throw new Error("Unknown release channel")
  return result
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv[2] === "--label") {
    const file = "dist/manifest.json"
    const manifest = labelManifest(
      JSON.parse(readFileSync(file, "utf8")),
      process.env.RELEASE_CHANNEL ?? "",
      process.env.RELEASE_VERSION_NAME ?? ""
    )
    writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
  } else {
    const plan = releasePlan({
      event: process.env.GITHUB_EVENT_NAME ?? "",
      ref: process.env.GITHUB_REF ?? "",
      sha: process.env.GITHUB_SHA ?? "",
      runNumber: process.env.GITHUB_RUN_NUMBER ?? "",
      date: new Date().toISOString().slice(0, 10).replaceAll("-", ""),
      version: JSON.parse(readFileSync("package.json", "utf8")).version,
      manifestVersion: JSON.parse(readFileSync("public/manifest.json", "utf8"))
        .version,
    })
    for (const [key, value] of Object.entries(plan))
      console.log(`${key}=${value}`)
  }
}
