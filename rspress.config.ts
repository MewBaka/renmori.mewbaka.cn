import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginSitemap } from '@rspress/plugin-sitemap';

const SITE_URL = 'https://renmori.mewbaka.cn';

const OG_LOCALE: Record<string, string> = { zh: 'zh_CN', en: 'en_US', ja: 'ja_JP' };

const KEYWORDS: Record<string, string> = {
  zh: "RenMori, Ren'Py, 视觉小说, GalGame, 资源加密, 封包加密, 反解包, 反编译保护, unrpa, unrpyc, rpa 加密",
  en: "RenMori, Ren'Py, visual novel, asset encryption, archive protection, anti-unpacking, decompilation protection, unrpa, unrpyc",
  ja: "RenMori, Ren'Py, ビジュアルノベル, ノベルゲーム, アセット暗号化, アーカイブ保護, アンパック対策, unrpa, unrpyc",
};

const DESCRIPTION: Record<string, string> = {
  zh: "面向商业 Ren'Py 视觉小说的全量数据保护工具",
  en: "Full-data protection for commercial Ren'Py visual novels",
  ja: "商用 Ren'Py ビジュアルノベル向けの全データ保護ツール",
};

// Structured data for the home page of each locale
const softwareJsonLd = (lang: string, url: string) =>
  `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RenMori',
    url,
    description: DESCRIPTION[lang],
    inLanguage: lang,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Windows, macOS, Linux',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    downloadUrl: 'https://pypi.org/project/renmori/',
    codeRepository: 'https://github.com/MewBaka/RenMori',
    publisher: { '@type': 'Organization', name: 'MewBaka', url: 'https://mewbaka.cn' },
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
    ['meta', { property: 'og:image:alt', content: "RenMori - Ren'Py Resource Protector" }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${SITE_URL}/og-image.png` }],
    ['link', { rel: 'apple-touch-icon', href: '/renmori-icon.png' }],
    (route) => ['link', { rel: 'canonical', href: SITE_URL + route.routePath }],
    (route) => ['meta', { property: 'og:url', content: SITE_URL + route.routePath }],
    (route) => ['meta', { property: 'og:locale', content: OG_LOCALE[route.lang] ?? 'zh_CN' }],
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
      description: '面向商业 Ren\'Py 视觉小说的全量数据保护工具',
    },
    {
      lang: 'en',
      label: 'English',
      title: 'RenMori',
      description: 'Full-data protection for commercial Ren\'Py visual novels',
    },
    {
      lang: 'ja',
      label: '日本語',
      title: 'RenMori',
      description: '商用 Ren\'Py ビジュアルノベル向けの全データ保護ツール',
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
      message: '© 2026 笨猫工作室 MewBaka Studio. All Rights Reserved.',
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
