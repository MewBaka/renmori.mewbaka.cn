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

Vercel 读取 `vercel.json`：构建命令为 `npm run build`，输出目录为 `doc_build`，并开启 `cleanUrls` 以匹配 Rspress 的 `route.cleanUrls`。此外：

- 生产别名 `renmorimewbakacn.vercel.app` 308 重定向到 `renmori.mewbaka.cn`，其余 `*.vercel.app` 地址（预览与单次部署）返回 `X-Robots-Tag: noindex`
- 带末尾斜杠的文档地址 308 重定向到无斜杠版本（语言首页 `/en/`、`/ja/` 除外，它们的 canonical 本身带斜杠）
- `.md` 副本与 `llms*.txt` 返回 `X-Robots-Tag: noindex`，避免与 HTML 页面重复收录
- `/static/` 下带哈希的资源设置一年的 `immutable` 缓存

## SEO 约定

- 每页 frontmatter 的 `title` 写成「页面名：搜索关键词」，侧边栏仍显示短名称（由各目录 `_meta.json` 的 `label` 固定）
- 首页标题由 frontmatter 的 `titleSuffix` 拼接为 `RenMori - …`，`description` 写完整的一句话卖点
- 首页 hero 由 `theme/components/HomeHero.tsx` 渲染，品牌名与副标题位于同一个 `<h1>` 内
