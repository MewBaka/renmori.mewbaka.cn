---
title: Plugin interface
description: The stable process contract between the open renmori command-line tool and the closed protection plugin, covering discovery, transport, operations, division of responsibility and versioning
---

# Plugin interface

RenMori is open-core. The open `renmori` command-line tool is the integration point: it parses configuration, prepares the output and backup, drives the user-facing flow, and always ships the baseline container format. The strong protection (the per-build polymorphism engine, runtime key derivation, and the native core and launcher) lives in a closed plugin that is distributed as a prebuilt component and never as source.

This page defines the stable process contract between the two. The contract is public so that the open tool and the closed plugin can be versioned and released independently; only the plugin's implementation is closed.

## Discovery

The open tool locates the plugin in this order:

- The `--plugin <path>` argument to `renmori protect`
- The `RENMORI_PLUGIN` environment variable
- No plugin found: the tool runs the baseline format and refuses any non-baseline `strength`

`<path>` is an executable, or a `.py` script that the open tool runs with the current Python interpreter. A plugin is used only after a successful `capabilities` handshake (see below); a plugin that fails the handshake is treated as absent, and the baseline path is taken.

:::tip Current CLI behavior
Beyond the explicit paths above, the current CLI also checks a local cache and, when needed, downloads the plugin from the public release, verifies it against `SHA256SUMS`, and caches it. With `strength` unset the default is full protection, and the run fails if no plugin is available; `--strength auto` falls back to the baseline without a plugin; `--strength baseline` never downloads the plugin. See [Closed plugin](../cli/plugin.md).
:::

## Transport

Every call is one short-lived subprocess, and the first argument selects the operation. The request, when one is needed, is a single JSON object on **stdin**; the response is a single JSON object on **stdout**. All human-readable logging goes to **stderr**, so stdout stays machine-parsable. The exit code is 0 on success and non-zero on failure. All field names and enumerated values are ASCII and locale-independent.

Both objects carry an integer `interface` field. The open tool sends the highest version it supports and refuses a plugin whose `capabilities` do not include that version.

## Operations

### `capabilities`

No request body. The plugin prints a JSON object describing itself and exits with 0:

| Field | Meaning |
|-------|---------|
| `interface` | Highest interface version the plugin supports |
| `name` | Plugin display name |
| `version` | Plugin release version |
| `strengths` | The `strength` values the plugin accepts, strongest first |
| `platforms` | The target platform keys the plugin can produce |

### `protect`

The request object on stdin:

| Field | Meaning |
|-------|---------|
| `interface` | Interface version chosen by the open tool |
| `source_dir` | The distribution build to read; the plugin must not modify it |
| `output_dir` | Where the protected build is written; the plugin creates it, and it must not already exist |
| `strength` | One of the plugin's advertised `strengths` |
| `platforms` | An explicit list of target platform keys, or `null` to auto-detect from `source_dir/lib/py3-*` |
| `launcher` | Whether to bind the keys to a native launcher and ship it |
| `exclude` | Game-relative globs to leave outside the container |
| `chunk_size` | Container chunk size in bytes, or `null` for the plugin's default |
| `lockdown` | Whether to disable the developer console, developer mode and data-export subcommands in the build |
| `keys` | An object reserved for key material or key-source directives; empty by default |

The plugin copies `source_dir` to `output_dir`, packs every asset and Ren'Py script into the polymorphic container, ships each target platform's native core (and launcher, when requested), writes the runtime extension, removes the plaintext originals it packed, and prints the response object on stdout:

| Field | Meaning |
|-------|---------|
| `interface` | Interface version of this response |
| `status` | `"ok"` |
| `strength` | The strength actually applied |
| `platforms` | The target platform keys produced |
| `container` | The container file name under `game/` |
| `container_sha256` | Hex SHA-256 of the container |
| `files` | Number of entries packed |
| `scripts` | Number of scripts transformed |
| `cores` | One `{platform, filename}` per shipped native core |
| `launcher` | Per-platform launcher file names, or `null` |

On failure the plugin prints `{"interface": N, "status": "error", "message": "<reason>"}` and exits with a non-zero code. The open tool reports the message, exits with its runtime-failure code, and avoids leaving a partial `output_dir` wherever it can.

## Division of responsibility

- The open tool owns: argument and `renmori.toml` parsing, the output and backup decision and any copy or move it entails, the pre-flight summary and confirmation, the manifest it writes from the response, and all localized output
- The plugin owns: the container format and its per-build randomization, key derivation, the native core and launcher, and the exact on-disk result under `output_dir`

In-place protection is expressed to the plugin as a plain `source_dir` → `output_dir` pair: the open tool first moves the original aside (to the backup, or to a temporary directory discarded afterwards) and passes the original path as `output_dir`, so the plugin never needs an in-place mode.

## Versioning and integrity

`interface` is incremented only on a breaking change to the request or response shape. A plugin may support several versions at once, and the open tool selects the highest version both sides share. Additive, optional fields do not bump the version.

A build produced by the plugin is intended to be distinguishable from one a third party assembles with the open framework and a hand-written weak engine: the manifest may carry a build fingerprint that the runtime checks. That binding is defined together with the closed component and is out of scope for this public contract.
