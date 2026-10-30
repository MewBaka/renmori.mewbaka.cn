---
title: Protection Strength and the Closed Plugin
description: The difference between baseline protection and full protection, and how the closed plugin is obtained, verified, cached, used offline and negotiated through the capability handshake
---

# Protection Strength and the Closed Plugin

RenMori uses an open-core architecture. The open-source `renmori` CLI handles packing, verification and CI integration, and includes a fixed open baseline format; full-strength protection is provided by a closed native plugin. The plugin itself is a free precompiled binary; only its source code is closed.

## The two protection strengths

| Aspect | Baseline protection | Full protection |
|---|---|---|
| How to enable | `--strength baseline` | Default, or `--strength` set to a strength declared by the plugin |
| Plugin required | No; neither downloaded nor invoked | Yes; downloaded automatically on first use |
| Container format | The fixed, public container format v1 | A polymorphic format randomized for every build |
| Keys | Generated per build or read from environment variables, and written in plaintext into the loader extension | Derived by the plugin at runtime; no plaintext key is stored on disk |
| Script layer | Compiled scripts are re-encrypted with a separate script key | Performed by the plugin, including a per-build AST encoding transformation |
| Native core and launcher | None | Native core; optional native launcher (`--launcher`) |
| Offline operation | Always possible | Possible once the plugin is cached |
| Defends against | Off-the-shelf unpacking and decompilation tools such as `unrpa` and `unrpyc` | Off-the-shelf tools, as well as generic unpackers written against a single format |
| Intended use | Development and debugging, fully offline environments, situations in which the plugin cannot be used | Official releases |

:::warning
The container structure of the baseline format is public, and the keys and reader are distributed with the game in plaintext. It defeats off-the-shelf tools but does not constitute real protection against a targeted attacker. Use full protection for official releases. For the threat model of both, see [Threat model](../technical/threat-model.md).
:::

## How the strength is determined

| `--strength` or `strength` | Plugin available | Plugin unavailable |
|---|---|---|
| Not set | Uses the strongest strength declared by the plugin | Fails with exit code 2; does not degrade to baseline |
| `baseline` | Does not use the plugin; uses baseline | Uses baseline |
| `auto` | Uses the strongest strength declared by the plugin | Uses baseline |
| Any other value | Used if the plugin supports the value; fails otherwise | Fails with exit code 2 |

The default behavior prefers failing over degrading automatically, in order to avoid releasing a build with only baseline strength without noticing. When the behavior "use full protection if the plugin is available, otherwise baseline" is wanted, specify `auto` explicitly.

## Plugin lookup order

When the plugin is needed, `renmori` searches in the following order and uses the first available result:

1. The file specified by `--plugin PATH`
2. The file specified by the environment variable `RENMORI_PLUGIN`
3. The plugin in the local cache
4. Automatic download from the public release

If a specified path does not exist, a notice is printed to stderr and the search continues with the subsequent steps. When `RENMORI_NO_DOWNLOAD` is set, step 4 is skipped.

## Automatic download

### Platforms and files

| Platform running `renmori` | File downloaded |
|---|---|
| Windows x64 | `renmori-plugin-win-x64.exe` |
| Linux x64 | `renmori-plugin-linux-x64` |
| macOS Apple silicon | `renmori-plugin-mac-arm64` |
| macOS Intel | `renmori-plugin-mac-x86_64` |

The plugin is selected according to the platform running `renmori` and is unrelated to the game's target platforms; the target platforms are determined by `--platforms` or by automatic detection. Platforms not listed above have no downloadable plugin and can only specify one with `--plugin` or use baseline protection.

### Download flow

1. Determine the download address: by default `https://github.com/MewBaka/RenMori/releases/download/<tag>/`, where `<tag>` defaults to the plugin tag built into the current version and can be overridden by `RENMORI_PLUGIN_TAG`; when `RENMORI_PLUGIN_BASE_URL` is set, the download is made from that address instead
2. Confirm: in an interactive terminal the prompt `Full protection needs the closed plugin. Download <file> from <url> ? [Y/n]` is shown, and answering `n` or `no` abandons the download; in CI, non-interactive environments, or with `--quiet` or `-y`, the download proceeds directly
3. Fetch `SHA256SUMS` from the same address and look up the checksum for the corresponding file; abandon if no corresponding entry is found
4. Download the plugin file, compute its SHA-256 and compare it with `SHA256SUMS`; on a mismatch, discard the file and print "Downloaded plugin failed its checksum; discarded"
5. Write to a temporary file first, then atomically replace the cache path with it; on macOS and Linux, set the executable permission

If any step fails, the plugin is treated as unavailable: when no strength is set the command fails, and with `auto` it falls back to baseline.

### Cache location

| Platform | Cache directory |
|---|---|
| Windows | `%LOCALAPPDATA%\renmori\plugin\<tag>\` |
| macOS, Linux | `$XDG_CACHE_HOME/renmori/plugin/<tag>/`, or `~/.cache/renmori/plugin/<tag>/` when unset |

The cache is stored in a separate directory per release tag; after upgrading `renmori` or changing `RENMORI_PLUGIN_TAG`, the new directory for the corresponding tag is used. Deleting the cache directory forces a fresh download.

## Environment variables

| Environment variable | Effect |
|---|---|
| `RENMORI_PLUGIN` | Uses the plugin at the specified path, skipping the cache and download; equivalent to `--plugin` |
| `RENMORI_NO_DOWNLOAD` | When set to any non-empty value, never downloads; an existing cache is still used |
| `RENMORI_PLUGIN_BASE_URL` | Fetches the plugin and `SHA256SUMS` from this address; suitable for an internal mirror |
| `RENMORI_PLUGIN_TAG` | Specifies the release tag; also determines the cache subdirectory |

## Offline and internal network environments

- **Pre-populated cache**: run full protection once on a machine with network access, then copy the cache directory to the same location on the offline machine
- **Fixed path**: place the plugin file on the build machine and specify it with `RENMORI_PLUGIN` or `--plugin`
- **Internal mirror**: serve both the plugin file and `SHA256SUMS` from an internal server, and point `RENMORI_PLUGIN_BASE_URL` at that address
- **No network access**: set `RENMORI_NO_DOWNLOAD=1` to ensure that the build process makes no network requests

For how to cache the plugin in CI, see [CI integration](../integration/ci.md).

## Capability handshake

Before using the plugin, `renmori` invokes it with the `capabilities` subcommand and reads the JSON it returns, which includes the interface version supported by the plugin and the list of available strengths. The plugin is treated as unavailable in the following cases:

- The plugin cannot be executed, returns a non-zero exit code, or does not respond within 30 seconds
- The returned content is not valid JSON
- The interface version is lower than the version required by `renmori`, in which case stderr shows `plugin interface … unsupported`

After a successful handshake, `renmori` invokes the plugin with the `protect` subcommand, passes through stdin a request JSON containing the source directory, output directory, strength, platforms, launcher, exclusion list, chunk size and lockdown setting, and reads the result from the last line of the plugin's stdout; the plugin's progress output goes directly to stderr. A plugin whose name ends in `.py` is run by the current Python interpreter; otherwise it is executed directly.

For the complete process interface between the open-source tool and the closed plugin, see [Plugin interface](../technical/plugin-interface.md).
