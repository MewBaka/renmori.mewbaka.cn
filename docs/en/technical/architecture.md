---
title: Architecture
description: The overall design of RenMori, covering the performance-first principle, the four protection layers, per-build polymorphism, the open-core split, the anti-reverse-engineering model, platform integration, licensing and milestones
---

# Architecture

RenMori consists of a **build-time tool** and a **native runtime core**. It takes an already built Ren'Py 8.x (Python 3) distribution build and produces a protected one, with no changes to the game source.

A native launcher is only one of five layers. The other four (assets, scripts, the engine and per-build polymorphism) are where the actual protection lives.

:::info Status
This page describes the target design. The shipped open baseline differs in places: the runtime loads as a Ren'Py extension (`game/renmori.rpe`) rather than through a native launcher; scripts ship as `.rpyc` whose pickle payload is AES-GCM-encrypted under an independent key rather than in a custom AST format; and decryption runs through a Python reference reader that calls the platform's AES via `ctypes`. Per-build polymorphism, runtime key derivation and the native launcher belong to the closed plugin. For what has been delivered and verified, see [M1 results](../milestones/m1-results.md), [Script layer and engine lockdown](./script-layer.md) and [M4](../milestones/m4.md).
:::

## Global first principle: performance wins

Any protection measure that conflicts with runtime performance is dropped or weakened, never the reverse. Concretely:

- **No heavy packers or VM protectors by default** (VMProtect, Themida and similar): they slow startup, break under Proton/Wine (Steam Deck and Linux), trigger antivirus false positives, and interfere with macOS notarization
- **No anti-debug or self-checking on the hot path**: integrity checks run once, at startup
- **Symmetric, hardware-accelerated cryptography only** (AES, AES-NI): decryption is native (Rust or C), never a Python loop
- **Polymorphism carries the protection**: it is a build-time transform with zero runtime cost, and the strategy is "not breakable in bulk" rather than "defended at runtime"
- **Acceptance line**: a protected build is indistinguishable from an unprotected one in frame time, scene transitions, and CG and video playback; if a measure cannot meet that, the measure goes, not the performance

## The five layers

### 1. Assets (every file, fonts included)

- All files under `game/` (images, audio, video, fonts, `.rpyc`, `tl/`, JSON and so on) are packed into a **custom encrypted container** that replaces the RPA archive format entirely; each file carries its own key and integrity tag
- At runtime a native module takes over the file-open and index entry points of `renpy.loader` and returns **decrypted, streaming** file objects; fonts (FreeType), video (ffmpeg) and audio all read through the loader, so a single choke point covers them
  - **Implementation task**: audit the read path of every resource type to confirm it goes through `renpy.loader`, and add hooks for any path that bypasses it
- **Streaming, random-access decryption by offset**, so video and audio are never decrypted whole into memory; the container format must therefore be offset-addressable
- **Decrypted results reuse Ren'Py's existing caches** (textures, audio), so the same image is never decrypted twice

### 2. Scripts (source obfuscation)

- The output is **not** standard `.rpyc`: a custom AST serialization is used, with class-name mapping, field order and structural layout **randomized per build**, so pickle-based decompilers that rely on a fake `renpy` module have nothing stable to bind to
- Python embedded in Ren'Py scripts (`init python`, `$`) is compiled and encrypted at build time and decrypted only to execute at runtime, with debug metadata (source file names, line numbers) optionally stripped
- Dialogue and strings are stored encrypted and decrypted only on use

### 3. Engine

- The `renpy/` engine code and the Python standard library are packed and encrypted, with a startup integrity check against tampering
- **Whitelist loading**: only build-time-signed scripts and modules load, and stray `.rpy` or `.rpyc` files dropped into the game directory are refused, which blocks `un.rpyc`-style injection decompilers
- Distribution builds disable the developer console, developer mode and the data-exporting CLI subcommands (`compile`, `dialogue`, `translate`, `add_from`, `merge_strings`); `lint` and `run` stay available

### 4. Native launcher (the shell)

- A native per-platform launcher replaces Ren'Py's own: it boots the embedded Python, loads the engine from the encrypted container, and **derives keys at runtime**, leaving no plaintext key on disk
- It is written in Rust or C and compiled into both a launcher and a CPython extension module, so the core logic lives in native code rather than in Python

## Per-build polymorphism (the core value)

