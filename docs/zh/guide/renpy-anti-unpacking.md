---
title: "renpy 防解包与反破解：如何防止 unrpa、unrpyc 解包和反编译"
description: "renpy 游戏为什么容易被解包，改 rpa 文件头、混淆 rpyc 等常见防解包方法为何无效，以及如何用 RenMori 防止 unrpa、rpatool 解包与 unrpyc、un.rpyc 反编译，并说明反破解能做到的边界"
---

# renpy 防解包与反破解指南

搜索“renpy 防解包”“renpy 反解包”“renpy 反破解”“unrpyc 防止”的开发者，想解决的通常是同一个问题：游戏发布后，剧本、立绘、CG、音频被 `unrpa`、`rpatool`、`unrpyc` 等现成工具一键提取，再被二次分发。

本页说明 Ren'Py 游戏为什么容易被解包、常见的防解包做法为什么挡不住这些工具、RenMori 如何防止解包与反编译，以及任何客户端保护都做不到的事情。

## 为什么 renpy 游戏这么容易被解包

Ren'Py 自带的两种格式本身都不提供加密：

- **`.rpa` 封包**只是一份索引加上依次拼接的文件，至多带一个 XOR“混淆”密钥
- **`.rpyc` 脚本**是 Ren'Py AST 经 zlib 压缩后的 pickle，反编译器只需反序列化即可还原 `.rpy` 源码

Ren'Py 官方文档承认混淆只能防止随意浏览，主要开发者也以不可行为由关闭了资源加密的功能请求（[renpy/renpy#2546](https://github.com/renpy/renpy/issues/2546)）。因此公开的工具生态几乎完全站在解包一方：

| 工具 | 作用 |
|------|------|
| `unrpa` | 提取 `.rpa` 封包，支持 RPA-1.0 至 4.0 及各类变体 |
| `rpatool`、`RenPack` | 列出、提取、重写 `.rpa` 封包，支持 XOR 密钥 |
| `RenpyEx` | 提取 `.rpa` 与 `.rpyc`，可从 `options.rpy` 自动探测密钥 |
| `unrpyc` | 反编译 `.rpyc`，支持 `--try-harder` 去混淆 |
| `un.rpyc` | 放入 `game/` 目录后随游戏加载，在进程内导出全部脚本 |
| `rpycdec` | 反编译 `.rpyc` / `.rpymc` |

## 常见的 renpy 防解包方法为什么无效

社区流传的防解包做法大多只是让文件“看起来不一样”，而上面这些工具早已针对它们做了处理：

- **重命名 `.rpa`、修改封包头或 `loader.py`**：`unrpa` 支持各类封包变体，`RenpyEx` 还能从 `options.rpy` 自动探测密钥
- **修改 `.rpyc` 魔数，或用 zlib、base64、hex 包裹载荷**：`unrpyc` 的去混淆模块会扫描被改动的文件头，并逐层尝试 zlib、hex、base64、转义解码，最多 10 层
- **把脚本藏进图片、只允许加载白名单内的封包**：要么可被轻易绕过，要么未经验证
- **Ren'Py 自带的混淆**：官方文档明确表示只能防止随意浏览

