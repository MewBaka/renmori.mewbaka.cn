---
title: Ren'Py 保护现状调研
description: 对现有 Ren'Py 封包与脚本格式、攻击方工具、既有保护尝试以及官方与社区观点的调研，以及这些结论对 RenMori 设计的影响
---

# Ren'Py 保护现状调研

本页记录业已存在的方案，以说明本项目为何没有重复造轮子。调研日期：2026-10-29。

## 概要

目前**不存在面向 Ren'Py 的商业级通用保护工具**能够做到逐构建多态，并同时覆盖 Ren'Py 脚本、全部资源与引擎。这一空白真实存在：公开的工具生态完全站在*攻击方*一侧（解包器与反编译器），少数保护尝试要么停留在原型阶段，要么只覆盖单一层面。

## Ren'Py 自有格式的工作方式及其薄弱之处

- **`.rpa` 封包**本质上只是一份索引加上依次拼接的文件，至多带有一个 XOR“混淆”密钥，并未加密
- **`.rpyc` 脚本**是 Ren'Py AST 经 zlib 压缩后的 pickle
- Ren'Py 官方文档指出，混淆只能防止随意浏览，并承认“稍有技术的程序员即可轻易破解”；Ren'Py 主要开发者已将资源加密请求（renpy/renpy#2546）以不可行为由关闭，理由是游戏在运行时必须读取自身的资源，因此解包所需的一切都会随游戏一同分发，且资源无论如何都可以从内存或屏幕上截取

## 攻击方工具（受保护构建必须击败的对象）

| 工具 | 功能 | 备注 |
|------|------|------|
| `unrpa` | 提取 `.rpa` 封包 | 支持 RPA-1.0 至 4.0 及各类变体 |
| `rpatool` | 创建、列出、提取、编辑 `.rpa` 封包 | 可使用指定的 XOR 密钥封包 |
| `RenPack` | 面向 RPA-2.0/3.0/3.2（含 XOR）的 GUI/CLI 工具 | 可读取并*重写*封包 |
| `RenpyEx` | 纯 Rust 实现的 `.rpa`/`.rpyc` 提取器 | **可从 `options.rpy` 自动探测密钥**，以 SHA-256 校验，力求逐字节还原 |
| `unrpyc` | 反编译 `.rpyc` | 支持 `--try-harder`，以及 `un.rpyc`/`bytecode.rpyb` 进程内注入 |
| `rpycdec` | 反编译 `.rpyc`/`.rpymc` | 构造伪 `renpy`/`store` 包，使 pickle 得以反序列化 |

### unrpyc 的去混淆实际能处理什么

以下内容摘自 `deobfuscate.py`。这一点十分重要，因为它表明哪些简单的改造手段是无效的：

- **slot 提取器**依次尝试：标准 `RENPY RPC2` 头；无头的旧式格式（整个文件是单个 zlib 数据块）；`extract_slot_headerscan`（当魔数被修改或偏移时，扫描 36 字节的头部模式）；`extract_slot_zlibscan`（**当头部被破坏时，扫描 zlib 起始字节 `0x78` 并验证校验和，再对候选数据解压**）
- **分层载荷解码器**（`DECRYPTORS`）：最多 10 层，每层之后重试一次 pickle 加载，包括 `decrypt_zlib`、`decrypt_hex`、`decrypt_base64`、`decrypt_string_escape`

**结论：** 修改魔数、偏移头部，或用 zlib/base64/hex/转义编码包裹载荷，都**无法**阻止 unrpyc，其中 zlib 扫描器尤其能够绕过各类头部改造。要真正使其失效，必须彻底放弃标准 pickle/zlib（改用自定义 AST 格式），*并且*让类与字段布局逐构建各不相同，使“伪 renpy 模块”的手法失去绑定目标。

## 既有的保护尝试

- **ichfly/renpy-Asset-Protect**：仅通过基于密钥的加载器与配套的 C 可执行程序（AES + SHA-256）保护资源；属于原型质量，带有硬编码的密钥表与调试文件写出；作者本人声明它**不是 DRM**，并表示该方法容易被绕过，但仍好过无需任何适配即可被直接导出
- **社区流传的做法**（Lemmasoft、知乎）：重命名 `.rpa`、用十六进制编辑器修改头部、将脚本藏入图片文件，或将引擎限制为只加载白名单内的封包；这些做法要么可被轻易绕过，要么未经验证

## 官方与社区观点

- renpytom（Ren'Py 主要开发者）：完整的资源加密“不可能”实现，因此关闭了该功能请求；他同时**不建议**混淆，因为一旦引擎或操作系统更新导致游戏出错，混淆会使问题难以修复
- uyjulian（贡献者）：再复杂的封包格式，也可以通过转储运行中游戏的内存或截取屏幕来攻破（参见 NinjaRipper、KrkrExtract）；要真正阻止注入式提取器，需要内核级反作弊
- unrpyc 维护者：明确**拒绝**为特定游戏添加去混淆支持的功能请求，理由是这是一场“军备竞赛”

最后一点正是 RenMori 的战略切入点：既然没有人会在通用工具中加入针对单款游戏的支持，**“每次构建各不相同”本身就是一项持久的优势。**

## 对设计的影响

1. 彻底放弃 RPA 与标准 rpyc/pickle 格式：头部与编码层面的改造已被 `unrpyc` 处理
2. 逐构建多态是核心价值，且恰好零运行时开销，契合性能优先原则
3. 如实告知用户：RenMori 的价值在于“不存在通用解包器，且每款游戏都需要专家级投入”，而非“不可破解”，见 [威胁模型](./threat-model.md)

## 参考来源

- Ren'Py 资源加密请求（以不可行为由关闭）：https://github.com/renpy/renpy/issues/2546
- Lemmasoft，“Protect .rpa and .rpyc from unpackers and decompilers”：https://lemmasoft.renai.us/forums/viewtopic.php?p=389272
- Ren'Py 历史 Wiki，“Obfuscating Your Game”：https://renpy.org/wiki/renpy/doc/reference/Obfuscating_Your_Game
- unrpyc：https://github.com/CensoredUsername/unrpyc（`master` 分支上的 `deobfuscate.py`）
- rpycdec：https://github.com/cnfatal/rpycdec
- unrpa：https://pypi.org/project/unrpa/
- rpatool：https://github.com/Shizmob/rpatool
- RenPack：https://github.com/Kroste/RenPack
- RenpyEx：https://github.com/rolanfreeman6-png/RenpyEx
- ichfly/renpy-Asset-Protect：https://github.com/ichfly/renpy-Asset-Protect
