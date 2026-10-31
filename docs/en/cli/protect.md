---
title: renmori protect
description: Protect a Ren'Py distribution build, covering input forms, output modes, file handling rules, the execution flow and all options
---

# renmori protect

`renmori protect` converts a Ren'Py distribution build into a protected distribution build: the assets and compiled scripts under `game/` are sealed into the encrypted container `game/renmori.rmc`, compiled scripts additionally undergo the script-layer transformation, the plaintext originals are deleted, and the loader extension `game/renmori.rpe` and the build manifest `renmori-manifest.json` are written. When the game starts, Ren'Py loads this extension automatically, and the extension decrypts and supplies resources inside the engine.

## Syntax

```bash
renmori protect <game-dir | game.zip> [options]
```

| Argument | Description |
|---|---|
| `game-dir` | The root directory of the distribution build, that is, the directory that directly contains the `game/` subdirectory. Do not pass `game/` itself |
| `game.zip` | A release archive produced by the Ren'Py launcher, for example `MyGame-1.0-pc.zip` or `MyGame-1.0-mac.zip` |

## Input

### Build directory

The input directory must directly contain a `game/` subdirectory; otherwise the command fails with exit code 2. If `renmori.rmc` already exists in `game/`, the build is already protected, and the command likewise fails with exit code 2 without protecting it a second time. Always use a fresh distribution build, or the backup created before protection, as the input.

### Release archive (.zip)

When the input is a valid `.zip` file, `protect` first extracts it and then protects the extracted result:

1. Determine the output directory: the directory given by `-o` if specified; otherwise a directory next to the archive, named after the archive without its extension, for example `MyGame-1.0-pc/` for `MyGame-1.0-pc.zip`. This directory must not exist
2. Create a temporary directory in the parent of the output directory and extract into it. Before extraction, every archive member path is checked; any member that would be extracted outside the target directory (zip-slip) causes the command to fail
3. Locate the build root: if the extraction root itself contains `game/`, it is used directly; otherwise the command looks among the top-level subdirectories for exactly one directory that contains `game/`, which corresponds to the common case of the launcher wrapping the build in a folder of the same name. If none or more than one is found, the command fails
4. Move the build root to the output directory, then process that directory in the same way as in-place protection, and clean up the temporary directory

The original archive always remains unchanged and serves as the original, so no `_bak` backup is created when the input is an archive.

## Output modes

| Mode | Triggered when | Original build | Backup |
|---|---|---|---|
| In-place protection (default) | `-o` not specified, input is a directory | Rewritten into a protected build | First copied to the sibling directory `<dir>_bak` |
| In-place protection without backup | `-o` not specified, `--no-backup` specified | Rewritten into a protected build | Not created; the operation is irreversible |
| Output to a new directory | `-o OUTPUT` specified | Remains unchanged | Not needed; `OUTPUT` must not exist |
| Protection from an archive | Input is a `.zip` | The archive remains unchanged | Not needed; the archive is the original |

:::warning
In-place protection deletes the plaintext originals under `game/`. If `<dir>_bak` already exists, the command fails with exit code 2 before making any change; delete the old backup, use `-o` instead, or use `--no-backup` once you have confirmed that no backup is needed. The backup directory contains all plaintext resources; never upload it together with the release.
:::

## Execution flow

The command runs in the following order, and every foreseeable conflict is checked before any file is modified.

1. **Resolve input**: a directory is used directly; a `.zip` is first extracted and the build root located
2. **Preconditions**: confirm that `game/` exists and is not yet protected
3. **Merge configuration**: read `renmori.toml` (if present) and merge it with the command-line options; see [Configuration File renmori.toml](./configuration.md)
4. **Determine protection strength**: when no strength is specified, full protection is used and the closed plugin is required; when `baseline` is specified, the open baseline format is used and the plugin is not downloaded; when `auto` is specified, full protection is used if the plugin is available, and baseline otherwise. For how the plugin is obtained, see [Protection Strength and the Closed Plugin](./plugin.md)
5. **Prepare keys** (baseline only): read the container key and script key from the environment variables named in `[keys]`; when none is named or the variable is not set, a random key is generated for this build
6. **Pre-flight the output location**: check whether the `-o` directory or `<dir>_bak` already exists, and count the files and scripts to be packed; fail if there are no files to pack
7. **Print summary and confirm**: print the input, mode, file count, script count, lockdown state and key sources to stderr; in an interactive terminal, ask for confirmation `[y/N]`; any answer other than `y` or `yes` cancels, in which case `{"status": "aborted"}` is printed and the command exits with code 2
8. **Copy or back up**: in `-o` mode, copy the entire build to the output directory; in in-place mode, first copy to `<dir>_bak` (skipped with `--no-backup`)
9. **Pack and encrypt**: write the files to be packed one by one into `game/renmori.rmc`; `.rpa` archives are unpacked and their entries written individually, and compiled scripts are written after the script-layer transformation
10. **Delete plaintext**: delete the packed originals and the stripped `.rpy` sources, and remove subdirectories that become empty as a result (skipped with `--keep-plaintext`)
11. **Write the loader extension**: generate `game/renmori.rpe`
12. **Write the build manifest**: generate `renmori-manifest.json` in the build root, and print the result JSON to stdout

