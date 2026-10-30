---
title: 给开发者的提示
description: 使用 RenMori 保护并发行游戏的开发者须了解的授权范围、第三方许可义务、密钥与备份管理，以及发行前检查清单
---

# 给开发者的提示

本页面向使用 RenMori 保护自己作品的开发者与发行方，说明许可证允许与禁止的行为、随游戏分发时须履行的第三方许可义务，以及发行前应完成的检查。条款以 [RenMori License 1.0](https://github.com/MewBaka/RenMori/blob/main/LICENSE) 为准，免责条款参阅 [免责声明](./disclaimer.md)。

## 许可证允许的行为

| 行为 | 依据 |
|---|---|
| 免费使用 RenMori 保护任意 Ren'Py 游戏，包括商业作品，不收取版税 | 许可证第 1 条 |
| 出售受保护的游戏，并在其中随附 RenMori 运行时，无需付费 | 许可证第 2 条 |
| 为保护自己的游戏而修改 RenMori，仅限自用 | 许可证第 3 条 |
| 如实声明游戏由 RenMori 保护 | 许可证第 5 条 |

使用授权不论游戏自身的内容或授权状况如何均适用。RenMori 运行时只能以嵌入在你自己的受保护游戏中的形式离开你手中。

## 许可证禁止的行为

无论收费与否，均不得：

- 以产品或服务的形式出售、转售、出租、租赁、再许可或分发 RenMori 本身或其任何实质部分，不论是否经过修改
- 使用 RenMori 为他人保护或加密 Ren'Py 游戏并收取费用或开展商业服务，例如“Ren'Py 代加密”服务
- 向第三方分发 RenMori 的修改版本，或将任何修改版本表示为 RenMori
- 在如实声明游戏由 RenMori 保护之外，使用“RenMori”名称或标识，例如用于其他产品的名称或宣传

超出授权范围的使用会终止许可证授予的权利，但已经合法分发的游戏不受影响。

:::tip
若不确定某种使用方式是否在授权范围内，例如为合作方的作品执行保护，或在工具、引擎、服务中集成 RenMori，请先通过 [team@mewbaka.cn](mailto:team@mewbaka.cn) 联系确认。
:::

## 在游戏中注明 RenMori

许可证不要求在游戏中注明 RenMori。如需注明，可以在致谢名单或技术说明中使用如实的表述，例如：

```
资源保护：RenMori（https://renmori.mewbaka.cn）
```

不要使用可能使人误以为游戏由 RenMori 作者开发、发行或认可的表述，也不要修改 RenMori 标识。

## 第三方许可义务

受保护的发行版构建仍然包含 Ren'Py 引擎及其捆绑的第三方组件。RenMori 不改变这些组件的许可条款，相应的义务仍由发行游戏的一方承担。

| 组件 | 义务 |
|---|---|
| Ren'Py | Ren'Py 以宽松的类 MIT 许可发布，部分捆绑组件采用各自的条款。随游戏保留 Ren'Py 自身的许可证与声明，不要删除发行版构建中的相关文件 |
| FFmpeg | Ren'Py 捆绑的 FFmpeg 用于音视频解码，采用 LGPL-2.1 及以上版本，部分构建配置为 GPL。随游戏附带 FFmpeg 的许可证文本，并按其要求提供源码获取方式；确认实际随附的 FFmpeg 构建的许可类型 |
| 其他捆绑组件 | 按 [NOTICE](https://github.com/MewBaka/RenMori/blob/main/NOTICE) 与各组件自身的许可证履行义务 |

`renmori protect` 的基线流程只处理 `game/` 目录，不改动 `renpy/`、`lib/` 与构建根目录中的引擎文件及其许可文件。按照 NOTICE 中的要求，RenMori 的保护方案不得以妨碍 LGPL 重新链接的方式静态绑定 FFmpeg。发行前请确认上述许可文件仍保留在发行版中。

## 密钥与备份

- **备份目录**：原地保护生成的 `<dir>_bak` 包含全部明文资源与脚本，绝不能随发行版上传或分发
- **基线密钥**：通过 `[keys]` 指定的环境变量保存在 CI 的 Secret 中，不要写入配置文件、脚本或版本库。基线格式会将密钥写入随游戏分发的加载器扩展，固定密钥只用于保证构建的一致性，不能提高基线的安全性
- **完整保护**：密钥由闭源插件在构建时派生，开发者无需也无法单独管理
- **构建清单**：`renmori-manifest.json` 不包含密钥，但基线清单列出了全部资产的路径与大小。是否随发行版保留由你决定，删除前请先完成 `renmori verify`
- **源码工程**：RenMori 只保护发行版构建，源码工程与 `.rpy` 剧本仍需通过版本库权限等方式自行保护

## 发行前检查清单

- [ ] 保护对象是 Ren'Py 启动器生成的全新发行版构建
- [ ] 正式发行使用完整保护，而非 `--strength baseline`
- [ ] 锁定处于开启状态，未使用 `--no-lockdown`
- [ ] 未使用 `--keep-plaintext`
- [ ] `exclude` 与 `keep_on_disk` 中没有脚本文件，也没有不必要的资源
- [ ] `renmori verify` 通过
- [ ] 已在全部目标平台上实际启动并完整游玩，覆盖存档、读档、CG 鉴赏、音乐鉴赏、视频播放与多语言切换
- [ ] `renmori.rmc` 与 `renmori.rpe` 均包含在发行版中
- [ ] 发行版中不包含 `_bak` 备份目录、密钥文件或源码工程
- [ ] 受保护目录在保护之后没有再次经过 Ren'Py 启动器构建
- [ ] Ren'Py 与 FFmpeg 等组件的许可文件仍保留在发行版中
- [ ] 发布到 Steam 时未叠加 Steam DRM 可执行文件包装，参阅 [发布到 Steam](../integration/steam-release.md)

## 兼容性与测试

RenMori 面向 Ren'Py 8.x（Python 3），不支持 Ren'Py 7.x 及更早的 Python 2 版本。运行时已在 Windows、Linux 与 macOS 的真实 Ren'Py 引擎中验证，Steam Deck（Proton）上的运行验证仍在进行中。由于团队暂无 Steam 开发者权限，Steam SDK、Steam 叠加层等相关功能尚未经过实机测试。

自定义了 Ren'Py 加载流程、使用了直接读取磁盘文件的第三方插件，或在 Python 代码中通过文件系统 API 而非 `renpy.loader` 读取 `game/` 中资源的项目，可能需要为相应文件配置 `keep_on_disk`，并在保护后重点测试相关功能。

## 隐私

RenMori 运行时只在引擎内部解密数据，不收集玩家信息，也不发起网络请求。加载器框架开源的目的之一正是让开发者与玩家能够验证这一点。`renmori` CLI 仅在首次获取闭源插件时访问网络，可通过 `RENMORI_NO_DOWNLOAD` 完全禁止。

## 获取帮助

- 授权范围与技术协助：[team@mewbaka.cn](mailto:team@mewbaka.cn)
- 问题反馈：[GitHub Issues](https://github.com/MewBaka/RenMori/issues)，提交要求参阅 [提交要求](./contributing.md#问题反馈)
- 安全漏洞：请勿公开提交，参阅 [安全漏洞报告](./contributing.md#安全漏洞报告)
