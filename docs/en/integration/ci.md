---
title: CI integration
description: Run RenMori non-interactively in a CI pipeline, manage keys and the closed plugin cache, and gate releases on renmori verify
---

# CI integration

RenMori is a single build-time command that operates on a standard Ren'Py distribution build and requires no changes to the game source. Its input is any directory that contains a `game/` subdirectory, which is what the Ren'Py launcher's Build Distributions produces.

This page covers CI usage only. For the full list of command-line options see [renmori protect](../cli/protect.md); for `renmori.toml` settings see [Configuration](../cli/configuration.md); for the output format, build manifest and exit codes see [Output and exit codes](../cli/output.md).

## Basic pipeline flow

```bash
renmori protect <game-build-dir> -o <output-dir> --quiet
renmori verify  <output-dir>
```

`protect` packs everything under `game/` into `game/renmori.rmc`, transforms the compiled Ren'Py scripts, removes the plaintext originals, writes the loader extension `game/renmori.rpe`, and emits `renmori-manifest.json`. `verify` re-checks a protected build against that manifest (container hash, required files, no plaintext left), which makes it suitable as a CI gate.

With `-o` the original build is never touched (the copy is protected), so no backup is made. Protecting in place, without `-o`, first copies the original to a sibling `<dir>_bak` directory and fails if that directory already exists; `--no-backup` skips the copy.

The final line of stdout is always a JSON object (`{"status": "ok", …}` or `{"status": "error", …}`), and progress goes to stderr. The JSON keys and values stay in English in every locale, so pipeline parsing is unaffected by output styling or language. With `--quiet` only the JSON is printed. Pipelines should decide success or failure from the exit code; the codes are listed in [Output and exit codes](../cli/output.md).

## Non-interactive behavior

RenMori shows confirmation prompts only on an interactive terminal (TTY): the `[y/N]` confirmation before protecting in place, and the confirmation before downloading the closed plugin. All prompts are skipped when any of the following holds, so a pipeline never hangs waiting for input:

- `-y` / `--yes` is passed
- `--quiet` is passed
- stdin is not a TTY (the usual case in CI)

Color is disabled automatically off a TTY, and `NO_COLOR` is honored. The language of the human-facing output follows the system locale and can be pinned with `--lang en|zh` or the `RENMORI_LANG` environment variable.

## Protection strength and the closed plugin

With `strength` unset, RenMori defaults to full protection, the strongest strength reported by the closed plugin. If no plugin is available the run fails instead of silently falling back to the baseline format. In CI, choose as needed:

| Setting | Behavior |
|---------|----------|
| Unset (default) | Use the strongest strength the plugin reports; fail if no plugin is available |
| `--strength auto` | Use the plugin when available, otherwise the baseline format |
| `--strength baseline` | Force the open baseline format; never downloads the plugin |

When a plugin is needed, RenMori looks for the path given by `--plugin` or the `RENMORI_PLUGIN` environment variable, then the local cache, and finally downloads the plugin from the public release, verifies it against `SHA256SUMS`, and caches it. In a non-interactive environment the download proceeds without confirmation. See [Closed plugin](../cli/plugin.md) for the full description.

### Caching the plugin in CI

The plugin cache directory is keyed by the plugin release tag:

| Platform | Cache directory |
|----------|-----------------|
| Linux / macOS | `$XDG_CACHE_HOME/renmori/plugin/<tag>`, or `~/.cache/renmori/plugin/<tag>` when `XDG_CACHE_HOME` is unset |
| Windows | `%LOCALAPPDATA%\renmori\plugin\<tag>` |

Persisting this directory between CI runs avoids downloading the plugin on every build. In GitHub Actions, add a cache step before the Protect step, with a cache key that matches the plugin release tag RenMori uses:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/renmori/plugin
    key: renmori-plugin-${{ runner.os }}-plugin-v1.2.6
