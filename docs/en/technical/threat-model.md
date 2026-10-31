---
title: Threat model
description: What client-side protection can and cannot do, which attacks RenMori stops and which it does not, and the claim the project is allowed to make
---

# Threat model

RenMori is honest about what client-side protection can and cannot do. This page is the reference for every claim the project, and its marketing, is allowed to make; read it before promising anything.

## The premise you cannot escape

A Ren'Py game runs on the player's machine. To run, the engine must read its own assets, so:

- the decryption logic ships with the game
- the key material is derivable on the client, because nothing else could decrypt
- the final rendered frames and the decoded audio exist in memory and on screen

Therefore **no client-side tool can make a game uncrackable.** A skilled, determined attacker with the shipped binary, a debugger and enough time will eventually extract any single asset from any single game. This is the white-box problem, and every local DRM scheme in history has eventually fallen to it. Anyone who claims otherwise is misrepresenting what client-side protection can do.

## What RenMori actually changes

The realistic levers, in order of value:

1. **Defeat the off-the-shelf tools**: `unrpa`, `rpatool`, `RenPack`, `RenpyEx` and `unrpyc` (including `--try-harder` and `un.rpyc` injection) fail on a protected build; this matters because the overwhelming majority of real asset-rip and script-leak incidents are simply someone running one of these tools, and an AI agent that only knows how to call them falls into the same category
2. **Make breaks non-portable**: per-build polymorphism means that reverse engineering one game produces a tool for *that game and that version*, not a reusable unpacker, so there is no "RenMori unpacker" to share on a forum
3. **Make old breaks age out**: each release rotates the scheme, so a leaked or reversed older build does not help against newer ones
4. **No plaintext on disk**: at no point is any file, fonts included, left decrypted on the filesystem

Verification status of item 1: `unrpa`, `unrpyc` (including `--try-harder`), `rpycdec` and planted on-disk scripts are covered by the records in [M1 results](../milestones/m1-results.md) and [Script layer and engine lockdown](./script-layer.md). `rpatool`, `RenPack` and `RenpyEx` have not yet been run against a protected build; they read the same RPA archives and `.rpyc` files, which no longer exist on disk in a protected build.

## Attacks RenMori does not stop

State these plainly to users:

- **Screenshots and screen recording** of what is displayed: unstoppable by definition
- **Memory ripping** by a skilled attacker (for example NinjaRipper-class tools against the running process): lazy chunked decryption raises the cost but does not prevent it
- **A dedicated expert** targeting one specific game and willing to spend the time: they can win against that one game and version, but cannot turn the win into a universal tool

Truly stopping injected extractors would require kernel-level anti-cheat, which is out of scope, hostile to players, and incompatible with the performance-first and Steam Deck/Proton goals.

## The claim the project is allowed to make

> RenMori makes every standard Ren'Py unpacking and decompiling tool fail, leaves no plaintext on disk, and makes every build different so that no universal unpacker can exist. It raises the cost of extraction to dedicated, per-game, per-version expert effort. It does not and cannot make a game uncrackable.

Anything stronger than that is not supportable and must not appear in documentation, the README or marketing material. The [RenMori License](https://github.com/MewBaka/RenMori/blob/main/LICENSE) carries matching no-warranty and limitation-of-liability terms; see the [Disclaimer](../license/disclaimer.md).