Each build randomizes the container format parameters, the AST encoding map and the key-derivation path, so a universal unpacker cannot exist. This is a build-time transform and adds nothing to runtime cost.

## Open-core split

The rule: **no public component may, even when fully understood, allow anyone to write a single unpacker that works on every RenMori game.**

### Open (this repository)

- The CLI skeleton, configuration parsing, CI integration and the GitHub Actions sample
- The **`renpy.loader` hook framework and runtime SDK**: the plumbing that takes over the loader and pipes decrypted streams back to the engine; publishing it as open source is a feature in itself, since developers can verify that there is no backdoor or phone-home behavior and can debug compatibility themselves
- The **baseline container format v1 specification**: a fixed, public, moderate-strength format (see [Container format](./container-format.md))
- Standard cryptographic primitive usage: AES is a public standard, so publishing how it is used costs nothing
- Documentation, samples and tests

The open parts are usable on their own, at baseline strength (a fixed, predictable format).

### Closed (precompiled binary plugin, decided)

- The **polymorphism / mutation engine**: how each build randomizes container layout, field order and AST class mapping; it runs **only at build time and never ships to players**, and a leak would expose the whole transform space and let an attacker write a generic solver, which is why it must stay closed
- The **key-derivation obfuscation**: the key is ultimately derivable on the client, but *how* it is derived and hidden is what raises the reverse-engineering cost
- The **native anti-tamper and key-recovery runtime**: shipped as a precompiled binary without source; it ships with the game and is therefore ultimately reversible, so keeping it closed only raises the bar

**Delivery:** the open CLI invokes the closed precompiled binary at build time. This is CI-friendly, runs offline once the plugin is provisioned, and suits free distribution. The two communicate over a **stable, documented process interface** (a CLI over stdin/stdout, or local IPC: the input is the build artifact path plus configuration, and the output is the protected artifact plus a manifest). The interface is open; the implementation is not. There is one binary per platform. See [Plugin interface](./plugin-interface.md).

Optionally, the runtime accepts only build fingerprints signed by the official closed binary, so a weak, self-written polymorphism layer cannot impersonate it.

## Anti-reverse-engineering: an honest model

Premise: a binary that ships to players and must decrypt locally cannot be made unbreakable; this is the white-box problem. The goal is to raise the cost, make breaks non-portable, and rotate the scheme so that old breaks age out. Success means that no universal unpacker exists and that each game requires dedicated expert effort. The full reasoning is in the [Threat model](./threat-model.md).

The two closed artifacts face different threat models:

1. **Build-time binary** (polymorphism and key derivation): runs only on the development or CI machine and **never ships to players**, so it is much easier to protect
2. **Runtime core** (the decryption and anti-tamper module in every shipped game): runs on the attacker's machine and must be able to decrypt everything, so it is fully white-box

Hardening measures for the runtime core, ordered by payoff (and bounded by the performance-first principle):

- **All native, never Python**: any `.py` or `.pyc` containing the key logic gives the implementation away
- **Polymorphism makes breaks non-portable** (most important): a full reverse of one game yields a tool for that game and version only
- **Keys are never static constants**: they are derived at runtime from several sources (a code-segment self-hash, scattered constants, computed values), so a single memory dump does not yield a ready key; true white-box cryptography is hard and academic constructions have been broken, so this is not over-promised
- **Symbol stripping and no debug information** in distribution builds
- **Native obfuscation**: control-flow flattening, opaque predicates and instruction substitution via obfuscator-LLVM (cross-platform), *at compile time only, with nothing that costs runtime performance*
- **Self-integrity bound to decryption**: if the binary or the engine is patched, key derivation yields garbage rather than a clean error, which makes a patch harder to diagnose (startup only)
- **Anti-debug**: minimal and off by default, because it is an arms race, false positives trigger antivirus software, and it costs performance
- **Lazy chunked decryption, freed immediately**: a whole CG or video is never held in plaintext in memory, which raises the cost of memory ripping without preventing it

Compatibility and performance verdict (already settled by the performance-first principle): **native code, light obfuscator-LLVM, symbol stripping and polymorphism**. Heavy commercial packers remain a Windows-only, default-off option, enabled only if measurements show no perceptible performance impact.

## Platform integration

### Steam

