# renmori.mewbaka.cn

[RenMori](https://github.com/MewBaka/RenMori) 文档站源码，基于 [Rspress](https://rspress.rs) 构建，部署于 Vercel

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

产物输出至 `doc_build/`，可通过 `npm run preview` 本地预览

## 目录结构

| 路径 | 说明 |
|---|---|
| `docs/zh/` | 简体中文文档（默认语言，无路径前缀） |
| `docs/en/` | 英文文档（`/en/` 前缀） |
| `docs/ja/` | 日文文档（`/ja/` 前缀） |
| `docs/public/` | 静态资源，含 Logo 与站点图标 |
| `theme/index.tsx` | 主题覆盖，在首页 Hero 按钮下方插入安装命令框 |
| `theme/components/` | 自定义组件，如 pip / uv / pipx 安装命令标签页 |
| `theme/index.css` | 品牌色等全局样式 |
| `rspress.config.ts` | 站点配置 |

## 部署

Vercel 读取 `vercel.json`：构建命令为 `npm run build`，输出目录为 `doc_build`，并开启 `cleanUrls` 以匹配 Rspress 的 `route.cleanUrls`
