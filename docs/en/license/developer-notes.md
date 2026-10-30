---
title: Notes for Developers
description: What developers protecting and releasing games with RenMori need to know about the scope of the license, third-party license obligations, key and backup management, and the pre-release checklist
---

# Notes for Developers

This page is intended for developers and publishers who use RenMori to protect their own titles. It describes what the license permits and prohibits, the third-party license obligations that must be fulfilled when distributing with a game, and the checks to complete before release. The terms of the [RenMori License 1.0](https://github.com/MewBaka/RenMori/blob/main/LICENSE) govern; for the disclaimer terms, see [Disclaimer](./disclaimer.md).

## What the license permits

| Use | Basis |
|---|---|
| Using RenMori free of charge to protect any Ren'Py game, including commercial titles, with no royalty | License section 1 |
| Selling a protected game and shipping the RenMori runtime inside it at no charge | License section 2 |
| Modifying RenMori for your own use in protecting your own games | License section 3 |
| Stating accurately that a game was protected with RenMori | License section 5 |

The grant of use applies regardless of the game's own content or licensing. The RenMori runtime may leave your hands only as embedded in your own protected game.

## What the license prohibits

Whether for a fee or free of charge, you may not:

- Sell, resell, rent, lease, sublicense, or distribute RenMori itself, or any substantial part of it, as a product or an offering, whether unmodified or modified
- Offer a paid or commercial service that protects or encrypts Ren'Py games for others using RenMori, for example a "Ren'Py encryption" or "代加密" service
- Distribute a modified version of RenMori to third parties, or present any modified version as RenMori
- Use the "RenMori" name or logo other than to state accurately that a game was protected with RenMori, for example in the name or promotion of another product

Any use outside the grants of the license terminates the rights the license gives you, but games that have already been lawfully distributed are not affected.

:::tip
If you are unsure whether a particular use falls within the scope of the license, for example performing protection for a partner's title, or integrating RenMori into a tool, engine or service, contact [team@mewbaka.cn](mailto:team@mewbaka.cn) first to confirm.
:::

## Crediting RenMori in your game

The license does not require crediting RenMori in the game. If you wish to credit it, you may use an accurate statement in the credits or technical notes, for example:

```
Resource protection: RenMori (https://renmori.mewbaka.cn)
```

Do not use wording that could lead others to believe the game was developed, published or endorsed by the RenMori authors, and do not modify the RenMori logo.

## Third-party license obligations

A protected distribution build still contains the Ren'Py engine and its bundled third-party components. RenMori does not change the license terms of these components, and the corresponding obligations remain with the party that releases the game.

| Component | Obligation |
|---|---|
| Ren'Py | Ren'Py is distributed under a liberal (MIT-like) license, with some bundled components under their own terms. Preserve Ren'Py's own license and notices with the game, and do not delete the related files in the distribution build |
| FFmpeg | The FFmpeg bundled with Ren'Py is used for audio and video decoding and is licensed under LGPL-2.1+, with some builds or configurations under GPL. Carry FFmpeg's license text with the game and provide the source offer as required; verify the license of the exact FFmpeg build shipped |
| Other bundled components | Fulfill the obligations set out in [NOTICE](https://github.com/MewBaka/RenMori/blob/main/NOTICE) and in each component's own license |

The baseline flow of `renmori protect` processes only the `game/` directory and does not modify the engine files and their license files in `renpy/`, `lib/` and the build root. As required by NOTICE, RenMori's protection must not statically bind FFmpeg in a way that defeats LGPL relinking. Before release, confirm that the license files above are still present in the release.

## Keys and backups

- **Backup directory**: the `<dir>_bak` created by in-place protection contains all plaintext resources and scripts, and must never be uploaded or distributed with the release
- **Baseline keys**: store the environment variables named in `[keys]` as CI secrets; do not write them into configuration files, scripts or the repository. The baseline format writes the keys into the loader extension shipped with the game; fixed keys serve only to keep builds consistent and do not improve the security of the baseline
- **Full protection**: the keys are derived by the closed plugin at build time; developers neither need to nor can manage them separately
- **Build manifest**: `renmori-manifest.json` contains no keys, but the baseline manifest lists the paths and sizes of all assets. Whether to keep it in the release is your decision; complete `renmori verify` before deleting it
- **Source project**: RenMori protects only the distribution build; the source project and `.rpy` scripts must still be protected by your own means, such as repository access control

## Pre-release checklist

- [ ] The protected build is a fresh distribution build produced by the Ren'Py launcher
- [ ] The official release uses full protection, not `--strength baseline`
- [ ] Lockdown is on; `--no-lockdown` was not used
- [ ] `--keep-plaintext` was not used
- [ ] `exclude` and `keep_on_disk` contain no script files and no unnecessary resources
- [ ] `renmori verify` passes
- [ ] The game has been launched and played through on all target platforms, covering saving, loading, the CG gallery, the music room, video playback and language switching
- [ ] Both `renmori.rmc` and `renmori.rpe` are included in the release
- [ ] The release does not contain the `_bak` backup directory, key files or the source project
- [ ] The protected directory has not been built again with the Ren'Py launcher after protection
- [ ] The license files of Ren'Py, FFmpeg and other components are still present in the release
- [ ] When releasing on Steam, no Steam DRM executable wrapper has been applied on top; see [Releasing to Steam](../integration/steam-release.md)

## Compatibility and testing

RenMori targets Ren'Py 8.x (Python 3) and does not support Ren'Py 7.x or earlier Python 2 versions. The runtime has been verified in the real Ren'Py engine on Windows, Linux and macOS; verification on Steam Deck (Proton) is still in progress. Because the team does not yet have Steam developer access, Steam-related features such as the Steam SDK and the Steam overlay have not been tested on real hardware.

Projects that customize Ren'Py's loading process, use third-party plugins that read files directly from disk, or read resources in `game/` from Python code through file system APIs instead of `renpy.loader` may need to configure `keep_on_disk` for the corresponding files and should test the related features thoroughly after protection.

## Privacy

The RenMori runtime only decrypts data inside the engine; it does not collect player information and makes no network requests. The loader framework is open precisely so that developers and players can verify this. The `renmori` CLI accesses the network only when obtaining the closed plugin for the first time, and this can be disabled entirely with `RENMORI_NO_DOWNLOAD`.

## Getting help

- License scope and technical assistance: [team@mewbaka.cn](mailto:team@mewbaka.cn)
- Issue reports: [GitHub Issues](https://github.com/MewBaka/RenMori/issues); for the submission requirements, see [Issue reports](./contributing.md#issue-reports)
- Security vulnerabilities: do not report them publicly; see [Reporting security vulnerabilities](./contributing.md#reporting-security-vulnerabilities)
