---
title: "M1 results: asset layer"
description: The baseline asset layer delivered and verified in milestone M1, covering the encrypted container, the runtime loader hook, in-engine crypto backends, off-the-shelf tool failures and performance figures
---

# M1 results: asset layer

M1 delivered and verified the baseline asset layer: an encrypted container that replaces the Ren'Py RPA archive, a runtime loader hook, and crypto backends that run inside Ren'Py's bundled Python. Verification used Ren'Py 8.5.2 and exercised both the SDK sample project `the_question` and a gigabyte-class distribution build of thousands of assets, so that every asset type and the streaming path were covered.

The target platform is Windows; the development and verification host is macOS/arm64. The Windows runtime path (CNG) is written and verified separately under M4.

## What was proven

Every asset type decrypts byte-identically through the real `renpy.loader` inside the engine, compared against the SHA-256 of each original file:

| Asset type | Delivery path |
|------------|---------------|
| Image: sprite, CG (PNG/JPG) | Buffer |
| Audio (Opus/OGG) | Buffer |
| Script (`.rpyc`) | Buffer |
| Translation (`tl/<language>/`) | Buffer |
| Font, small (TTF) | Buffer |
| Font, large, multi-MB (TTF) | Stream |
| Video, large: WebM/OGV/AVI | Stream |

`lint` parses every `.rpyc` and translation file from the container, so the Ren'Py script layer loads in full. After protection, no plaintext archive, `.rpyc` or `.rpy` remains on disk; only `renmori.rmc` and `renmori.rpe` remain, plus the runtime `cache/`.

## Off-the-shelf tools fail

- `unrpa` rejects the container: its version auto-detection fails, because the container is not an RPA archive
- No `.rpyc` or `.rpy` remains on disk for `unrpyc` to decompile
- Signature carving over a gigabyte-class container finds zero multi-byte magics (`PNG`, `RENPY RPC2`, `OggS`, `RIFF`, `OTTO`, `zip`), leaving only the statistically expected rate of coincidental three-byte hits, none of them recoverable; the container is indistinguishable from random data

## Performance: baseline reference reader

Sequential decryption throughput through the Python reference reader (ctypes → OpenSSL EVP in `librenpython`, AES-256-GCM per 64 KB chunk), measured inside Ren'Py on multi-MB assets, is approximately 74 MB/s. That is far above realtime video and audio decode rates, which need only a few MB/s. Small assets take the buffer path and then Ren'Py's own C-buffer RWops, with no further per-read GIL contention.

These figures are for the reference reader; the shipping native decryptor removes the per-chunk Python call overhead. A perceptual before-and-after frame-time comparison during actual play is tracked separately in the benchmark harness.

## Key architecture facts established

- Hook points: `file_open_callbacks` (inserted at the front) and `scandirfiles_callbacks` (discovery plus `lower_map`); the `.rpe` extension loads before `index_files()` (see [Loader hook](../technical/loader-hook.md))
- AES inside Ren'Py with no third-party dependencies: OpenSSL EVP exported by `librenpython` on macOS/Linux (located next to `sys.executable`), CNG on Windows; `_ctypes` is built into all three shipped runtimes
- The `to_rwops` reopen trap is avoided: streaming objects expose neither `.name` nor `.raw`

## Known gaps and next steps

:::tip
This list reflects the state at the completion of M1. The `renpy.exists()` fallback that consults the container was implemented in [M4](./m4.md), and the baseline script transform is described in [Script layer and engine lockdown](../technical/script-layer.md).
:::

- `renpy.exists()` (disk-only `transfn`) returns False for containerized files; a patch is prepared should any project require it
- The baseline placeholder key is embedded in `autorun.py`; runtime key derivation is the closed component
- The baseline script layer still ships standard `.rpyc` (encrypted at rest); the custom AST format is the closed polymorphism layer
- The windowed perceptual performance benchmark (frame time) is tracked in the benchmark harness
