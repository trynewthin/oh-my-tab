import type { SiteResources } from "../types"

const resources: SiteResources = {
  language: {
    switchLabel: "Switch language",
  },
  header: {
    brandLabel: "Oh My Tab home",
    navLabel: "Main navigation",
    features: "Features",
    showcase: "Interface",
    privacy: "Privacy",
    download: "Download",
    chromeStore: "Chrome Web Store",
    githubLabel: "Visit GitHub",
  },
  footer: {
    invitation: "Arrange it your way.",
    install: "Start arranging",
    installLabel: "Install Oh My Tab from the Chrome Web Store",
    stageLabel: "Oh My Tab · View the open source project",
  },
  landing: {
    hero: {
      titleLead: "Open a new page, ",
      titleTail: "settle back into your own rhythm.",
      chromeStore: "Go to Chrome Web Store",
      release: "Download the latest release",
      themeLabel: "Preview theme",
      themeDark: "Dark",
      themeLight: "Light",
      previewAltDark:
        "Oh My Tab dark theme with bookmark folders, a calendar, and pixel widgets",
      previewAltLight:
        "Oh My Tab light theme with bookmark folders, a calendar, and pixel widgets",
    },
    features: {
      heading: "Take a closer look.",
      details: {
        colors: {
          title: "Colour lives in the details.",
          text: "Soft backgrounds and fine dot grids give every group of bookmarks its own character.",
        },
        todos: {
          title: "Cross off the day, gently.",
          text: "Todos get rounded outlines too. Finish one and leave behind a small check mark.",
        },
        calendar: {
          title: "The days keep their own colour.",
          text: "Month, date, and today's place, laid out without a sound.",
        },
        plant: {
          title: "Grow a flower, draw a flower.",
          text: "A pixel plant and a dot-matrix canvas. When the work is done, you can play a while.",
        },
      },
    },
    showcase: {
      heading: "Neatly ordered, and a little bit charming.",
      organize: {
        title: "Every site has its place",
        text: "Tuck a set of sites into a folder; expand it and you can still browse and open them directly.",
      },
      organizeAlt:
        "Product interface with an expanded folder for browsing bookmarks",
      widgets: {
        title: "A little hobby, every day",
        text: "Calendar, todos, pixel planter, and dot-matrix canvas share the same free canvas.",
      },
      widgetsAlt:
        "Calendar, todo, pixel planter, and dot-matrix canvas widgets",
    },
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "Oh My Tab runs no server that collects extension data and bundles no advertising or analytics tracking. This page explains what stays on your device and what happens when you choose to enable a network feature.",
    updatedLabel: "Updated: September 24, 2026",
    summaryLabel: "Privacy summary",
    summary: {
      local: {
        title: "Local by default",
        text: "Bookmarks, layout, settings, and images are stored on this device.",
      },
      consent: {
        title: "Networking needs your consent",
        text: "Suggestions, favicons, WebDAV, and manual weather, GitHub, and RSS requests are chosen and authorised by you.",
      },
      revoke: {
        title: "Stop at any time",
        text: "You can turn services off, revoke permissions, or clear local data.",
      },
    },
    tocLabel: "Privacy policy contents",
    sections: {
      "local-data": {
        title: "Local data",
        paragraphs: [
          "Site titles and links, folders, layout, website shortcuts and action settings in the top bar, search engines, preferences, dot-matrix images, and plant progress are stored in Chrome local storage; the development preview uses IndexedDB. Original background images and the favicon cache are managed by the same storage layer. Widget notes, countdown dates, time zones, timer progress, manual weather coordinates, public repository names, feed URLs, and locally re-encoded photo widgets are also stored locally.",
          "When you use the toolbar quick bookmark, the extension reads only the current tab's title and URL to fill the bookmark form; it does not continuously read your browsing history. After you grant permission to import browser bookmarks, the extension reads bookmark titles, URLs, and folder structure to add them incrementally to your homepage; it never modifies, deletes, or continuously watches your existing browser bookmarks.",
          "Bookmark import, image cropping, and dot-matrix conversion all happen locally. Background images are kept as their original bytes and are sent to your own server only when you choose to upload a backup over WebDAV.",
        ],
      },
      "network-services": {
        title: "Search and optional network services",
        paragraphs: [
          "When you submit a search, the keywords go to your browser's default search service or to a search engine you selected yourself, and that service's privacy policy applies.",
          "Search suggestions are off by default. Once enabled and authorised, a 250-millisecond pause sends up to 200 characters of keywords to the suggestion service of the Google, Microsoft Bing, DuckDuckGo, Yahoo, Brave, Ecosia, or Yandex engine currently selected. Browser default, Startpage, and custom engines never request online suggestions.",
          "Favicon downloads are off by default. Once enabled and authorised, a cache miss or manual refresh for a bookmark or top-bar website shortcut sends the site domain to Favicon.im, and to DuckDuckGo if that fails. Requests contain no site names, full URL paths, or query parameters.",
          "Weather, GitHub, and RSS widgets never load automatically. Only a Load or Refresh click requests the exact HTTPS host permission and sends the configured coordinates, public repository identifier, or feed URL directly to that service. No device geolocation, GitHub account, access token, proxy, or article HTML is used. Feed query parameters are stored with the feed URL, so do not enter secrets. Responses are limited to 1 MiB, kept only in page memory, and are not backed up.",
          "These requests use HTTPS and carry no cookies or referrer URL; the services still receive your IP address and the network information needed to handle the request, and may retain logs under their own policies.",
        ],
      },
      webdav: {
        title: "Optional WebDAV backup",
        paragraphs: [
          "You may enter your own HTTPS WebDAV directory and account details. When you connect, upload, or download, the extension sends credentials and the corresponding request directly to the server you chose; developer servers are not involved.",
          "An uploaded ZIP contains site titles and links, layout, settings, dot-matrix images, plant progress, tutorial state, original background images, widget settings, notes, timer progress, countdown dates, time zones, weather coordinates, feed URLs, repository identifiers, and locally re-encoded widget photos. The server address and username are stored on this device; the password is kept in memory only while the settings panel is open and is never written to local backups or sync files.",
          "Data is never uploaded automatically on a schedule. Overwriting a cloud backup and restoring local data both require confirmation; deleting a connection removes only the local connection details, not your local content or the backups on the server.",
        ],
      },
      control: {
        title: "Control, retention, and deletion",
        paragraphs: [
          "You can turn network services off in Settings and revoke site or bookmark permissions in your browser's extension management page. Manual widgets stop making requests when you stop clicking Load or Refresh, and revoking their site permission prevents later loads. No new service requests are made after disabling or revoking a service; data already sent cannot be recalled, and existing favicon caches remain until you clear them.",
          'Bookmarks can be deleted on the homepage. "Cache → Manage" in Settings shows per-category usage and clears the data you select; images left untouched for the past day are not cleared yet. Uninstalling the extension removes its local storage, while ZIP files and WebDAV backups you already exported must be deleted separately in their own locations.',
          "ZIP backups are unencrypted and contain site links, settings, original background images, notes, locally re-encoded widget photos, coordinates, repository identifiers, and full feed URLs; share them only with recipients you trust. Privacy consents and WebDAV connection details are not carried in a backup import. Legacy localStorage data is kept only as a migration fallback and is deleted along with the extension on uninstall.",
        ],
      },
      "use-and-sharing": {
        title: "How data is used and sharing limits",
        paragraphs: [
          "User data is used only to provide the features described above. It is never sold, and never used for advertising, credit assessment, or purposes unrelated to the product's features. Oh My Tab's use of user data complies with the Chrome Web Store User Data Policy, including the Limited Use requirements.",
          "When you use a third-party search, favicon, WebDAV, weather, GitHub, or RSS service, data is received by the service you chose, and its retention and deletion practices are governed by that service's own policy. The developer cannot promise a third party's log retention period.",
        ],
      },
      contact: {
        title: "Contact and policy updates",
        paragraphs: [
          "The support address is an172048@outlook.com. You can also file issues through GitHub Issues; please do not include private bookmarks, account details, or other sensitive data in public reports.",
          "When our data practices change, we will update this policy and, where law or platform rules require it, notify you again and ask for consent.",
        ],
      },
    },
  },
}

export default resources
