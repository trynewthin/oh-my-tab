import type { GridItem } from "@/lib/grid/types"

// Sample grid content seeded in development. Names are product-owned defaults,
// so they resolve through the active language when the grid is first seeded,
// not when this module loads.
function buildMockGridItems(t: (key: string) => string): GridItem[] {
  return baseMockGridItems(t).concat(additionalMockGridItems(t))
}

function baseMockGridItems(
  t: (key: string) => string
): GridItem[] {
  return [
  {
    id: "mock-github",
    kind: "tab",
    name: "GitHub",
    url: "https://github.com",
    size: "small",
    color: "#8b7cc8",
  },
  {
    id: "mock-figma",
    kind: "tab",
    name: "Figma",
    url: "https://www.figma.com",
    size: "small",
    color: "#eb9970",
  },
  {
    id: "mock-notion",
    kind: "tab",
    name: "Notion",
    url: "https://www.notion.so",
    size: "medium",
    color: "#6f96b3",
  },
  {
    id: "mock-design",
    kind: "folder",
    name: t("grid.mock.designFolder"),
    size: "small",
    color: "#b58ac8",
    tabs: [
      { id: "mock-dribbble", name: "Dribbble", url: "https://dribbble.com" },
      { id: "mock-behance", name: "Behance", url: "https://www.behance.net" },
    ],
  },
  {
    id: "mock-work",
    kind: "folder",
    name: t("grid.mock.workFolder"),
    size: "large",
    color: "#6da99b",
    tabs: [
      { id: "mock-react", name: "React", url: "https://react.dev" },
      { id: "mock-vite", name: "Vite", url: "https://vite.dev" },
      { id: "mock-shadcn", name: "shadcn/ui", url: "https://ui.shadcn.com" },
      {
        id: "mock-typescript",
        name: "TypeScript",
        url: "https://www.typescriptlang.org",
      },
      { id: "mock-mdn", name: "MDN", url: "https://developer.mozilla.org" },
      {
        id: "mock-tailwind",
        name: "Tailwind CSS",
        url: "https://tailwindcss.com",
      },
    ],
  },
  {
    id: "mock-youtube",
    kind: "tab",
    name: "YouTube",
    url: "https://www.youtube.com",
    size: "medium",
    color: "#dc8188",
  },
  ]
}

function additionalMockGridItems(
  t: (key: string) => string
): GridItem[] {
  return [
  {
    id: "mock-more-linear",
    kind: "tab",
    name: "Linear",
    url: "https://linear.app",
    size: "small",
    color: "#6574cf",
  },
  {
    id: "mock-more-wikipedia",
    kind: "tab",
    name: t("grid.mock.wikipedia"),
    url: "https://www.wikipedia.org",
    size: "medium",
    color: "#bc965d",
  },
  {
    id: "mock-more-spotify",
    kind: "tab",
    name: "Spotify",
    url: "https://open.spotify.com",
    size: "small",
    color: "#4f9e70",
  },
  {
    id: "mock-more-photos",
    kind: "tab",
    name: t("grid.mock.unsplash"),
    url: "https://unsplash.com",
    size: "medium",
    color: "#ce805b",
  },
  {
    id: "mock-more-codepen",
    kind: "tab",
    name: "CodePen",
    url: "https://codepen.io",
    size: "small",
    color: "#659ca8",
  },
  {
    id: "mock-more-figjam",
    kind: "tab",
    name: t("grid.mock.figjam"),
    url: "https://www.figma.com/figjam",
    size: "medium",
    color: "#cda44e",
  },
  {
    id: "mock-more-reading",
    kind: "folder",
    name: t("grid.mock.readingFolder"),
    size: "large",
    color: "#cc925b",
    tabs: [
      {
        id: "mock-reading-hn",
        name: "Hacker News",
        url: "https://news.ycombinator.com",
      },
      {
        id: "mock-reading-md",
        name: "MDN Web Docs",
        url: "https://developer.mozilla.org",
      },
      {
        id: "mock-reading-smashing",
        name: "Smashing Magazine",
        url: "https://www.smashingmagazine.com",
      },
      {
        id: "mock-reading-alist",
        name: "A List Apart",
        url: "https://alistapart.com",
      },
      {
        id: "mock-reading-css",
        name: "CSS-Tricks",
        url: "https://css-tricks.com",
      },
      {
        id: "mock-reading-webdev",
        name: t("grid.mock.webdev"),
        url: "https://web.dev",
      },
      {
        id: "mock-reading-josh",
        name: "Josh W. Comeau",
        url: "https://www.joshwcomeau.com",
      },
      {
        id: "mock-reading-paul",
        name: "Paul Graham",
        url: "https://paulgraham.com",
      },
      {
        id: "mock-reading-github",
        name: "GitHub Blog",
        url: "https://github.blog",
      },
      {
        id: "mock-reading-mit",
        name: "MIT Technology Review",
        url: "https://www.technologyreview.com",
      },
    ],
  },
  {
    id: "mock-more-tools",
    kind: "folder",
    name: t("grid.mock.toolsFolder"),
    size: "large",
    color: "#4e9bba",
    dynamicEffect: true,
    tabs: [
      {
        id: "mock-tools-excalidraw",
        name: "Excalidraw",
        url: "https://excalidraw.com",
      },
      { id: "mock-tools-squoosh", name: "Squoosh", url: "https://squoosh.app" },
      {
        id: "mock-tools-photopea",
        name: "Photopea",
        url: "https://www.photopea.com",
      },
      { id: "mock-tools-regex", name: "RegExr", url: "https://regexr.com" },
      {
        id: "mock-tools-caniuse",
        name: "Can I Use",
        url: "https://caniuse.com",
      },
      { id: "mock-tools-coolors", name: "Coolors", url: "https://coolors.co" },
      {
        id: "mock-tools-diagrams",
        name: "diagrams.net",
        url: "https://app.diagrams.net",
      },
      {
        id: "mock-tools-svg",
        name: "SVGOMG",
        url: "https://jakearchibald.github.io/svgomg",
      },
    ],
  },
  {
    id: "mock-more-music",
    kind: "folder",
    name: t("grid.mock.musicFolder"),
    size: "small",
    color: "#c5708d",
    tabs: [
      {
        id: "mock-music-bandcamp",
        name: "Bandcamp",
        url: "https://bandcamp.com",
      },
      {
        id: "mock-music-soundcloud",
        name: "SoundCloud",
        url: "https://soundcloud.com",
      },
      {
        id: "mock-music-npr",
        name: "NPR Podcasts",
        url: "https://www.npr.org/podcasts",
      },
      {
        id: "mock-music-spotify",
        name: "Spotify",
        url: "https://open.spotify.com",
      },
    ],
  },
  {
    id: "mock-more-inbox",
    kind: "folder",
    name: t("grid.mock.inboxFolder"),
    size: "small",
    color: "#829f59",
    tabs: [],
  },
  ]
}

export const mockGridItems = buildMockGridItems