- **Allow the Steam overlay's injection**: the overlay injects into the game process, and aggressive anti-tamper or anti-injection measures would block it and break store integration; the performance-first principle already keeps anti-tamper minimal, and the injection is explicitly allowed
- **Do not double-wrap with Steam DRM**: Steam DRM wraps and edits the executable and can conflict with or trip the startup self-check, so either test compatibility or advise developers to skip Steam DRM, which is weak in any case
- Achievements and Cloud save data go through Ren'Py's Python API, which is untouched; `libsteam_api` and `steam_appid.txt` remain loadable; encrypted containers are static files, so Steam's file verification and updates work normally

For the release flow, see [Releasing to Steam](../integration/steam-release.md).

### macOS signing and notarization (assuming the developer does not notarize)

- **Design constraint: decrypt data only, never generate or execute decrypted code**. As a result no hardened-runtime entitlement is needed, protection does not force developers into paid signing, and an unsigned distribution build behaves like any unsigned Ren'Py macOS game (opened via Gatekeeper with right-click, Open)
- **Apple Silicon requires at least an ad-hoc signature to run** (`codesign -s -`, free, no developer account): the build tool ad-hoc-signs the launcher and the dylibs it produces by default
- If the developer has a Developer ID and wants to notarize, the binaries remain re-signable and compatible with the hardened runtime, with a documented flow

## Licensing

- Everything (the framework and tools, the closed plugin, and the runtime shipped inside games) is under the **RenMori License** ([LICENSE](https://github.com/MewBaka/RenMori/blob/main/LICENSE); Chinese: [LICENSE.zh-CN.md](https://github.com/MewBaka/RenMori/blob/main/LICENSE.zh-CN.md)): it is free to use to protect any Ren'Py game, including a commercial one, and the runtime is **redistributable embedded in the released game** at no charge, so a developer can legally sell their protected game
- Not permitted: selling RenMori itself or a modified version, or running a paid encryption service with it; this is a source-available license, not an OSI open-source license, because the no-resale term cannot be expressed under a permissive license
- A **CLA** is required for contributions, so contributed code can be used across the framework and the closed plugin under a single, consistent license
- Third-party notices are in [NOTICE](https://github.com/MewBaka/RenMori/blob/main/NOTICE): **ffmpeg (LGPL/GPL) is the main compliance hazard**, along with the AES library and Ren'Py's own license
- **Security disclaimer**: states that no protection is unbreakable and limits liability if a game is cracked (see [Disclaimer](../license/disclaimer.md))
- **Export and cryptography notice**: software containing strong encryption may be subject to export controls
- **Privacy statement**: no telemetry (or an honest list of what is collected), to dispel any suspicion that the loader hook phones home

## Milestones

- **M0**: this design documentation
- **M1**: asset-layer proof of concept (target platform Windows; verified on macOS/arm64): encrypted container and loader takeover; images, audio, video and fonts load; `unrpa` fails and no `.rpyc` or `.rpy` remains on disk; the windowed frame-time benchmark is tracked separately (see [M1 results](../milestones/m1-results.md))
- **M2**: script and engine layers: script payload encryption under an independent key, refusal of on-disk scripts and release lockdown (the custom AST format is part of the closed plugin) (see [Script layer and engine lockdown](./script-layer.md))
- **M3**: single-command CLI and CI: a standard Ren'Py build artifact as input, a configuration file, exit codes, a build manifest and a GitHub Actions sample (see [CI integration](../integration/ci.md))
- **M4**: per-build polymorphism; macOS (automatic ad-hoc signing, optional notarization) and Linux/Steam Deck launchers; verification of the Steam overlay, Steamworks and Proton/Steam Deck (see [M4](../milestones/m4.md))

## Verification criteria

These are the target acceptance criteria. Current results are recorded in [M1 results](../milestones/m1-results.md), [Script layer and engine lockdown](./script-layer.md) and [M4](../milestones/m4.md).

- **Functional**: the protected sample game runs and can be completed on all three platforms, with every asset and all story content correct
- **Protection**: `unrpa`, `rpatool`, `RenPack`, `RenpyEx` and `unrpyc` (including `--try-harder` and `un.rpyc` injection) all fail, and no plaintext file is on disk at any time, fonts included
- **Performance**: the CG- and video-heavy sample meets the acceptance line against the unprotected build
- **Usability and CI**: one command on a clean CI runner, correct exit codes, and a passing sample workflow
