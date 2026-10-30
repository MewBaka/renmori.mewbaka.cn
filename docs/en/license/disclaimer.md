---
title: Disclaimer
description: All disclaimer terms that apply when using RenMori, covering warranty, protection effectiveness, limitation of liability, third-party components, trademarks and documentation accuracy
---

# Disclaimer

This page collects the disclaimer terms from the RenMori license, the NOTICE file and the threat model so that they can be understood in full before use. RenMori is provided under the [RenMori License 1.0](https://github.com/MewBaka/RenMori/blob/main/LICENSE). If this page differs from the license text, the license text governs; the English LICENSE is the authoritative version of the license.

By using, installing, modifying or distributing with a game any component of RenMori, you indicate that you have read and accept the following terms.

## Scope

This disclaimer applies to the following. The first three items are governed by the RenMori license; the fourth is the accompanying documentation:

- The RenMori framework and the command-line tool `renmori`
- The closed native plugin
- The runtime components RenMori embeds into a protected game, including the loader extension, the encrypted container format, and the native core and launcher
- This documentation site and the documentation, samples and data in the repository

## No warranty

The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. The authors do not guarantee that the Software is free of defects, that it will operate without interruption, or that it is compatible with any particular version of Ren'Py, operating system, hardware, distribution platform or third-party software.

## No guarantee of protection

No local content protection running on a player's device is unbreakable. A game must read and present its own resources on the player's machine, so all information required for decryption is necessarily distributed with the game. RenMori raises the cost and skill required to extract a protected game's assets and scripts; it does not and cannot guarantee that a determined attacker will not succeed.

Specifically, RenMori does not defend against the following:

- Capturing content at the presentation stage, such as screen recording, screenshots and audio recording
- A skilled attacker extracting memory from the running process
- Expert reverse engineering with a sustained investment in a single title and a single version
- Targeted extraction under the baseline protection format: the container structure of the baseline format is public, and the keys and reader are distributed with the game in plaintext

The authors are not liable for any extraction, piracy, unauthorized redistribution, loss of revenue, or other loss. For a complete description of the scope of protection, see [Threat model](../technical/threat-model.md).

## Limitation of liability

In no event shall the authors be liable for any claim, damages, or other liability, whether in contract, tort, or otherwise, arising from, out of, or in connection with the Software or its use, including but not limited to:

- Loss of or damage to original builds, source projects, save data or other data
- A game failing to start, behaving abnormally, suffering degraded performance or being incompatible with a particular platform
- Failure to pass a distribution platform's review, removal of a product from sale, or action taken against an account
- Lost sales, loss of goodwill, or any indirect, incidental, special or consequential damages resulting from the above

The in-place protection mode of `renmori protect` deletes the plaintext originals. Users are responsible for keeping their own backups of the source project and the original distribution build, and for completing testing on all target platforms before release.

## Responsibilities of the user

Users bear full responsibility for the games they protect with RenMori and distribute, including:

- The legality of the game content itself, and the licensing of the materials, fonts, music and other assets used by the game
- Compliance with the license terms of Ren'Py and its bundled components, for example preserving their license notices
- Compliance with the obligations attached to components licensed under the LGPL or GPL, such as FFmpeg
- Compliance with the rules and review requirements of distribution platforms such as Steam
- Safekeeping of the keys and backup directories used during the build process

Using RenMori does not change the copyright or licensing status of the game itself. The license's grant of use applies regardless of the game's own content or licensing, but this does not constitute any endorsement of the game's content by the authors.

## Third-party components

The Software includes or links third-party components that are licensed under their own terms; see the [NOTICE](https://github.com/MewBaka/RenMori/blob/main/NOTICE) file. Nothing in the RenMori license limits any right you have under those terms for those components, and the authors make no warranty of any kind regarding third-party components.

RenMori is not affiliated with or endorsed by the Ren'Py project. The name "Ren'Py" is used only to identify the engine to which RenMori applies.

## Trademarks

"RenMori" and its logo are marks of the RenMori authors. The license grants no right to use them, except to state accurately that a game was protected with RenMori.

## Accuracy of documentation and data

The performance data, verification results and compatibility statements on this site are taken from the verification records and format specifications in the project repository, and the measurement or estimation conditions are stated. These data reflect results in specific environments and do not constitute a commitment regarding the performance or protection effectiveness of any particular project. The documentation may change with version updates; where the content differs from actual behavior, the source code of the corresponding version prevails.

## Termination of the license

Any use outside the grants of the license terminates the rights the license gives you. Your rights under sections 1 and 2 of the license for games you have already lawfully distributed are not affected.

## Not legal advice

The RenMori license was prepared by the project and has not been reviewed by a lawyer. Nothing on this page or on this site constitutes legal advice. Consult a suitably qualified legal professional before making commercial or legal decisions based on it.

## Related files

- [RenMori License 1.0 (English, authoritative version)](https://github.com/MewBaka/RenMori/blob/main/LICENSE)
- [RenMori License 1.0 (Chinese translation)](https://github.com/MewBaka/RenMori/blob/main/LICENSE.zh-CN.md)
- [NOTICE](https://github.com/MewBaka/RenMori/blob/main/NOTICE)
- [Threat model](../technical/threat-model.md)
