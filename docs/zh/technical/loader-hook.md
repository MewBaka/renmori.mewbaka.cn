---
title: 加载器钩子
description: RenMori 如何接入 Ren'Py 8.5 的资源加载流程，包括文件打开回调、文件发现、Ren'Py 扩展的加载时序、RWops 返回类型与引擎内 AES 实现
---

# 加载器钩子

本页内容来自对 Ren'Py **8.5.2** 源码（`renpy/loader.py`、`renpy/main.py`、`renpy/script.py`、`renpy/pygame/rwobject.pyx`）的阅读，以及对 SDK 所附运行时的检查。对于所支持的每一个 Ren'Py 版本，都需要重新核验以下结论。

## 1. 所有资源都经由同一个入口

`renpy.loader.load(name)` → `load_core(name)` → 依次尝试 `renpy.loader.file_open_callbacks` 中的每个函数，并返回第一个非 `None` 的结果。默认顺序为：`config.file_open_callback`、文件系统、封包（RPA）、APK、远程。

调用方审计结果：

| 资源 | 调用点 |
|------|--------|
| 图像 | `loader.load()` → `pygame.image.load(f, filename)`（`display/pgrender.py`） |
| 音频**与视频** | `renpy.audio.audio.load()` → `loader.load(fn, directory="audio")`；影片经由音频通道播放 |
| 字体 | `loader.load(fn, directory="fonts")`（`text/font.py`） |
| 脚本 | 以 `loader.load(fn, tl=False)` 读取 `.rpyc`（`script.py`），无论该文件来自磁盘还是索引 |

**唯一的绕过点：** `renpy.exists()` 使用 `transfn()`，并且在文档中明确说明仅检查磁盘。若游戏对一个已被移入容器的文件调用 `renpy.exists()`，将得到 `False`。钩子会对此进行修补。

**RenMori 将其回调插入 `file_open_callbacks` 的索引 0 处**，使容器优先于磁盘上的任何内容。

## 2. 文件发现：`scandirfiles_callbacks`

`listdirfiles()`（用于脚本发现、`renpy.list_files()`、自动图像定义以及填充 `loadable_cache`）通过以 `add(dn, fn, files, seen)` 的形式调用 `renpy.loader.scandirfiles_callbacks` 中的每个函数来构建。RenMori 注册了一个函数，以 `dn=None` 添加每一个容器条目（与封包条目的添加方式相同）。这使容器内的文件在 `loadable()` 中返回真，并使脚本发现能够找到仅存在于容器内的 `.rpyc` 文件。

## 3. 时序：钩子必须在 `index_files()` 之前安装

Ren'Py 脚本在启动时、任何游戏 `.rpy` 代码运行之前就已被发现，因此普通的 `init python` 块为时已晚。Ren'Py 8.5 提供了官方的早期钩子：**Ren'Py 扩展（Ren'Py Extensions）**。`renpy.main.main()` 会按排序顺序，从 Ren'Py 基目录、`game/` 与 `game/libs` 中加载每一个 `*.rpe`（包含 `autorun.py` 的 zip 文件，会被加入 `sys.path`）与 `*.rpe.py`，加载时机**早于** `renpy.loader.index_files()`，也早于脚本加载。

RenMori 将其运行时以 `game/renmori.rpe` 的形式随发行版构建分发。（计划在后续版本中迁入原生启动器；`.rpe` 同时也是攻击者的注入点，必须锁定为仅允许本项目签名的扩展。）

## 4. 返回类型至关重要：`RWopsIO` 与重新打开陷阱

Ren'Py 8.5 通过 `rwobject.pyx` 中的 `to_rwops()` 将文件对象交给 C 代码（SDL_image、FreeType、ffmpeg）。其处理逻辑依次为：

1. 反复解开 `.raw`
2. 若为 `RWopsIOImpl`，直接使用其 C 层 `SDL_RWops`（**速度快，不持有 GIL**）
3. **若为带字符串 `.name` 的 `io.IOBase`，则按该名称从磁盘重新打开**（若存在 `.base`/`.length` 则一并使用）
4. 否则，对任何带 `read` 方法的对象，以 Python 回调进行包装，**每次读取都需要获取 GIL**

对 RenMori 的影响：

- **陷阱**：继承 `io.IOBase` 并暴露字符串 `.name` 的解密文件对象会被从磁盘重新打开，结果要么找不到文件，要么把原始密文交给 SDL；因此流对象既不能暴露 `.name`，也不能暴露 `.raw`
- **中小文件**：完整解密后返回 `RWopsIO.from_buffer(plaintext, name=name)`，这是纯 C 层的缓冲区 RWops，此后不再获取 GIL，是 Ren'Py 中最快的路径
- **大文件（视频、长时间的背景音乐）**：返回 `RWopsIO(stream, name=name)`，其中 `stream` 按需解密分块；该路径经由 Python 回调，每次读取都要获取一次 GIL，必须进行基准测试，生产环境的方案是闭源运行时中的原生 nogil 解密 `SDL_RWops`

## 5. 在 Ren'Py 自带的 Python 中实现 AES：无需额外依赖

Ren'Py 自带的 Python 不包含 `cryptography` 或 `pycryptodome`，但附带了 `ctypes`（三个运行时中均存在 `PyInit__ctypes`），并且：

| 运行时 | AES-256-GCM 来源 |
|--------|------------------|
| macOS（`librenpython.dylib`，通用二进制） | 静态链接**并导出**的 OpenSSL（`EVP_aes_256_gcm`、`EVP_CIPHER_CTX_new`、`EVP_DecryptUpdate` 等） |
| Linux（`librenpython.so`） | 同上，已导出 |
| Windows（`librenpython.dll`、`libpython3.12.dll`） | EVP 符号**未导出**；改用操作系统的 **CNG（`bcrypt.dll`）**，自 Vista 起的所有 Windows 版本均提供硬件加速的 AES-GCM |

因此，运行时读取器通过 `ctypes` 调用 OpenSSL（macOS/Linux）或 CNG（Windows）。解密在原生代码中借助 AES-NI / ARMv8 加密扩展执行，只有每个分块的调用开销发生在 Python 中。构建工具使用 `cryptography` 包。所有后端产出的都是标准 AES-256-GCM，因此容器格式不依赖于具体后端。
