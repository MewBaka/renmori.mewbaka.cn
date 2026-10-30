---
title: Script layer and engine lockdown
description: The M2 encryption transform for Ren'Py scripts, the block on injected decompilers, and the release lockdown measures
---

# Script layer and engine lockdown

M1 already encrypts every `.rpyc` inside the container, so off-the-shelf tools cannot reach them on a shipped build. M2 adds **defense in depth** for the Ren'Py script *source*, for the case where the container contents are exposed (a leaked or derived container key, or a memory dump), plus **engine hardening** that blocks injected decompilers and locks down the distribution build.

## 1. Script transform (baseline)

Compiled scripts carry their AST as a pickle in the RPYC2 slot payload (`zlib(pickle((data, stmts)))`). At build time RenMori replaces each pickle payload with:

```
SCRIPT_MAGIC (b"RMSC\x01") || nonce(12) || AES-256-GCM(script_key, pickle)
```

- **`script_key` is independent of the container master key**: exposing the container contents with the master key alone does *not* yield decompilable scripts, because the script key is also needed; it lives in the runtime extension and, in production, in the closed native runtime
- The transform is reversible and lossless: the runtime decrypts back to the exact original pickle before Ren'Py unpickles it, so AST semantics are untouched; the build-side implementation is [`script/transform.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/script/transform.py), and the runtime side is the `renpy.script.loads` patch in [`runtime/hook.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/runtime/hook.py)

### Why this defeats the decompilers

The stored slot payload is no longer a pickle, so a decompiler that extracts it sees only `SCRIPT_MAGIC || ciphertext`. Verified against the following two tools on the same `script.rpyc`:

| Tool | Original `.rpyc` | RenMori-transformed |
|------|------------------|---------------------|
| `unrpyc` | Decompiles to `.rpy` | **Fails** |
| `unrpyc --try-harder` | — | **Fails** (its zlib/base64/hex/escape layers cannot handle AES-GCM) |
| `rpycdec` | Decompiles to `.rpy` | **Fails** (`Unsupported file format`) |

### Closed upgrade: per-build AST structural randomization

Reversing the baseline takes a single keyed step: an attacker who recovers the script key for one build gets the standard pickle back. The closed polymorphism engine goes further. It randomizes the compiled script's *structure* per build, so that even when fully decrypted the payload carries no standard class names a decompiler can dispatch on, and no single reversible key recovers it. It is a build-time transform that never ships to players, and it differs per build, so a break does not port. The mechanism and implementation are proprietary and live in the private `MewBaka/RenMori-core` repository.

## 2. Injection block (engine layer)

`un.rpyc`-style decompilers work by being dropped into `game/` and loaded as a script whose init code dumps everything. RenMori refuses to **open** any script-like file (`.rpyc/.rpymc/.rpy/.rpym/.rpe`) that physically resolves inside the game directory, so an injected file's code never runs. Engine scripts under `renpy/common` are unaffected (the guard is scoped to the game directory). Legitimate Ren'Py scripts come only from the container. Verified: a planted `game/*.rpyc` returns `None` from `load_core`, while container scripts still load.

## 3. Release lockdown

In a protected build the runtime sets `config.developer = False` and `config.console = False`, and refuses the data-exporting subcommands (`compile`, `dialogue`, `translate`, `add_from`, `merge_strings`). `renpy.sh … lint` and `run` still work.

## Verification

```bash
python tools/verify_in_renpy.py --sdk /Applications/renpy-8.5.2-sdk \
    --game /Applications/renpy-8.5.2-sdk/the_question
```

Phase 1 (extension load): assets are byte-identical; each script payload is transformed (no longer a pickle) and reverses to a valid pickle; a script planted on disk is refused. Phase 2 (full `lint`): the engine loads and parses every transformed script end to end with no errors. In addition, the unit tests in [`tests/test_script.py`](https://github.com/MewBaka/RenMori/blob/main/tests/test_script.py) cover the lossless transform round trip. The verification script is [`tools/verify_in_renpy.py`](https://github.com/MewBaka/RenMori/blob/main/tools/verify_in_renpy.py).
