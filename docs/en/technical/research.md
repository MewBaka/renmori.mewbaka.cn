---
title: "Research: the state of Ren'Py protection"
description: A survey of Ren'Py's archive and script formats, attacker-side tooling, prior protection attempts and official and community positions, and how the findings shaped RenMori's design
---

# Research: the state of Ren'Py protection

This page records what already exists, so the project can justify not reinventing the wheel. Date of research: 2026-10-29.

## Summary

There is **no commercial-grade, general-purpose protector for Ren'Py** that is polymorphic per build and covers Ren'Py scripts, all assets *and* the engine at once. The gap is real: the public tooling landscape sits entirely on the *attacker* side (unpackers and decompilers), and the few protection attempts are prototypes or cover only one layer.

## How Ren'Py's own formats work and why they are weak

- **`.rpa` archives** are just an index plus concatenated files, with at most an XOR "obfuscation" key; they are not encrypted
- **`.rpyc` scripts** are zlib-compressed pickles of the Ren'Py AST
- Ren'Py's official guidance says obfuscation only keeps out casual browsing and that a "moderately skilled programmer could easily crack this"; the lead developer closed the asset-encryption request (renpy/renpy#2546) as not feasible, because the game must read its own assets at runtime, so whatever is needed to unpack them ships with the game, and assets can be captured from memory or the screen regardless

## Attacker-side tooling (what a protected build must defeat)

| Tool | What it does | Notes |
|------|--------------|-------|
| `unrpa` | Extracts `.rpa` archives | Handles RPA-1.0 to 4.0 and variants |
| `rpatool` | Creates, lists, extracts and edits `.rpa` archives | Can pack with a chosen XOR key |
| `RenPack` | GUI/CLI for RPA-2.0/3.0/3.2, including XOR | Reads and *rewrites* archives |
| `RenpyEx` | Pure-Rust `.rpa`/`.rpyc` extractor | **Auto-detects the key from `options.rpy`**, verifies with SHA-256, aims for byte-perfect output |
| `unrpyc` | Decompiles `.rpyc` | `--try-harder`, plus `un.rpyc`/`bytecode.rpyb` in-process injection |
| `rpycdec` | Decompiles `.rpyc`/`.rpymc` | Builds a fake `renpy`/`store` package so pickle can deserialize |

### What unrpyc's deobfuscation actually handles

The following comes from `deobfuscate.py`. It matters because it shows which naive modifications are useless:

- **Slot extractors**, tried in turn: the standard `RENPY RPC2` header; headerless legacy files (the whole file is one zlib blob); `extract_slot_headerscan` (scans for a 36-byte header pattern when the magic is changed or shifted); `extract_slot_zlibscan` (**when the header is destroyed, scans for zlib start bytes `0x78` with a valid checksum and decompresses the candidates**)
- **Layered payload decoders** (`DECRYPTORS`), up to 10 layers, retrying a pickle load after each: `decrypt_zlib`, `decrypt_hex`, `decrypt_base64`, `decrypt_string_escape`

**Implication:** changing the magic bytes, shifting the header, or wrapping the payload in zlib/base64/hex/escape encoding does **not** stop unrpyc; the zlib scanner in particular defeats header tricks. To actually break it, the standard pickle/zlib format must be left behind entirely (a custom AST format) *and* the class and field layout must differ per build, so the "fake renpy module" approach has nothing to bind to.

## Prior protection attempts

- **ichfly/renpy-Asset-Protect**: protects assets only, via a key-based loader and a companion C executable (AES + SHA-256); prototype quality, with a hardcoded key table and debug file writes; the author states it is **not DRM** and describes the approach as easily bypassed, though still better than being dumpable without any adaptation
- **Community folklore** (Lemmasoft, Zhihu): renaming the `.rpa`, editing the header with a hex editor, hiding scripts inside image files, or restricting the engine to a whitelist of archives; all of these are either trivially bypassed or unverified

## Official and community positions

- renpytom (Ren'Py lead developer): full asset encryption is "impossible", so he closed the feature request; he also advises *against* obfuscation, because it makes games hard to fix when an engine or operating system update breaks them
- uyjulian (contributor): even a complicated archive format can be beaten by dumping a running game's memory or capturing the screen (compare NinjaRipper, KrkrExtract); truly blocking injected extractors would require kernel-level anti-cheat
- unrpyc maintainers: they **will not** accept feature requests to deobfuscate specific games, explicitly because it is an "arms race"

That last point is RenMori's strategic opening: since nobody will build per-game support into the universal tools, **"every build is different" is by itself a durable advantage.**

## Takeaways that shaped the design

1. Leave RPA and the standard rpyc/pickle format entirely: header and encoding tricks are already handled by `unrpyc`
2. Per-build polymorphism is the core value and, conveniently, has zero runtime cost, which fits the performance-first priority
3. Be honest with users: the win is "no universal unpacker plus per-game expert cost", not "uncrackable" (see [Threat model](./threat-model.md))

## Sources

- Ren'Py asset-encryption request (closed as not feasible): https://github.com/renpy/renpy/issues/2546
- Lemmasoft, "Protect .rpa and .rpyc from unpackers and decompilers": https://lemmasoft.renai.us/forums/viewtopic.php?p=389272
- Historic Ren'Py Wiki, "Obfuscating Your Game": https://renpy.org/wiki/renpy/doc/reference/Obfuscating_Your_Game
- unrpyc: https://github.com/CensoredUsername/unrpyc (`deobfuscate.py` on `master`)
- rpycdec: https://github.com/cnfatal/rpycdec
- unrpa: https://pypi.org/project/unrpa/
- rpatool: https://github.com/Shizmob/rpatool
- RenPack: https://github.com/Kroste/RenPack
- RenpyEx: https://github.com/rolanfreeman6-png/RenpyEx
- ichfly/renpy-Asset-Protect: https://github.com/ichfly/renpy-Asset-Protect
