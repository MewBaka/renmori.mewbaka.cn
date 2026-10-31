---
title: Contribution Requirements
description: Requirements for submitting code, documentation, issue reports and security vulnerability reports to RenMori, including the Contributor License Agreement, contribution scope and security principles
---

# Contribution Requirements

RenMori uses an open-core architecture: the source code of the framework and tools in this repository is public, while per-build polymorphism, key derivation and the anti-tamper runtime are provided by a separate closed-source binary plugin. This page describes the requirements for contributing to the open parts, as well as for submitting issue reports and security vulnerability reports.

## Contributor License Agreement (CLA)

Because RenMori has closed-source components built partly on the open codebase, **every contributor must agree to a Contributor License Agreement before their contribution can be merged**. The CLA grants the project the rights to:

- Use the contribution in the open-source distribution
- Use the contribution in the closed-source build
- Release the contribution under new license terms if the license terms of the open parts change

Without a CLA, the project cannot accept code, because it could not lawfully use that code in the closed-source build. The CLA process for individuals and corporations will be announced in the repository once finalized. Until then, please open an issue to discuss the proposed change and confirm your willingness to sign the CLA before writing code, so that no one contributes work that cannot yet be accepted.

## Contribution scope

### In scope

- The CLI, config parsing, exit-code and CI behavior, GitHub Actions samples
- The `renpy.loader` hook framework and runtime SDK
- The baseline container format v1 and its reader and writer
- The usage of standard cryptographic primitives (the algorithms themselves are public standards)
- Documentation, samples, tests, and compatibility fixes across Ren'Py 8.x versions

### Out of scope

The following parts are closed-source components; do not submit implementations of them, and please do not reverse-engineer them:

- The per-build polymorphism and mutation engine
- Key-derivation obfuscation and key-recovery logic
- Native anti-tamper internals

If a change needs to touch the process interface between the open CLI and the closed plugin, propose an interface change in an issue first. The interface is open and versioned, but both sides must stay compatible. For the interface definition, see [Plugin interface](../technical/plugin-interface.md).

## Security principles

Every contribution must respect the following principles. These are hard rules, not preferences:

1. **Performance wins**: no measure that regresses runtime performance is merged, including frame time, scene transitions, and CG and video playback. Nothing anti-debug or self-checking may be added on the hot path
2. **No plaintext on disk**: plaintext resources must never be left on disk under any circumstances, fonts included
3. **Decrypt data only; never generate or execute decrypted code at runtime**: this allows the macOS version to run without additional entitlements; see [Architecture](../technical/architecture.md)
4. **No telemetry, no phone-home**: the loader framework is open precisely so that users can verify this. The runtime shipped in games makes no network requests, and the build-time CLI accesses the network only to download the closed plugin from the public release (verified against `SHA256SUMS`). Do not add any other network calls
5. **Honesty about protection**: code comments, documentation and output messages must not contain claims that exceed what the [Threat model](../technical/threat-model.md) allows, and must not use wording such as "uncrackable"

## Code contribution workflow

1. Open an issue describing the proposed change, and confirm your willingness to sign the CLA
2. Branch from `main`
3. Keep changes focused; include tests where the open code is testable
4. Make sure the sample protect-and-run flow still passes and performance is unchanged
5. Open a pull request referencing the corresponding issue

## Documentation contributions

The source of this documentation site is located at [MewBaka/renmori.mewbaka.cn](https://github.com/MewBaka/renmori.mewbaka.cn), and the original versions of the technical documents are located in the `docs/` directory of the RenMori repository. Documentation contributions must meet the following requirements:

- Use the established terminology of visual novel and Ren'Py development, for example Ren'Py script, sprite, CG, archive, save data, distribution build
- Write in professional, rigorous and precise language, avoiding colloquial expressions
- Use a period only at the end of a paragraph; list items, tables and headings do not end with a period
- Statements about protection capability, performance and compatibility must be backed by verification records or format specifications, with the measurement conditions stated

## Issue reports

When submitting an issue on [GitHub Issues](https://github.com/MewBaka/RenMori/issues), provide the following information so that the issue can be reproduced and located:

- The output of `renmori --version`
- The Ren'Py version and the target platforms of the build
- The operating system and Python version on which `renmori` is run
- The protection strength used and the complete command line
- The result JSON on the last line of stdout and the error messages on stderr
- If the issue occurs while the game is running, the entries beginning with `renmori:` in Ren'Py's `log.txt`

Before submitting, remove keys, personal paths and other sensitive information from the logs, and do not attach resource files of the protected game.

## Reporting security vulnerabilities

Please **do not** report a vulnerability in the protection scheme through a public issue. A dedicated private disclosure channel will be announced in the repository once established; until then, contact the maintainer directly: [team@mewbaka.cn](mailto:team@mewbaka.cn).

The threat model already documents what is not protected, such as screen recording, memory extraction and expert reverse engineering targeting a single title. These are known limits, not vulnerabilities.
