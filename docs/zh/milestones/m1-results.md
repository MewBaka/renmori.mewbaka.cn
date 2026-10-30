---
title: M1 成果：资源层
description: M1 里程碑交付并验证的基线资源层，包括加密容器、运行时加载器钩子、引擎内加密后端、现成工具失效情况与性能数据
---

# M1 成果：资源层

M1 交付并验证了基线资源层：一个取代 Ren'Py RPA 封包的加密容器、一个运行时加载器钩子，以及运行在 Ren'Py 自带 Python 中的加密后端。验证基于 Ren'Py 8.5.2，同时使用 SDK 示例项目 `the_question` 与一个包含数千项资源、体积达 GB 级的发行版构建进行测试，以覆盖每一种资源类型以及流式读取路径。

目标平台为 Windows，开发与验证主机为 macOS/arm64。Windows 运行时路径（CNG）在 M4 中单独编写并验证。

## 已验证的内容

每一种资源类型都能通过引擎内真实的 `renpy.loader` 逐字节一致地解密，并与各原始文件的 SHA-256 进行了比对：

| 资源类型 | 交付路径 |
|----------|----------|
| 图像：立绘、CG（PNG/JPG） | 缓冲区 |
| 音频（Opus/OGG） | 缓冲区 |
| 脚本（`.rpyc`） | 缓冲区 |
| 翻译（`tl/<language>/`） | 缓冲区 |
| 字体，小型（TTF） | 缓冲区 |
| 字体，大型，数 MB（TTF） | 流式 |
| 视频，大型：WebM/OGV/AVI | 流式 |

`lint` 会从容器中解析每一个 `.rpyc` 与翻译文件，因此 Ren'Py 脚本层能够完整加载。完成保护后，磁盘上不再残留任何明文封包、`.rpyc` 或 `.rpy`，只剩下 `renmori.rmc` 与 `renmori.rpe`，以及运行时生成的 `cache/`。

## 现成工具失效

- `unrpa` 拒绝处理该容器：由于容器并非 RPA 封包，其版本自动探测失败
- 磁盘上不存在任何可供 `unrpyc` 反编译的 `.rpyc` 或 `.rpy`
- 对 GB 级容器进行文件特征签名雕刻（signature carving），找不到任何多字节魔数（`PNG`、`RENPY RPC2`、`OggS`、`RIFF`、`OTTO`、`zip`），只有统计上预期频率的三字节偶然命中，且均无法恢复出数据；该容器与随机数据无从区分

## 性能：基线参考读取器

通过 Python 参考读取器（ctypes → `librenpython` 中的 OpenSSL EVP，按 64 KB 分块进行 AES-256-GCM 解密），在引擎内对数 MB 大小的资源测得的顺序解密吞吐量约为 74 MB/s。这远高于实时视频与音频解码所需的速率，后者仅需数 MB/s。小型资源走缓冲区路径，随后交由 Ren'Py 自身的 C 缓冲区 RWops 处理，不再产生逐次读取的 GIL 争用。

以上为参考读取器的数据；正式发行的原生解密器会消除逐分块的 Python 调用开销。实际游玩过程中保护前后的帧时间对比（感知层面）在基准测试框架中单独跟踪。

## 已确立的关键架构事实

- 钩子点：`file_open_callbacks`（插入到最前）与 `scandirfiles_callbacks`（负责文件发现以及 `lower_map`）；`.rpe` 扩展在 `index_files()` 之前加载，见 [加载器钩子](../technical/loader-hook.md)
- 在 Ren'Py 内部实现 AES，无需任何第三方依赖：macOS/Linux 上使用 `librenpython` 导出的 OpenSSL EVP（位于 `sys.executable` 旁），Windows 上使用 CNG；`_ctypes` 内置于全部三个随发行版附带的运行时中
- 规避了 `to_rwops` 重新打开陷阱：流式对象既不暴露 `.name`，也不暴露 `.raw`

## 已知缺口与后续工作

:::tip
以下内容反映 M1 完成时的状态。`renpy.exists()` 查询容器的回退已在 [M4](./m4.md) 中实现，基线脚本变换见 [脚本层与引擎锁定](../technical/script-layer.md)。
:::

- `renpy.exists()`（仅检查磁盘的 `transfn`）对容器内的文件返回 False；已准备好补丁，供有需要的项目使用
- 基线的占位密钥内嵌在 `autorun.py` 中；运行时密钥派生属于闭源组件
- 基线脚本层仍分发标准 `.rpyc`（静态加密）；自定义 AST 格式属于闭源多态层
- 窗口模式下的感知性能基准（帧时间）在基准测试框架中跟踪
