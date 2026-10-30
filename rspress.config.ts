import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'RenMori',
  icon: '/renmori-icon.svg',
  logo: '/renmori-icon.svg',
  logoText: 'RenMori',
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
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/MewBaka/RenMori',
      },
    ],
  },
});
