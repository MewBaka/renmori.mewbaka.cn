---
title: "How to Protect a Ren'Py Game from unrpa and unrpyc"
description: "Why Ren'Py games are easy to unpack, why renaming or obfuscating rpa and rpyc files does not stop unrpa, rpatool or unrpyc, how RenMori prevents unpacking and decompiling, and what no protection can stop."
---

# Protecting a Ren'Py game from unpacking and decompiling

Developers who search for "how to protect a renpy game", "renpy encryption", "prevent unrpyc" or "stop unrpa" usually have the same problem: once the game ships, its script, sprites, CGs and audio can be pulled out in one click with off-the-shelf tools such as `unrpa`, `rpatool` and `unrpyc`, then redistributed.

This page explains why Ren'Py games are easy to unpack, why the common workarounds do not stop those tools, how RenMori prevents unpacking and decompiling, and what no client-side protection can do.

## Why Ren'Py games are so easy to unpack

Neither of Ren'Py's own formats is encrypted:

- **`.rpa` archives** are an index followed by the files concatenated together, with at most an XOR "obfuscation" key
- **`.rpyc` scripts** are the Ren'Py AST pickled and zlib-compressed, so a decompiler only has to unpickle them to rebuild the `.rpy` source

The Ren'Py documentation admits that obfuscation only stops casual browsing, and the lead developer closed the asset-encryption feature request as infeasible ([renpy/renpy#2546](https://github.com/renpy/renpy/issues/2546)). As a result, the public tooling sits almost entirely on the unpacking side:

| Tool | What it does |
|------|--------------|
| `unrpa` | Extracts `.rpa` archives, RPA-1.0 to 4.0 and their variants |
| `rpatool`, `RenPack` | List, extract and rewrite `.rpa` archives, XOR keys included |
| `RenpyEx` | Extracts `.rpa` and `.rpyc` and auto-detects the key from `options.rpy` |
| `unrpyc` | Decompiles `.rpyc`, with `--try-harder` deobfuscation |
| `un.rpyc` | Dropped into `game/`, it loads with the game and dumps every script from inside the process |
| `rpycdec` | Decompiles `.rpyc` and `.rpymc` |

## Why the usual tricks do not work

Most community workarounds only make the files look different, and the tools above already handle them:

- **Renaming `.rpa`, editing the archive header or `loader.py`**: `unrpa` supports the archive variants, and `RenpyEx` can auto-detect the key from `options.rpy`
- **Changing the `.rpyc` magic, or wrapping the payload in zlib, base64 or hex**: unrpyc's deobfuscator scans for altered headers and tries zlib, hex, base64 and escape decoding layer by layer, up to 10 layers
- **Hiding scripts in image files, or loading only whitelisted archives**: either trivially bypassed or unverified
- **Ren'Py's built-in obfuscation**: the documentation itself says it only stops casual browsing

