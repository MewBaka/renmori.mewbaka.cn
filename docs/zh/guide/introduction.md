---
title: "项目简介：Ren'Py 游戏加密与防解包工具"
description: "RenMori 是免费可商用的 Ren'Py 视觉小说加密工具，将脚本、立绘、CG、音频与字体封入加密容器，使 unrpa、rpatool、unrpyc 等解包与反编译工具失效。本页介绍保护范围、适用场景、测试状态与授权"
---

# 项目简介

RenMori 是一款面向商业 Ren'Py 视觉小说的全量数据保护工具，支持 Ren'Py 8.x 引擎。它直接处理 Ren'Py 启动器生成的发行版构建，不改动项目源码。游戏中的脚本、立绘、CG、音频、视频、字体、翻译与配置都会被封入加密容器，仅在运行中的引擎内部解密，玩家机器的磁盘上不会留下明文资源或 `.rpy` 源码。

RenMori 完全免费。名称中的 “Ren” 指 Ren'Py，“Mori” 取自日语单词「守」，意为守护。

RenMori 采用开放核心架构，工具源码公开可见，原生核心以闭源二进制形式分发。开源的 CLI 负责封包、校验与 CI 集成；闭源的原生插件提供完整强度的运行时保护，首次使用时会从公开 Release 自动下载、校验并缓存。需要完全离线运行或不希望使用插件的开发者，可以改用开源的基线格式。

## 核心特性

- **全量加密**：覆盖游戏内全部数据类型，而不仅限于脚本或封包文件
- **零侵入**：在发行版构建上运行，也可直接处理启动器生成的 `.zip` 压缩包
- **默认零配置**：可选的 `renmori.toml` 用于控制分块大小、排除清单、锁定、保护强度与密钥来源
- **适配 CI**：输出机读 JSON 结果，退出码明确，`renmori verify` 可作为流水线门禁
- **发行渠道适配**：提供 [Steam 发行指南](../integration/steam-release.md)，涵盖 Steam 叠加层（Overlay）、DRM 与 Steamworks 的兼容性

## RenMori 保护了什么

RenMori 为 Ren'Py 8.x 构建的游戏输出受保护的发行版，防止游戏数据被非法提取。游戏中的每一项数据，包括脚本、立绘、CG、音频、视频、字体、翻译与配置，都会被封入加密容器，仅在运行中的引擎内部解密。

它可以防御：

- 使用 `unrpa`、`rpatool`、`unrpyc` 等现成解包与反编译工具提取游戏素材与脚本
- 仅调用现成工具的 AI Agent 自动化破解¹
- 批量化、脚本化的自动提取流程

¹ 这一防御已触及离线客户端 DRM 的固有上限：只要能够复现游戏的真实运行环境，或从运行中的进程提取内存，就能在游戏解密资源时取得明文，保护所能抬高的只是所需的时间与成本；能够突破这一上限的只有联网授权或硬件绑定，而这类方案对 GalGame 与视觉小说而言成本高、收益低。

RenMori 并非绝对的防护：在玩家机器上运行的游戏永远无法做到不可破解，RenMori 承诺的是使通用解包工具及调用这些工具的 AI Agent 失效，使每一款作品、每一个版本都需要专家级的全新定向逆向，而非消除全部风险；由于多数逆向者不会在单一作品上投入过多时间，对绝大多数作品而言，RenMori 能够提供有效的保护，完整的分析见[威胁模型](../technical/threat-model.md)。

改 rpa 文件头、混淆 rpyc 等常见防解包做法为什么挡不住 `unrpa` 与 `unrpyc`，以及 RenMori 如何防止解包与反编译，见 [renpy 防解包与反破解指南](./renpy-anti-unpacking.md)。

## RenMori 适合你吗

### 适用场景

- 使用 Ren'Py 8.x（Python 3）开发，准备在 Steam 等平台发行的商业视觉小说
- 担心 `unrpa`、`rpatool`、`unrpyc` 等现成解包与反编译工具提取剧本、立绘、CG 或音频并被二次分发
- 版本更新频繁，希望旧版本的逆向成果无法沿用到新版本
- 希望将保护流程接入 CI，在每次发行版构建后自动完成封包与校验
- 个人或小型团队，不希望为保护方案支付授权费用

### 无法满足的需求

- 要求游戏完全不可破解，任何客户端保护都无法做到，RenMori 也不例外
- 防御录屏，或防御熟练攻击者从运行中的进程提取内存
- 抵御针对单一作品、单一版本长期投入的专家级逆向
- 基于 Ren'Py 7.x 或更早的 Python 2 版本引擎的项目

## 测试状态

运行时已在 Windows、Linux 与 macOS 的真实 Ren'Py 引擎中完成验证，Steam Deck（Proton）上的运行验证仍在进行中。

由于团队暂无 Steam 开发者权限，Steam SDK、Steam 叠加层等相关功能尚未经过测试。如遇到适配或兼容性问题，请通过邮件或在 [GitHub 仓库](https://github.com/MewBaka/RenMori/issues)中提交 Issue 与我们联系，我们将尽力提供支持。

:::warning 发行前测试
发行前请务必在全部目标平台上完成测试。
:::

## 授权

RenMori 采用 [RenMori License 1.0](https://github.com/MewBaka/RenMori/blob/main/LICENSE.zh-CN.md)，这是一份源码可见（source-available）许可，并非 OSI 开源许可。保护任何 Ren'Py 游戏均免费，包括商业作品，运行时可随游戏一同免费再分发。禁止售卖 RenMori 本身或其修改版本，也禁止使用 RenMori 提供收费的「代加密」服务。

完整的免责条款、贡献提交要求与面向开发者的授权说明，参阅 [免责声明](../license/disclaimer.md)、[提交要求](../license/contributing.md) 与 [给开发者的提示](../license/developer-notes.md)。

## 联系我们

如有授权相关问题或需要技术协助，请发送邮件至 [team@mewbaka.cn](mailto:team@mewbaka.cn)。
