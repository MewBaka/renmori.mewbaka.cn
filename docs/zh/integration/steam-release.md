---
title: "Steam 发行指南：发布加密的 Ren'Py 游戏"
description: "按构建、加密、SteamPipe 上传的顺序把受保护的 Ren'Py 游戏发布到 Steam，并说明 depot 划分、启动选项以及与 Steam 叠加层、DRM 的兼容性"
---

# Steam 发行指南

RenMori 保护的是**已构建完成**的 Ren'Py 发行版构建。发布到 Steam 分为三个有序步骤，且顺序不可调换：

```
Ren'Py launcher: Build Distributions   →   renmori protect   →   SteamPipe upload
   (from your project source)              (encrypt game/)        (upload the folder)
```

:::danger 请勿颠倒顺序
若先执行保护，再对项目重新运行 Ren'Py 启动器的 Build Distributions，启动器会从源码重新构建，产出一份全新的**未受保护**发行版构建，此前的保护随之失效。请对启动器的输出执行保护，并且切勿将受保护的文件夹重新交给启动器处理。
:::

本指南以 Ren'Py SDK 自带的示例项目 `the_question` 及其 **market** 构建为例，因为该构建包含全部三个平台。

## 应上传哪个构建

Ren'Py 启动器可产出以下构建：

- **pc**：Windows 与 Linux
- **mac**：macOS
- **market**：一个通用包，内含 Windows（`.exe`）、macOS（`.app`）与 Linux（`.sh`）启动器，三者共享同一个 `game/`

两种方式在 Steam 上均可行：

| 方式 | 操作 | 取舍 |
|------|------|------|
| **Market（简单）** | 保护这一个 market 文件夹；将其放入挂载到所有操作系统的**单一 depot**；按操作系统分别设置启动选项 | 每位玩家都会下载全部三个平台的文件 |
| **分平台（精简）** | 分别构建 **pc** 与 **mac**，各自运行 `renmori protect`，并各自上传到**独立的 depot**（Windows / macOS / Linux） | 步骤更多，但每位玩家只下载其所在平台的文件 |

RenMori 的保护与平台无关：`renmori.rpe` 加载器运行在各操作系统上 Ren'Py 自带的 Python 之中。因此**对 market 构建运行一次 `protect`，即可同时覆盖 Windows、macOS 与 Linux**。

## 步骤 1：保护

将启动器生成的 market 压缩包解压到一个文件夹（RenMori 接收目录而非 `.zip`），然后执行：

```bash
renmori protect ./the_question-7.0-market -o ./the_question-7.0-market-protected
renmori verify  ./the_question-7.0-market-protected
```

`game/` 发生变化；启用原生启动器（默认）时，各平台的入口点也会替换为启动器，原引擎以 `.renmori_real` 名称保留在旁；使用 `--no-launcher` 时只有 `game/` 发生变化：

```
the_question-7.0-market-protected/
├─ game/
│   ├─ renmori.rmc        # all assets, encrypted
│   ├─ renmori.rpe        # runtime loader (Ren'Py loads it automatically)
│   ├─ renmori_core-*     # native runtime, one per platform
│   └─ steam_appid.txt    # kept as plaintext (the Steam SDK reads it directly)
├─ lib/
│   └─ py3-linux-x86_64/
│       ├─ the_question               # native launcher (Linux entry point)
│       └─ the_question.renmori_real  # original engine
├─ renpy/                 # untouched
├─ the_question.app/      # Contents/MacOS/the_question is the native launcher
├─ the_question.exe       # native launcher (Windows entry point)
├─ the_question.renmori_real.exe  # original engine
├─ the_question.py
├─ the_question.sh        # untouched — Linux entry script
└─ renmori-manifest.json
```

原先位于 `game/` 下的明文 `.rpa` 封包与 `.rpyc` 已不复存在，`unrpa` 与 `unrpyc` 均无可处理的对象。

## 步骤 2：通过 SteamPipe 上传

Steam **不**接收单个文件。一次构建是**一个文件夹的全部内容**，通过 SteamPipe 上传到 depot。因此：

- **请勿**上传 `.zip`
- **请勿**只上传 `renmori.rmc`
- **请**将 depot 的 `contentroot` 指向**受保护的文件夹**，由 SteamPipe 上传其中的全部内容（`game/`、`lib/`、`renpy/` 与各启动器）

`app_build_<APPID>.vdf`：

```
"appbuild"
{
  "appid"       "YOUR_APPID"
  "desc"        "the_question 1.0 (renmori protected)"
  "buildoutput" "D:\steam\output\"
  "contentroot" "D:\dists\the_question-7.0-market-protected\"
  "setlive"     ""          // upload only; set the live branch in the web UI
  "depots"
  {
    "YOUR_DEPOTID"
    {
      "FileMapping" { "LocalPath" "*"  "DepotPath" "."  "recursive" "1" }
    }
  }
}
```

