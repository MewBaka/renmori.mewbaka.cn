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
  ],
  route: {
    cleanUrls: true,
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/MewBaka/RenMori',
      },
    ],
  },
});