When the closed plugin is used, step 5 is not performed and the plugin derives the keys itself; steps 8 to 11 are performed by the plugin, and the build manifest is still written by `renmori`. In in-place mode, `renmori` first moves the original build to the backup directory (with `--no-backup`, to a temporary directory that is deleted on success), and the plugin then reads from that directory and writes an entirely new build; if the plugin fails, the original build is moved back into place, and in `-o` mode any incomplete output is deleted.

## File handling rules

`protect` walks all files under `game/` and classifies them according to the following rules. The table describes the baseline protection flow; under full protection the plugin performs the packing, and its file selection likewise follows the `exclude` and `keep_on_disk` settings.

| File | Handling |
|---|---|
| Assets such as images, audio, video, fonts and translations | Sealed into the container; plaintext originals deleted |
| `.rpyc`, `.rpymc` compiled scripts | Sealed into the container after the script-layer transformation; plaintext originals deleted |
| `.rpy`, `.rpym` sources with a compiled file of the same name | Not packed; deleted directly. The engine executes only compiled scripts, and shipping the sources with the release would let any single decryption yield the original script directly |
| `.rpy`, `.rpym` sources without a compiled file | Sealed into the container so that the content is not lost |
| `.rpa` archives (RPA-3.0, RPA-2.0) | Unpacked, with each entry sealed into the container as an individual file; the archive is deleted. When an entry conflicts with a loose file of the same name on disk, whichever is encountered first is kept |
| `game/saves/` | The entire directory is skipped; save data is left as is |
| `.rpyb` in `game/cache/` | Sealed into the container. These files are compiled caches derived from the scripts |
| Other files in `game/cache/` | Skipped and left as is, for example `shaders.txt` and `build_info.json` |
| `steam_appid.txt` | Kept on disk and unencrypted by default. The Steam SDK reads this file directly, without going through the Ren'Py loader |
| Files matching `exclude` or `keep_on_disk` | Kept on disk, unencrypted |
| Symbolic links and non-regular files | Skipped |

Entry names in the container use Ren'Py's game-relative path form: forward-slash separated, with no leading slash, for example `images/bg room.png`. At runtime the container has the highest priority in the loader chain, so even if a plaintext file of the same name remains on disk, the engine always reads the version in the container.

:::danger
Do not use `exclude` to exclude script files such as `.rpy`, `.rpyc`, `.rpym` and `.rpymc`. The runtime loader refuses to open script-type files located on disk in `game/`, in order to block decompiler injection, so excluded scripts cannot be loaded. `exclude` should only be used for files read by programs other than the engine.
:::

## Options

### Output and backup

#### `-o, --output DIR`

Writes the protected build to `DIR`, leaving the original build unchanged. `DIR` must not exist; otherwise the command fails with exit code 2. If its parent directory does not exist, it is created automatically. This mode does not create a backup. When the input is a `.zip`, `DIR` is the target directory for extraction and protection.

#### `--no-backup`

During in-place protection, does not create the `<dir>_bak` backup and rewrites the original build directly. This operation is irreversible and is recommended only for disposable build directories in CI. This option has no effect when `-o` is specified or the input is a `.zip`.

#### `-y, --yes`

Skips the confirmation prompt before protection, as well as the confirmation prompt when the closed plugin is downloaded for the first time. The prompts are likewise skipped when stdin is not a terminal or `--quiet` is specified.

### Configuration

#### `-c, --config FILE`

Reads the configuration from `FILE`. If the file does not exist, the command fails with exit code 2. When not specified, `<game-dir>/renmori.toml` and `renmori.toml` in the current working directory are searched in that order, and the first one found is used; if neither exists, the default configuration is used. For all configuration keys, see [Configuration File renmori.toml](./configuration.md).

### Protection strength and plugin

#### `--strength S`

Sets the protection strength; corresponds to the configuration key `strength`.

| Value | Behavior |
|---|---|
| Not specified (default) | Full protection: uses the strongest strength declared by the closed plugin. If the plugin is unavailable, fails with exit code 2 and does not automatically degrade to baseline |
| `baseline` | Open baseline format: the fixed container format with the bundled placeholder keys; the plugin is neither downloaded nor invoked |
| `auto` | Uses the plugin's strongest strength when the plugin is available, baseline otherwise |
| Any other value declared by the plugin | Handed to the plugin; fails with exit code 2 if the plugin is unavailable or does not support the value |

For the difference in security between the two, see [Protection Strength and the Closed Plugin](./plugin.md).

#### `--plugin PATH`

Uses the closed plugin at `PATH` and no longer searches the cache or downloads automatically. Equivalent to setting `RENMORI_PLUGIN`; the command-line option takes precedence. If the path does not exist, a notice is printed and the option is ignored, and the search continues with the cache or automatic download. `PATH` may be an executable or a `.py` script run by the current Python interpreter.