要真正让这些工具失效，必须彻底放弃 RPA 与标准 pickle 格式，并让每次构建的格式各不相同。完整调研见 [Ren'Py 保护现状调研](../technical/research.md)。

## 如何防止 unrpa、rpatool 解包 rpa

RenMori 不再使用 RPA 封包。脚本、立绘、CG、音频、视频、字体、翻译与配置全部封入加密容器，仅在运行中的引擎内部解密，任何时刻都不会有解密后的文件留在磁盘上。

受保护的构建中磁盘上已不存在 `.rpa` 文件，`unrpa`、`rpatool`、`RenPack`、`RenpyEx` 这类读取 RPA 的工具便无从下手。其中 `unrpa` 已在受保护构建上实测失效，其余几款尚未逐一实测。容器的公开规范见 [容器格式 v1](../technical/container-format.md)。

## 如何防止 unrpyc 反编译 rpyc 脚本

即使容器内容因密钥泄露或内存转储而暴露，脚本也还有一层独立保护：RenMori 在构建期把每个 `.rpyc` 的 pickle 载荷替换为 AES-256-GCM 密文，脚本密钥独立于容器密钥。反编译器提取到的不再是 pickle，因此无法还原源码：

| 工具 | 原始 `.rpyc` | 经 RenMori 处理后 |
|------|--------------|-------------------|
| `unrpyc` | 反编译为 `.rpy` | 失败 |
| `unrpyc --try-harder` | — | 失败 |
| `rpycdec` | 反编译为 `.rpy` | 失败 |

使用闭源插件的完整保护还会逐构建随机化已编译脚本的结构，即使载荷被完全解密，也不含反编译器可识别的标准类名。详见 [脚本层与引擎锁定](../technical/script-layer.md)。

## 如何防止 un.rpyc 等注入式反编译器

`un.rpyc` 这类工具的原理是被放进 `game/` 目录，作为脚本随游戏加载后导出全部内容。RenMori 会拒绝打开游戏目录中的任何类脚本文件（`.rpyc`、`.rpymc`、`.rpy`、`.rpym`、`.rpe`），合法脚本只来自加密容器，被注入的代码因此不会运行。

受保护的构建还会关闭开发者模式与控制台，并拒绝执行 `compile`、`dialogue`、`translate` 等导出数据的子命令。使用原生启动器的构建（使用插件时默认开启，1.2.5 及以后）在游戏目录中存在散装脚本或扩展时会直接拒绝启动。

## 能防住 AI 自动化破解吗

只会调用现成工具的 AI Agent，与手动运行这些工具的人面对的是同一道门槛：工具失效，Agent 也就无从下手。RenMori 的每次构建各不相同，针对一款游戏的逆向成果不能迁移到其他游戏或其他版本，因此也不会出现可以在论坛上流传的“RenMori 解包器”。

## renpy 能做到完全反破解吗

不能，任何客户端保护都做不到。游戏运行在玩家的机器上，解密逻辑必然随游戏分发，渲染出的画面与解码后的音频必然出现在内存与屏幕上。RenMori 无法阻止：

- 对游戏画面的截图与录屏
- 熟练攻击者从运行中的进程提取内存
- 针对某一款游戏、某一个版本长期投入的专家级逆向
- 设法让引擎执行攻击者自有代码的攻击，例如修改引擎自身的 Python 文件

RenMori 也不提供联网授权或硬件绑定。它能做到的是：让所有标准的 Ren'Py 解包与反编译工具失效，磁盘上不留明文，并让每次构建各不相同，使提取成本提高到针对单一游戏、单一版本的专家级投入。完整说明见 [威胁模型](../technical/threat-model.md)。

## 防解包会影响游戏性能吗

几乎感觉不到。在一款约 3.5 GB 的真实 GalGame 上实测，加密后随机读取的额外延迟最大约 0.15 ms，不足 60 FPS 下单帧时间的 1%；冷缓存下的顺序读取吞吐为 584 MB/s；`game/` 目录体积仅增加 0.09%。冷启动会多出约 1.3 s，只在启动时发生一次。详见 [真实游戏实测](../milestones/benchmark-game.md)。

## 三步给 renpy 游戏加密

1. 在 Ren'Py 启动器中执行 *Build Distributions*，得到发行版构建或 `.zip` 压缩包
2. 安装 RenMori 并加密构建：

   ```bash
   pip install renmori
   renmori protect ./dist/MyGame-1.0-pc -o ./dist/MyGame-1.0-pc-protected
   ```

3. 校验结果，确认没有残留明文资源：

   ```bash
   renmori verify ./dist/MyGame-1.0-pc-protected
   ```

完整步骤见 [快速开始](./quick-start.mdx)。

## 其他常见问题

### RenMori 收费吗

不收费。保护任何 Ren'Py 游戏都免费，包括商业作品，运行时可以随游戏一同免费再分发。

### 支持哪些 Ren'Py 版本

支持 Ren'Py 8.x（Python 3）。基于 Ren'Py 7.x 或更早的 Python 2 版本引擎的项目不受支持。

### 需要修改游戏源码吗

不需要。RenMori 直接处理 Ren'Py 启动器生成的发行版构建或 `.zip` 压缩包。处理后的目录须原样发布，不要再用启动器重新构建，否则保护会失效。

### 能用于 Steam 发行吗

可以，见 [Steam 发行指南](../integration/steam-release.md)。运行时已在 Windows、Linux 与 macOS 的真实 Ren'Py 引擎中完成验证，Steam Deck（Proton）上的验证仍在进行中。
