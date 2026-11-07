import * as path from 'node:path';
import { defineConfig, type RouteMeta } from '@rspress/core';
import { pluginSitemap } from '@rspress/plugin-sitemap';

const SITE_URL = 'https://renmori.mewbaka.cn';

const OG_LOCALE: Record<string, string> = { zh: 'zh_CN', en: 'en_US', ja: 'ja_JP' };

// Search terms people actually use: the engine name, the archive/script formats and the tools to stop
const KEYWORDS: Record<string, string> = {
  zh: "RenMori, renpy 加密, renpy 防解包, renpy 反解包, renpy 反破解, renpy 防反编译, rpa 加密, rpyc 加密, unrpyc 防止, unrpa 防止, un.rpyc, 视觉小说加密, GalGame 加密, 游戏资源加密",
  en: "RenMori, renpy encryption, protect renpy game, renpy anti-decompile, prevent unrpyc, stop unrpa, encrypt rpa, protect rpyc, un.rpyc, visual novel asset protection, anti-unpacking",
  ja: "RenMori, Ren'Py 暗号化, renpy 解析対策, 逆コンパイル対策, アンパック対策, unrpyc 対策, unrpa 対策, rpa 暗号化, 素材 抜き出し 防止, ノベルゲーム 暗号化",
};

// Fallback page description (404) and the structured-data description
const DESCRIPTION: Record<string, string> = {
  zh: "免费可商用的 Ren'Py 游戏加密与防解包工具，让 unrpa、rpatool、unrpyc 等解包与反编译工具失效",
  en: "Free encryption and anti-unpacking tool for Ren'Py games that stops unrpa, rpatool and unrpyc",
  ja: "unrpa や unrpyc による抜き出しを防ぐ、無料で商用利用できる Ren'Py ゲームの暗号化・アンパック対策ツール",
};

const OG_IMAGE_ALT: Record<string, string> = {
  zh: "RenMori - Ren'Py 游戏加密与防解包工具",
  en: "RenMori - Ren'Py encryption and anti-unpacking tool",
  ja: "RenMori - Ren'Py ゲームの暗号化・アンパック対策ツール",
};

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': 'https://mewbaka.cn/#organization',
  name: 'MewBaka',
  alternateName: '笨猫工作室 MewBaka Studio',
  url: 'https://mewbaka.cn',
};

// Structured data for the home page of each locale
const softwareJsonLd = (lang: string, url: string) =>
  `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      ORGANIZATION,
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: 'RenMori',
        url,
        inLanguage: lang,
        publisher: { '@id': ORGANIZATION['@id'] },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'RenMori',
        url,
        description: DESCRIPTION[lang],
        inLanguage: lang,
        image: `${SITE_URL}/og-image.png`,
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: "Ren'Py game encryption",
        operatingSystem: 'Windows, macOS, Linux',
        softwareRequirements: 'Python 3.9+, Ren\'Py 8.x',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        downloadUrl: 'https://pypi.org/project/renmori/',
        sameAs: ['https://github.com/MewBaka/RenMori', 'https://pypi.org/project/renmori/'],
        publisher: { '@id': ORGANIZATION['@id'] },
      },
    ],
  })}</script>`;

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'RenMori',
  icon: '/renmori-icon.svg',
  logo: '/renmori-icon.svg',
  logoText: 'RenMori',
  siteOrigin: SITE_URL,
  plugins: [pluginSitemap({ siteUrl: SITE_URL })],
  head: [
    ['meta', { name: 'theme-color', content: '#c65b3b' }],
    ['meta', { property: 'og:site_name', content: 'RenMori' }],
    ['meta', { property: 'og:image', content: `${SITE_URL}/og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${SITE_URL}/og-image.png` }],
    ['link', { rel: 'apple-touch-icon', href: '/renmori-icon.png' }],
    (route) => ['link', { rel: 'canonical', href: SITE_URL + route.routePath }],
    (route) => ['meta', { property: 'og:url', content: SITE_URL + route.routePath }],
    (route) => ['meta', { property: 'og:locale', content: OG_LOCALE[route.lang] ?? 'zh_CN' }],
    ...Object.keys(OG_LOCALE).map(
      (lang) =>
        (route: RouteMeta): [string, Record<string, string>] | undefined =>
          lang === route.lang ? undefined : ['meta', { property: 'og:locale:alternate', content: OG_LOCALE[lang] }],
    ),
    (route) => ['meta', { property: 'og:image:alt', content: OG_IMAGE_ALT[route.lang] ?? OG_IMAGE_ALT.zh }],
    (route) => ['meta', { name: 'keywords', content: KEYWORDS[route.lang] ?? KEYWORDS.zh }],
    // Rspress emits the zh/en/ja hreflang links (absolute via siteOrigin); add x-default
    (route) => ['link', { rel: 'alternate', hreflang: 'x-default', href: SITE_URL + route.pureRoutePath }],
    (route) =>
      route.pureRoutePath === '/' ? softwareJsonLd(route.lang, SITE_URL + route.routePath) : undefined,
  ],
  globalStyles: path.join(__dirname, 'theme/index.css'),
  lang: 'zh',
  locales: [
    {
      lang: 'zh',
      label: '简体中文',
      title: 'RenMori',
      description: DESCRIPTION.zh,
    },
    {
      lang: 'en',
      label: 'English',
      title: 'RenMori',
      description: DESCRIPTION.en,
    },
    {
      lang: 'ja',
      label: '日本語',
      title: 'RenMori',
      description: DESCRIPTION.ja,
    },
  ],
  route: {
    cleanUrls: true,
  },
  // Generates llms.txt and a Markdown copy of every page for the LLM UI below
  llms: true,
  themeConfig: {
    // Copy Markdown / Copy Markdown link / Open in ChatGPT / Open in Claude under each H1
    llmsUI: true,
    // Rendered by HomeFooter on the home page and by DocFooter (theme/index.tsx) on doc pages
    footer: {
      // The HarmonyOS Sans license requires a prominent notice that the font is used
      message:
        '© 2026 笨猫工作室 MewBaka Studio. All Rights Reserved.<br />Typeface: <a href="/fonts/HarmonyOS-Sans-LICENSE.txt">HarmonyOS Sans</a> © Huawei Device Co., Ltd.',
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/MewBaka/RenMori',
      },
    ],
  },
});
