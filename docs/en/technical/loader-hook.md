---
title: Loader hook
description: How RenMori plugs into Ren'Py 8.5 asset loading, covering file-open callbacks, file discovery, Ren'Py Extension load timing, the RWops return type and in-engine AES
---

# Loader hook

This page records findings from reading the Ren'Py **8.5.2** source (`renpy/loader.py`, `renpy/main.py`, `renpy/script.py`, `renpy/pygame/rwobject.pyx`) and inspecting the runtimes shipped in the SDK. These findings must be re-verified on every Ren'Py version RenMori supports.

## 1. Every asset goes through one choke point

`renpy.loader.load(name)` → `load_core(name)` → tries each function in `renpy.loader.file_open_callbacks` in order and returns the first non-`None` result. The default order is `config.file_open_callback`, the filesystem, archives (RPA), APK, remote.

Audit of the callers:

| Resource | Call site |
|----------|-----------|
| Images | `loader.load()` → `pygame.image.load(f, filename)` (`display/pgrender.py`) |
| Audio **and video** | `renpy.audio.audio.load()` → `loader.load(fn, directory="audio")`; movies play through audio channels |
| Fonts | `loader.load(fn, directory="fonts")` (`text/font.py`) |
| Scripts | `.rpyc` read with `loader.load(fn, tl=False)` (`script.py`), regardless of whether the file came from disk or an index |

**Only bypass:** `renpy.exists()` uses `transfn()` and is documented as disk-only. A game that calls `renpy.exists()` on a file that has been moved into the container sees `False`. The hook patches it.

**RenMori inserts its callback at index 0** of `file_open_callbacks`, so the container takes precedence over anything on disk.

## 2. File discovery: `scandirfiles_callbacks`

`listdirfiles()` (used for script discovery, `renpy.list_files()`, automatic image definitions and filling `loadable_cache`) is built by calling each function in `renpy.loader.scandirfiles_callbacks` with `add(dn, fn, files, seen)`. RenMori registers a function that adds every container entry with `dn=None`, the same way archive entries are added. This makes `loadable()` true for container files and lets script discovery find `.rpyc` files that exist only inside the container.

## 3. Timing: the hook must be installed before `index_files()`

Ren'Py scripts are discovered at startup, before any game `.rpy` code runs, so a normal `init python` block is too late. Ren'Py 8.5 provides an official early hook: **Ren'Py Extensions**. `renpy.main.main()` loads, in sorted order, every `*.rpe` (a zip containing `autorun.py`, placed on `sys.path`) and `*.rpe.py` from the Ren'Py base directory, `game/` and `game/libs`, **before** `renpy.loader.index_files()` and before the script is loaded.

RenMori ships its runtime as `game/renmori.rpe`. (`.rpe` is also an attacker injection point: with the native launcher (on by default with the plugin), 1.2.5 and later refuse to start when any `.rpe` other than `game/renmori.rpe` is present in the distribution root, `game/`, `game/libs`, or `renpy/common`, and bind `game/renmori.rpe` itself into key derivation, so a rewritten copy derives the wrong keys; a build made with `--no-launcher` or with the baseline has no such check.)

## 4. The return type matters: `RWopsIO` and the reopen trap

Ren'Py 8.5 hands file objects to C code (SDL_image, FreeType, ffmpeg) through `to_rwops()` in `rwobject.pyx`. Its behavior, in order:

1. Unwraps `.raw` repeatedly
2. For an `RWopsIOImpl`, uses its C `SDL_RWops` directly (**fast, no GIL**)
3. **For an `io.IOBase` with a string `.name`, reopens the file from disk by that name** (with `.base`/`.length` if present)
4. Otherwise, wraps anything with a `read` method in Python callbacks that **take the GIL on every read**

Consequences for RenMori:

- **Trap**: a decrypting file object that subclasses `io.IOBase` and exposes a string `.name` is reopened from disk, where it either fails to find the file or hands SDL the raw ciphertext; RenMori's stream objects must therefore expose neither `.name` nor `.raw`
- **Small and medium files**: decrypt fully and return `RWopsIO.from_buffer(plaintext, name=name)`, a pure C buffer RWops that takes no GIL afterwards and is the fastest path Ren'Py has
- **Large files (video, long background music)**: return `RWopsIO(stream, name=name)`, where `stream` decrypts chunks on demand; this path goes through Python callbacks with one GIL acquisition per read and must be benchmarked, and the production answer is a native nogil decrypting `SDL_RWops` in the closed runtime

## 5. AES inside Ren'Py's own Python: no dependency needed

Ren'Py's bundled Python includes neither `cryptography` nor `pycryptodome`, but it does ship `ctypes` (`PyInit__ctypes` is present in all three runtimes), and:

| Runtime | AES-256-GCM source |
|---------|--------------------|
| macOS (`librenpython.dylib`, universal) | OpenSSL statically linked **and exported** (`EVP_aes_256_gcm`, `EVP_CIPHER_CTX_new`, `EVP_DecryptUpdate` and others) |
| Linux (`librenpython.so`) | Same, exported |
| Windows (`librenpython.dll`, `libpython3.12.dll`) | EVP symbols **not exported**; use the operating system's **CNG (`bcrypt.dll`)**, which provides hardware-accelerated AES-GCM on every Windows version since Vista |

The runtime reader therefore calls OpenSSL (macOS/Linux) or CNG (Windows) through `ctypes`. Decryption runs in native code with AES-NI or ARMv8 cryptography extensions; only the per-chunk call overhead is in Python. The build tool uses the `cryptography` package. All backends produce standard AES-256-GCM, so the container format does not depend on the backend.
