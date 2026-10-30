---
title: CLI Overview
description: The role of the renmori command-line tool, installation methods, command structure, global options and environment variables
---

# CLI Overview

`renmori` is the command-line tool of RenMori. It operates on the distribution build produced by the Ren'Py launcher and, at build time, performs asset packing, script transformation, loader installation and result verification. It neither reads nor modifies the game's source project, does not depend on the Ren'Py SDK, and does not access the network except to download the closed plugin for the first time.

A typical release workflow involves only two commands:

```bash
renmori protect ./dist/MyGame-1.0-pc -o ./dist/MyGame-1.0-pc-protected
renmori verify  ./dist/MyGame-1.0-pc-protected
```

## Scope of the tool

| Stage | Performed by | Notes |
|---|---|---|
| Writing scripts and assets | Developer, Ren'Py SDK | RenMori is not involved |
| Producing the distribution build | Ren'Py launcher *Build Distributions* | The input to RenMori |
| Packing, encryption, script transformation, loader installation | `renmori protect` | Outputs a protected distribution build |
| Verifying the protected build | `renmori verify` | Can serve as a CI gate |
| Runtime decryption | The loader extension and native core shipped with the game | Performed on the player's machine, inside the engine |
| Upload and distribution | Developer, SteamPipe, itch.io and others | See [Releasing to Steam](../integration/steam-release.md) |

## Installation

`renmori` is published as the PyPI package `renmori` and requires Python 3.9 or later. The dependency `cryptography` is installed automatically; it is used only by the build-time tool, and the protected game does not depend on any pip package at runtime.

```bash
pip install renmori
renmori --version
```

To install it as a standalone command-line tool, uv or pipx can also be used; both create an isolated environment for `renmori`:

```bash
uv tool install renmori
pipx install renmori
```

Reading the `renmori.toml` configuration file requires `tomllib` from the standard library of Python 3.11 or later; to use a configuration file on 3.9 or 3.10, `tomli` must be installed additionally:

```bash
pip install tomli
```

To modify the source or take part in development, install from the repository in editable mode:

```bash
git clone https://github.com/MewBaka/RenMori.git
cd RenMori
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
```

## Invocation

After installation, the tool can be invoked in two equivalent ways:

```bash
renmori <command> [options]
python -m renmori <command> [options]
```

When the system has several Python environments and `renmori` is not on `PATH`, the second form makes explicit which interpreter is used.

## Commands

| Command | Purpose | Reference |
|---|---|---|
| `renmori protect <build-dir \| build.zip>` | Protects a distribution build: packs and encrypts all assets, transforms compiled scripts, deletes plaintext originals, and writes the loader extension and build manifest | [protect](./protect.md) |
| `renmori verify <protected-dir>` | Re-verifies a protected build against its build manifest: container hash, required files, plaintext leftovers | [verify](./verify.md) |
| `renmori --version` | Prints the tool name and version, then exits | — |
| `renmori -h`, `renmori <command> -h` | Prints help, then exits | — |

## Global options

The following options apply to both `protect` and `verify` and must be placed after the subcommand, for example `renmori protect ./build --quiet`.

| Option | Default | Effect |
|---|---|---|
| `--lang {auto,en,zh}` | `auto` | Sets the language of user-facing output. `auto` reads `RENMORI_LANG`, `LC_ALL`, `LC_MESSAGES`, `LANG`, `LANGUAGE` and the system locale in that order, and uses Chinese when the value starts with `zh`, English otherwise; on Windows the system UI language is also read |
| `--no-color` | Off | Disables ANSI colors. Colors are disabled automatically when stderr is not a terminal or the `NO_COLOR` environment variable is set |
| `--quiet` | Off | Suppresses styled progress output and writes only the final JSON line to stdout; errors are written to stderr as plain text in the form `error: <message>`. Also treated as non-interactive mode, skipping all confirmation prompts |

:::tip
The CLI output language currently supports Chinese and English. The output language affects only the progress output on stderr; the JSON keys and values on stdout are always in English, so parsing the result behaves identically under any locale. See [Output, Build Manifest and Exit Codes](./output.md) for details.
:::

## Environment variables

| Environment variable | Applies to | Effect |
|---|---|---|
| `RENMORI_LANG` | All | Fixes the output language to `en` or `zh`; takes precedence over the locale variables |
| `NO_COLOR` | All | Disables ANSI colors when set |
| `RENMORI_PLUGIN` | `protect` | Path to the closed plugin executable, equivalent to `--plugin`; when set, no automatic download takes place |
| `RENMORI_NO_DOWNLOAD` | `protect` | When set to any non-empty value, the plugin is not downloaded automatically; if the plugin is missing, full protection fails immediately and `--strength auto` falls back to baseline |
| `RENMORI_PLUGIN_BASE_URL` | `protect` | Fetches the plugin and `SHA256SUMS` from this address, for use with an internal mirror |
| `RENMORI_PLUGIN_TAG` | `protect` | Specifies the release tag from which the plugin is fetched; also determines the local cache directory |
| `XDG_CACHE_HOME`, `LOCALAPPDATA` | `protect` | Determine the root directory of the plugin cache; see [Protection Strength and the Closed Plugin](./plugin.md) |
| Variables named in the `[keys]` section of the configuration file | `protect` | Source of the container key and script key for baseline protection; see [Configuration File renmori.toml](./configuration.md) |

## Processing overview

```
Ren'Py launcher Build Distributions
        │  distribution build directory, or a release archive such as *-pc.zip
        ▼
renmori protect
  1. Resolve input (directory, or extract the .zip and locate the build root containing game/)
  2. Merge configuration (command line > renmori.toml > defaults)
  3. Determine protection strength; fetch and verify the closed plugin if needed
  4. Pre-flight: output or backup directory conflicts, number of files to pack
  5. Print summary and confirm (interactive terminals only)
  6. Copy or back up → pack and encrypt → transform scripts → delete plaintext → write loader extension → write build manifest
        │  protected distribution build
        ▼
renmori verify  →  upload or package for distribution once verification passes
```

## Related pages

- [`renmori protect`](./protect.md): all options, file handling rules and the execution flow
- [`renmori verify`](./verify.md): checks performed and usage
- [Configuration File renmori.toml](./configuration.md): all configuration keys and merge rules
- [Output, Build Manifest and Exit Codes](./output.md): output formats for scripts and CI to parse
- [Protection Strength and the Closed Plugin](./plugin.md): the difference between baseline and full protection; obtaining and caching the plugin
- [Troubleshooting](./troubleshooting.md): all error messages and how to resolve them
