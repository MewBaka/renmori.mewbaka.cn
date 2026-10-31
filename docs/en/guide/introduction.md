---
title: Introduction
description: RenMori is a full-data protection tool for commercial Ren'Py visual novels; this page covers what it protects, who it is for, testing status and licensing
---

# Introduction

RenMori is a full-data protection tool for commercial Ren'Py visual novels, supporting the Ren'Py 8.x engine. It works directly on the distribution build produced by the Ren'Py launcher and never modifies the project source. Every piece of game data, including scripts, sprites, CGs, audio, video, fonts, translations and configuration, is packed into an encrypted container and decrypted only inside the running engine, so no plaintext assets or `.rpy` source are left on the player's disk.

RenMori is completely free. "Ren" in the name refers to Ren'Py, and "Mori" comes from the Japanese word 守 (mori), meaning to guard.

RenMori follows an open-core architecture: the tool source is publicly visible, and the native core is distributed as a closed-source binary. The open-source CLI handles packing, verification and CI integration; the closed-source native plugin provides full-strength runtime protection and is downloaded from the public release, verified and cached automatically on first use. Developers who need to work fully offline or prefer not to use the plugin can use the open-source baseline format instead.

## Key features

- **Full-data encryption**: covers every data type in the game, not only scripts or archives
- **Non-invasive**: runs on the distribution build, and can also process the `.zip` archive produced by the launcher directly
- **Zero configuration by default**: an optional `renmori.toml` controls chunk size, exclusion lists, locking, protection strength and key source
- **CI-ready**: emits machine-readable JSON results with explicit exit codes, and `renmori verify` can serve as a pipeline gate
- **Storefront support**: a [Steam release guide](https://github.com/MewBaka/RenMori/blob/main/docs/steam-release.md) covers compatibility with the Steam Overlay, DRM and Steamworks

## What RenMori protects

RenMori takes a game built with Ren'Py 8.x and produces a protected distribution that prevents unauthorized extraction of game data. Every piece of data in the game, including scripts, sprites, CGs, audio, video, fonts, translations and configuration, is packed into an encrypted container and decrypted only inside the running engine.

It defends against:

- Extraction of assets and scripts with off-the-shelf unpackers and decompilers such as `unrpa`, `rpatool` and `unrpyc`
- Automated cracking by AI agents that merely invoke existing tools¹
- Batch, scripted extraction pipelines

¹ RenMori is specifically hardened against automated cracking by AI agents, but this has reached the inherent ceiling of offline client-side DRM: whoever can reproduce the game's real runtime environment, or dump the memory of the running process, obtains the plaintext as the game decrypts it, and protection can only raise the time and cost this takes; only online licensing or hardware binding can go beyond that ceiling, and for GalGames and visual novels such schemes cost far more than they return, so RenMori commits to defeating general-purpose tools and the AI agents that call them, and to requiring new, dedicated expert reverse engineering for every title and version, but does not promise that a game cannot be cracked.

RenMori is not an absolute shield. A game that runs on the player's machine can never be made uncrackable; RenMori raises the cost of cracking as far as possible but cannot withstand expert-level reverse engineering, as described in the [threat model](https://github.com/MewBaka/RenMori/blob/main/docs/threat-model.md). Since most reverse engineers do not invest extensive time in a single title, RenMori provides effective protection for the vast majority of games.

RenMori aims to defeat every general-purpose unpacking tool and raise the cost of extraction to dedicated, expert-level effort, rather than to eliminate all risk.

## Is RenMori right for you

### Suitable for

- Commercial visual novels developed with Ren'Py 8.x (Python 3) and intended for release on Steam or other platforms
- Projects concerned about off-the-shelf unpackers and decompilers such as `unrpa`, `rpatool` and `unrpyc` extracting scripts, sprites, CGs or audio for redistribution
- Frequently updated titles where reverse-engineering results for an old version should not carry over to a new one
- Teams that want protection integrated into CI, with packing and verification completed automatically after every distribution build
- Individuals and small teams that do not want to pay licensing fees for protection

### Not suitable for

- Requiring a game to be completely uncrackable, which no client-side protection can achieve, RenMori included
- Defending against screen recording, or against skilled attackers dumping memory from the running process
- Withstanding expert reverse engineering with long-term investment in a single title and version
- Projects based on Ren'Py 7.x or earlier Python 2 engine versions

## Testing status

The runtime has been verified in real Ren'Py engines on Windows, Linux and macOS, and verification on Steam Deck (Proton) is still in progress.

As the team does not currently have Steam developer access, Steam SDK, Steam Overlay and related features have not yet been tested. If you encounter any integration or compatibility issues, please contact us by email or open an issue in the [GitHub repository](https://github.com/MewBaka/RenMori/issues), and we will do our best to help.

:::warning Test before release
Always complete testing on every target platform before release.
:::

## License

RenMori is released under the [RenMori License 1.0](https://github.com/MewBaka/RenMori/blob/main/LICENSE), a source-available license that is not an OSI open-source license. Protecting any Ren'Py game is free, including commercial titles, and the runtime may be redistributed with the game free of charge. Selling RenMori itself or a modified version of it, or using it to offer a paid encryption service, is prohibited.

For the complete disclaimer terms, the contribution requirements and license guidance for developers, see [Disclaimer](../license/disclaimer.md), [Contribution Requirements](../license/contributing.md) and [Notes for Developers](../license/developer-notes.md).

## Contact

For licensing questions or technical assistance, please email [team@mewbaka.cn](mailto:team@mewbaka.cn).