To make these tools fail for real, a protector has to abandon RPA and the standard pickle format entirely and make the format differ on every build. The full survey is in [Research: the state of Ren'Py protection](../technical/research.md).

## How to stop unrpa and rpatool from extracting archives

RenMori does not use RPA at all. Scripts, sprites, CGs, audio, video, fonts, translations and configuration are packed into an encrypted container and decrypted only inside the running engine, and at no point is a decrypted file left on disk.

A protected build has no `.rpa` files on disk, so tools that read RPA, such as `unrpa`, `rpatool`, `RenPack` and `RenpyEx`, have nothing to work on. `unrpa` has been tested against protected builds and fails; the others have not yet been run one by one. The container is specified openly in [Container format v1](../technical/container-format.md).

## How to stop unrpyc from decompiling rpyc scripts

Scripts carry a separate layer of protection in case the container contents are exposed through a leaked key or a memory dump: at build time RenMori replaces every `.rpyc` pickle payload with AES-256-GCM ciphertext under a script key that is independent of the container key. A decompiler no longer finds a pickle, so it cannot rebuild the source:

| Tool | Original `.rpyc` | After RenMori |
|------|------------------|---------------|
| `unrpyc` | Decompiles to `.rpy` | Fails |
| `unrpyc --try-harder` | — | Fails |
| `rpycdec` | Decompiles to `.rpy` | Fails |

Full protection with the closed-source plugin also randomizes the structure of compiled scripts per build, so even a fully decrypted payload contains none of the standard class names a decompiler dispatches on. See [Script layer and engine lockdown](../technical/script-layer.md).

## How to stop un.rpyc and other injected decompilers

`un.rpyc`-style tools work by being placed in `game/`, loaded as a script with the game, and dumping everything. RenMori refuses to open any script-like file (`.rpyc`, `.rpymc`, `.rpy`, `.rpym`, `.rpe`) inside the game folder; legitimate scripts come only from the encrypted container, so injected code never runs.

A protected build also turns off developer mode and the console and refuses the data-exporting subcommands such as `compile`, `dialogue` and `translate`. Builds made with the native launcher (the default with the plugin, 1.2.5 and later) refuse to start at all when loose scripts or extensions are present in the game folder.

## Does it stop AI-driven cracking?

An AI agent that only knows how to call the off-the-shelf tools faces the same wall as a person running them by hand: the tools fail, so the agent has nothing to work with. Every RenMori build is different, so reverse engineering one game does not carry over to another game or version, and there is no "RenMori unpacker" to share on a forum.

## Can a Ren'Py game be made uncrackable?

No, and no client-side protection can. The game runs on the player's machine, so the decryption logic ships with it, and the rendered frames and decoded audio exist in memory and on screen. RenMori does not stop:

- screenshots and screen recording of the game
- a skilled attacker ripping memory from the running process
- a dedicated expert who spends the time on one specific game and version
- attacks that make the engine run the attacker's own code, such as edits to the engine's own Python files

RenMori does not provide online licensing or hardware binding either. What it does is make every standard Ren'Py unpacking and decompiling tool fail, leave no plaintext on disk, and make every build different, which raises the cost of extraction to per-game, per-version expert effort. See the [threat model](../technical/threat-model.md).

## Does protection slow the game down?

Hardly noticeably. Measured on a real GalGame with about 3.5 GB of assets, random reads add at most about 0.15 ms, under 1% of a frame at 60 FPS; cold-cache sequential reads run at 584 MB/s; and the `game/` folder grows by only 0.09%. Cold start takes about 1.3 s longer, once, at launch. See the [real-game benchmark](../milestones/benchmark-game.md).

## Encrypt a Ren'Py game in three steps

1. Run *Build Distributions* in the Ren'Py launcher to get a distribution build or `.zip` archive
2. Install RenMori and protect the build:

   ```bash
   pip install renmori
   renmori protect ./dist/MyGame-1.0-pc -o ./dist/MyGame-1.0-pc-protected
   ```

3. Verify the result to confirm no plaintext assets are left:

   ```bash
   renmori verify ./dist/MyGame-1.0-pc-protected
   ```

The full walkthrough is in the [Quick Start](./quick-start.mdx).

## Other questions

### Does RenMori cost anything?

No. Protecting any Ren'Py game is free, commercial titles included, and the runtime may be redistributed with the game at no cost.

### Which Ren'Py versions are supported?

Ren'Py 8.x (Python 3). Projects on Ren'Py 7.x or older Python 2 engines are not supported.

### Do I need to change my game's source?

No. RenMori works directly on the distribution build or `.zip` archive produced by the Ren'Py launcher. Ship the protected folder as it is and do not rebuild it with the launcher, or the protection is lost.

### Can I release on Steam?

Yes, see [Releasing on Steam](../integration/steam-release.md). The runtime has been verified in real Ren'Py engines on Windows, Linux and macOS; verification on Steam Deck (Proton) is still in progress.
