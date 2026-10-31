---
title: Configuration File renmori.toml
description: The lookup order of renmori.toml, the rules for merging it with command-line options, and all configuration keys in [protect] and [keys]
---

# Configuration File renmori.toml

`renmori protect` runs without any configuration. When protection parameters need to be fixed across a team, or the same settings reused in CI, a TOML configuration file `renmori.toml` can be used. All keys in the configuration file are optional; keys that are not set use their default values.

## Lookup order

1. The file specified with `-c, --config FILE`. If the file does not exist, the command fails with exit code 2
2. `renmori.toml` in the build root, that is, `<game-dir>/renmori.toml`
3. `renmori.toml` in the current working directory

The first file found is used, and the path used is reported on stderr. If none of the three exists, all defaults are used.

:::tip
A `renmori.toml` placed in the build root lies outside `game/` and is not packed, but it remains in the build directory. If you do not want the configuration file to appear in the release, place it in the working directory, or specify another location with `-c`.
:::

Reading the configuration file requires Python 3.11 or later; on Python 3.9 or 3.10, `tomli` must be installed additionally, otherwise the command fails with exit code 2.

## Merge rules

| Setting | Rule |
|---|---|
| General settings | Command-line options > configuration file > defaults |
| Exclusion lists | Not overridden; merged in the order `steam_appid.txt` (built in), `keep_on_disk`, `exclude`, command-line `--exclude` |
| `lockdown` | The configuration file may set `true` or `false`; the command-line `--no-lockdown` takes precedence and forces it off |
| `keep_plaintext` | Takes effect when enabled in either the configuration file or on the command line |
| `launcher` | On by default; the configuration file may set `true` or `false`, and the command-line `--launcher` or `--no-launcher` takes precedence |

## `[protect]` section

| Key | Type | Default | Corresponding option | Description |
|---|---|---|---|---|
| `strength` | String | Not set (full protection) | `--strength` | Protection strength: `baseline`, `auto` or a strength declared by the plugin |
| `lockdown` | Boolean | `true` | `--no-lockdown` | Turns off developer mode, the developer console and the data-export subcommands in the protected build |
| `chunk_size` | Integer | `65536` | `--chunk-size` | Container chunk size in bytes |
| `keep_plaintext` | Boolean | `false` | `--keep-plaintext` | Keeps the plaintext originals after protection; for troubleshooting only |
| `exclude` | Array of strings | `[]` | `--exclude` | File patterns to keep on disk, unencrypted |
| `keep_on_disk` | Array of strings | `[]` | — | File patterns read by programs other than the engine that must be kept as plaintext; `steam_appid.txt` is always included |
| `platforms` | Array of strings | Auto-detected | `--platforms` | Plugin only: list of target platforms |
| `launcher` | Boolean | `true` | `--launcher` / `--no-launcher` | Plugin only: binds the keys to the native launcher and installs it as each platform's entry point |

### `strength`

| Value | Behavior |
|---|---|
| Not set | Full protection, which requires the closed plugin; fails if the plugin is unavailable |
| `"baseline"` | Open baseline format; the plugin is not used |
| `"auto"` | Full protection when the plugin is available, baseline otherwise |
| A value declared by the plugin | For example the polymorphic strength `"poly"`; handed to the plugin |

For the detailed differences, see [Protection Strength and the Closed Plugin](./plugin.md).

### `lockdown`

When enabled, the runtime sets `config.developer` and `config.console` to `False` and refuses to run the Ren'Py command-line subcommands `compile`, `dialogue`, `translate`, `add_from` and `merge_strings`. These subcommands can export scripts and text data to disk and should be disabled in release builds. Set it to `false` only when the developer console is needed in an internal test build.

### `chunk_size`

Each chunk is encrypted independently and carries a 16-byte authentication tag. The default of 65536 bytes corresponds to a size overhead of about 0.024%. Larger chunks favor sequential reads of large CGs and videos, while smaller chunks reduce the overhead for many small files. Under full protection the chunking parameters are determined by the plugin per build.

### `exclude` and `keep_on_disk`

Both keep matching files on disk, unencrypted; they differ in purpose: `keep_on_disk` declares files read by programs other than the engine, while `exclude` covers other cases in which files must remain plaintext. Patterns are matched against game-relative paths using Python `fnmatch` semantics; `*` can cross directory separators, and matching is case-insensitive on Windows.

```toml
[protect]
keep_on_disk = ["steam_appid.txt", "thirdparty/sdk_config.json"]
exclude = ["licenses/*"]
```

:::danger
Do not exclude script files. The runtime loader refuses to open script-type files such as `.rpy`, `.rpyc`, `.rpym` and `.rpymc` located on disk in `game/`, so excluded scripts cannot be loaded.
:::

### `platforms`

Applies to the plugin only. When not set, the plugin detects the platforms from the `lib/py3-*` directories in the build. The available values are determined by the plugin, for example:

```toml
platforms = ["win-x64", "linux-x64", "mac-universal"]
```

### `launcher`

Applies to the plugin only. When enabled, the keys are bound to the native launcher, which is shipped with the build, and the keys are reconstructed only when the game is started through that launcher.

## `[keys]` section

`[keys]` applies to baseline protection only and specifies the sources of the container key and the script key. Under full protection the plugin derives the keys itself and ignores this section.

| Key | Description |
|---|---|
| `master_env` | Name of the environment variable holding the container master key |
| `script_env` | Name of the environment variable holding the script key |

Rules:

- The value of the environment variable must be 64 hexadecimal characters, that is, a 32-byte key; if the format is invalid, the command fails with exit code 2
- When `master_env` or `script_env` is not set, a random key is generated for this build
- When a key name is set but the environment variable does not exist or is empty, a notice is printed to stderr and a random key is likewise generated
- The summary panel shows the key sources, for example `master=env:RENMORI_MASTER_KEY · script=random`

```toml
[keys]
master_env = "RENMORI_MASTER_KEY"
script_env = "RENMORI_SCRIPT_KEY"
```

One way to generate a key:

```bash
python -c "import os; print(os.urandom(32).hex())"
```

For how to store keys in CI, see [CI integration](../integration/ci.md).

:::warning
The baseline format writes the keys in plaintext into the loader extension shipped with the game; fixed keys only ensure consistency across builds and do not improve the security of the baseline. For the role of the baseline, see [Protection Strength and the Closed Plugin](./plugin.md).
:::

## Complete example

```toml
# renmori.toml

[protect]
# Full protection is used when strength is not set; "auto" falls back to baseline when the plugin is unavailable
strength = "auto"

# Keep enabled for release builds
lockdown = true

# Baseline only; under full protection the plugin determines the chunking parameters
chunk_size = 65536

# Never enable in release builds
keep_plaintext = false

# Files to keep as plaintext
exclude = []
keep_on_disk = ["steam_appid.txt"]

# Plugin only
# platforms = ["win-x64", "linux-x64", "mac-universal"]
# launcher = true

[keys]
# Baseline only
# master_env = "RENMORI_MASTER_KEY"
# script_env = "RENMORI_SCRIPT_KEY"
```

Example file in the repository: [examples/renmori.toml](https://github.com/MewBaka/RenMori/blob/main/examples/renmori.toml).