```

The following environment variables give further control over how the plugin is obtained:

| Variable | Effect |
|----------|--------|
| `RENMORI_PLUGIN` | Explicit plugin path; skips the cache and the download, suitable for offline runners with a pre-provisioned plugin |
| `RENMORI_NO_DOWNLOAD=1` | Never download automatically; without a plugin the run fails or falls back to the baseline, depending on the strength setting |
| `RENMORI_PLUGIN_BASE_URL` | Location of the plugin files and `SHA256SUMS`; defaults to the public release |
| `RENMORI_PLUGIN_TAG` | Plugin release tag to pull; also selects the cache subdirectory |

## Key management

The `[keys]` section applies to the baseline format only. With the closed plugin, the plugin derives its own keys and does not read these settings.

By default `protect` generates a fresh random master key and an **independent** script key for every build and embeds them in the loader extension (a baseline placeholder; the closed runtime derives keys at runtime instead). To manage keys yourself, name the environment variables that hold them in `renmori.toml`; each key is 64 hex characters (32 bytes):

```toml
[keys]
master_env = "RENMORI_MASTER_KEY"
script_env = "RENMORI_SCRIPT_KEY"
```

Populate these variables from your CI secret store and never commit keys to the repository. If a named variable is unset, RenMori falls back to a random key and reports it.

:::warning
RenMori reads only the environment variables named in `[keys]`. Without a `[keys]` section in `renmori.toml`, setting `RENMORI_MASTER_KEY` and similar variables in CI has no effect, and every build still uses random keys.
:::

Output is not byte-reproducible across builds even with fixed keys (each file uses a random salt), by design. Pipelines should assert on the result of `verify` and on the file list in the manifest, not on the container hash across builds.

## GitHub Actions example

[`examples/github-actions-protect.yml`](https://github.com/MewBaka/RenMori/blob/main/examples/github-actions-protect.yml) in the repository demonstrates the complete flow: build the game, run `renmori protect` and `renmori verify`, then upload the protected distribution build as an artifact.

```yaml
# Example GitHub Actions workflow: build a Ren'Py game, protect it with renmori,
# verify the result, and upload the protected build as an artifact.
#
# Copy to .github/workflows/protect.yml and adapt the build step to your project.
# renmori runs on the CI runner (the build environment); the protected runtime
# ships inside the game and needs no Python there.

name: Protect Ren'Py build

on:
  workflow_dispatch:
  push:
    tags: ["v*"]

jobs:
  protect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install renmori
        run: pip install renmori

      # Replace this with your real Ren'Py build. It must produce a directory
      # that contains a game/ subdirectory, e.g. dist/MyGame-1.0-pc.
      - name: Build the game
        run: |
          # renpy.sh "$PWD" distribute   # or your existing build script
          echo "produce ./dist/MyGame-pc here"

      # Full protection (the default) uses the closed plugin, downloaded once from
      # the public release and verified against SHA256SUMS. Cache it between runs;
      # keep the key's tag in sync with the plugin release tag renmori pulls.
      - uses: actions/cache@v4
        with:
          path: ~/.cache/renmori/plugin
          key: renmori-plugin-${{ runner.os }}-plugin-v1.2.6

      - name: Protect
        # The plugin derives its own keys, so no key secrets are needed here. Key
        # environment variables apply only to --strength baseline, and only when
        # renmori.toml names them in its [keys] section.
        run: |
          renmori protect ./dist/MyGame-pc -o ./dist/MyGame-pc-protected --quiet

      - name: Verify
        run: renmori verify ./dist/MyGame-pc-protected

      - uses: actions/upload-artifact@v4
        with:
          name: MyGame-pc-protected
          path: ./dist/MyGame-pc-protected
```

To use it:

1. Copy the file to `.github/workflows/protect.yml` in your project
2. Replace the Build the game step with your actual Ren'Py build command; it must produce a directory that contains a `game/` subdirectory
3. Adjust the triggers as needed; the example runs on manual dispatch and on pushes of `v*` tags
4. The example already includes the plugin cache step; when an upgrade of RenMori changes the plugin release tag, update the cache key to match

RenMori runs only on the CI runner (the build environment); the protected runtime ships inside the game, and players need no separate Python installation. The example runs at the default strength and therefore obtains the closed plugin on the runner. The plugin derives its own keys, so the Protect step needs no key configuration. Key variables take effect only with the baseline format and only when the `[keys]` section of `renmori.toml` names them, as described under Key management above.

## End-to-end check against a real engine (optional)

[`tools/verify_in_renpy.py`](https://github.com/MewBaka/RenMori/blob/main/tools/verify_in_renpy.py) protects a sample game and confirms, inside a real Ren'Py SDK, that every asset decrypts byte-perfectly, that Ren'Py scripts are transformed yet still parse, and that injected scripts are refused. Point it at an SDK and a game; the check is skipped where no SDK is available.