#### `--platforms LIST`

Applies to the plugin only. A comma-separated list of target platforms, for example `win-x64,linux-x64,mac-universal`; corresponds to the configuration key `platforms`. When not specified, the plugin detects them automatically from the `lib/py3-*` directories in the build.

#### `--launcher` / `--no-launcher`

Applies to the plugin only and is on by default. Binds the keys to the native launcher and installs the launcher as each platform's entry point (the executable inside the macOS `.app`, `<Name>.exe` on Windows, and `lib/py3-linux-x86_64/<Name>`, which `<Name>.sh` starts, on Linux), keeping the original engine beside it under a `.renmori_real` name, so that the keys are reconstructed only when the game is started through that launcher; `--no-launcher` builds without it. Corresponds to the configuration key `launcher`.

### Encryption parameters

#### `--chunk-size N`

The container chunk size in bytes; corresponds to the configuration key `chunk_size`, default 65536. Each chunk is encrypted independently and carries a 16-byte authentication tag. Larger chunks favor large CGs and videos, while smaller chunks reduce the overhead for many small files. This option determines the chunk size of the baseline container; under full protection the chunking parameters are determined by the plugin per build.

#### `--exclude GLOB`

Keeps files matching `GLOB` on disk, unencrypted; may be specified multiple times. Patterns given on the command line are appended after `exclude` and `keep_on_disk` from the configuration file and do not replace them.

Matching rules:

- Patterns are matched against game-relative paths separated by forward slashes, for example `thirdparty/*` matches files under `game/thirdparty/`
- Python `fnmatch` semantics are used: `*` matches any characters and can cross directory separators, `?` matches a single character, and `[seq]` matches a character set
- Matching is case-insensitive on Windows and case-sensitive on macOS and Linux
- Quote each pattern to prevent premature expansion by the shell, for example `--exclude "thirdparty/*"`

### Runtime behavior

#### `--no-lockdown`

Keeps developer features in the protected build. Lockdown, which is on by default, does the following at runtime:

- Turns off `config.developer` and `config.console`, making developer mode and the developer console unavailable
- Refuses to run the Ren'Py command-line subcommands that can export scripts and text data: `compile`, `dialogue`, `translate`, `add_from`, `merge_strings`

Corresponds to the configuration key `lockdown`; release builds should keep lockdown on.

#### `--keep-plaintext`

Does not delete the plaintext originals after packing, nor the stripped `.rpy` sources; for troubleshooting only. Corresponds to the configuration key `keep_plaintext`. This option applies to the baseline protection flow.

:::danger
A build produced with `--keep-plaintext` provides no protection whatsoever, and `renmori verify` also reports errors because of the plaintext leftovers. Never release such a build.
:::

### Output control

#### `--no-hints`

Does not print the "package and release" guidance after successful protection. By default the guidance covers: verifying the build, compressing the entire directory for itch.io or direct download, uploading the directory contents through SteamPipe, the requirement that `renmori.rmc` and `renmori.rpe` be distributed together, and not running a Ren'Py launcher build on the directory again.

#### Global options

`--lang`, `--no-color` and `--quiet` also apply; see [CLI Overview](./overview.md#global-options).

## Generated files

| Path | Description |
|---|---|
| `game/renmori.rmc` | The encrypted container, holding all packed assets and the transformed scripts |
| `game/renmori.rpe` | The loader extension, loaded automatically when Ren'Py starts; decrypts and supplies resources inside the engine |
| `renmori-manifest.json` | The build manifest, recording the tool version, container hash, file count and other information for use by `renmori verify`; for its format see [Output, Build Manifest and Exit Codes](./output.md) |
| `<dir>_bak/` | The complete plaintext backup created by in-place protection; not part of the release |

At runtime, Ren'Py also creates a `cache/` directory under `game/`; this is normal engine behavior.

## Examples

Protect a copy, keeping the original build:

```bash
renmori protect ./dist/MyGame-1.0-pc -o ./dist/MyGame-1.0-pc-protected
```

Protect in place, with the original backed up to `./dist/MyGame-1.0-pc_bak`:

```bash
renmori protect ./dist/MyGame-1.0-pc
```

Process the release archive produced by the launcher directly, writing the result to `./dist/MyGame-1.0-pc/`:

```bash
renmori protect ./dist/MyGame-1.0-pc.zip
```

Run non-interactively in CI, printing only JSON:

```bash
renmori protect ./build/MyGame-pc --no-backup --quiet -y
```

Exclude files read directly by a third-party program, and explicitly use the open baseline:

```bash
renmori protect ./dist/MyGame-1.0-pc -o ./out --strength baseline --exclude "thirdparty/*"
```

Use a locally available plugin and specify the target platforms:

```bash
renmori protect ./dist/MyGame-1.0-pc -o ./out --plugin ./renmori-plugin-linux-x64 --platforms win-x64,linux-x64
```

:::warning
The protected directory is the release itself. Do not run the Ren'Py launcher's *Build Distributions* on it again; the launcher rebuilds from the source project and discards all protection.
:::