```bash
steamcmd +login YOUR_ACCOUNT +run_app_build "D:\steam\app_build_YOUR_APPID.vdf" +quit
```

Steamworks 提供的 SteamPipe GUI 执行的是相同的操作，将其指向受保护的文件夹即可。

采用**分平台 depot** 时，请分别保护每个平台的构建，并为每个平台配置独立的 depot 与各自的 `contentroot`。

## 步骤 3：设置启动选项

在 Steamworks 网页后台（Installation → General Installation → Launch Options）中为每个操作系统各设置一项启动选项，指向构建内对应的启动器：

| 操作系统 | 可执行文件 |
|----------|------------|
| Windows | `the_question.exe` |
| Linux | `the_question.sh` |
| macOS | `the_question.app` |

入口点（除非以 `--no-launcher` 构建，否则即原生启动器）引导 Ren'Py 启动后，由 `renmori.rpe` 接管资源加载并在内存中解密资源；两种情况下启动选项相同，整个过程对玩家透明。

## Steam 兼容性要点

- **请勿再叠加 Steam DRM**（DRMToolkit 可执行文件包装器）：它会改写启动器二进制文件，可能与运行时自检冲突，且其自身防护较弱，而 RenMori 已对数据层提供保护
- **Steam 叠加层（Overlay）可正常使用**：不使用启动器（`--no-launcher`）时，RenMori 仅挂钩 Ren'Py 的文件加载，从不进行进程或 DLL 注入，因此 Steam 叠加层工作正常；使用原生启动器（默认）时见下文的原生启动器一节
- **成就与云存档**经由 Ren'Py 的 Python API 实现，不受影响；`renmori.rmc` 是静态文件，因此 Steam 的文件校验与增量更新均正常工作
- **`steam_appid.txt`** 由 Steam SDK 在 `renpy.loader` 之外直接读取，因此 RenMori 默认将其保留为明文（`DEFAULT_KEEP_ON_DISK`）；将其保留在发行版构建中并无风险，其他由外部读取的文件可通过 `renmori.toml` 中的 `keep_on_disk` 添加，详见 [配置文件](../cli/configuration.md)

## 原生启动器与 Steam

自 1.2.6 起，使用插件时原生启动器默认开启，`--no-launcher` 可关闭。它被装配为各平台的入口点（Windows 上的 `the_question.exe`、Linux 上由 `the_question.sh` 启动的引擎存根 `lib/py3-linux-x86_64/the_question`、macOS 上 `the_question.app` 内的可执行文件），因此启动选项保持不变；它先完成启动认证，再启动真正的引擎，这一步改变了 Steam 叠加层与 Steamworks SDK 所依赖的进程模型，因此其 Steam 兼容性按平台记录：

| 平台 | 启动引擎的方式 | 状态 |
|---|---|---|
| macOS | `execv`（同一 PID，继承环境变量） | 已验证：叠加层重新附着到真正的引擎，`SteamAPI_Init` 保持应用上下文 |
| Windows | `_spawnv`（引擎作为子进程运行） | 尚未测试：子进程模型最可能影响叠加层的注入 |
| Linux | `execv`（与 macOS 相同） | 尚未测试：预期与 macOS 一致 |

发行前请在 Windows 上检查叠加层与成就；若不正常，请以 `--no-launcher` 构建 Windows depot。

启动器在 `game/` 下发现散装的 Ren'Py 脚本或扩展时会拒绝启动，因此玩家以 `.rpy` 文件形式放入 `game/` 的模组或补丁会使带启动器的构建无法启动，这类内容应随构建一并发布；以 1.2.0 或更早版本、带启动器加密的构建缺少这项检查，应使用 1.2.5 或更高版本重新加密。

## 检查清单

- [ ] 已在 Ren'Py 启动器中从源码构建（Build Distributions）
- [ ] 已对解压后的构建文件夹运行 `renmori protect`
- [ ] `renmori verify` 已通过
- [ ] SteamPipe 的 `contentroot` 指向**受保护的文件夹**，而非 `.zip`
- [ ] 已按操作系统设置启动选项（`the_question.exe` / `.sh` / `.app`）
- [ ] 未叠加 Steam DRM 包装器
- [ ] **未**对受保护的文件夹重新运行启动器
- [ ] 使用原生启动器（默认）时：已在 Windows 上检查 Steam 叠加层与成就，二者尚未经过验证
- [ ] 已使用 1.2.6 或更高版本加密
