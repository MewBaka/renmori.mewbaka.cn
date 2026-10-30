---
title: Releasing to Steam
description: Publish a protected Ren'Py distribution build to Steam in the order build, protect, SteamPipe upload, with depot layout, launch options and Steam compatibility notes
---

# Releasing to Steam

RenMori protects an **already built** Ren'Py distribution build. Publishing to Steam takes three ordered steps, and the order matters:

```
Ren'Py launcher: Build Distributions   →   renmori protect   →   SteamPipe upload
   (from your project source)              (encrypt game/)        (upload the folder)
```

:::danger Do not reverse the order
If you protect first and then re-run the Ren'Py launcher's Build Distributions on your project, the launcher rebuilds from source and produces a fresh **unprotected** distribution build, and the protection is lost. Protect the launcher's output, and never feed a protected folder back into the launcher.
:::

This guide uses the Ren'Py SDK sample project `the_question` and its **market** build as the example, because that build contains all three platforms.

## Which build to upload

The Ren'Py launcher can produce the following builds:

- **pc**: Windows and Linux
- **mac**: macOS
- **market**: one universal package with Windows (`.exe`), macOS (`.app`) and Linux (`.sh`) launchers sharing a single `game/`

Both patterns work on Steam:

| Pattern | What you do | Trade-off |
|---------|-------------|-----------|
| **Market (simple)** | Protect the one market folder; put it in **one depot** mounted on all operating systems; set launch options per operating system | Every player downloads the files for all three platforms |
| **Per-platform (lean)** | Build **pc** and **mac** separately, run `renmori protect` on each, and upload each to its **own depot** (Windows / macOS / Linux) | More steps, but each player downloads only the files for their platform |

RenMori's protection is platform-agnostic: the `renmori.rpe` loader runs inside Ren'Py's own bundled Python on each operating system. As a result, **one `protect` run on the market build covers Windows, macOS and Linux at once**.

## Step 1: Protect

Extract the launcher's market archive to a folder (RenMori takes a directory, not a `.zip`), then run:

```bash
renmori protect ./the_question-7.0-market -o ./the_question-7.0-market-protected
renmori verify  ./the_question-7.0-market-protected
```

Only `game/` changes; the per-platform launchers are untouched:

```
the_question-7.0-market-protected/
├─ game/
│   ├─ renmori.rmc        # all assets, encrypted
│   ├─ renmori.rpe        # runtime loader (Ren'Py loads it automatically)
│   └─ steam_appid.txt    # kept as plaintext (the Steam SDK reads it directly)
├─ lib/                   # untouched — per-platform Python runtimes
├─ renpy/                 # untouched
├─ the_question.app/      # untouched — macOS launcher
├─ the_question.exe       # untouched — Windows launcher
├─ the_question.py
├─ the_question.sh        # untouched — Linux launcher
└─ renmori-manifest.json
```

The plaintext `.rpa` archives and `.rpyc` files that were under `game/` are gone, leaving `unrpa` and `unrpyc` nothing to work with.

## Step 2: Upload with SteamPipe

Steam does **not** accept a single file. A build is **the contents of a folder**, uploaded to a depot with SteamPipe. Therefore:

- **Do not** upload the `.zip`
- **Do not** upload only `renmori.rmc`
- **Do** point the depot's `contentroot` at the **protected folder** and let SteamPipe upload everything in it (`game/`, `lib/`, `renpy/` and the launchers)

`app_build_<APPID>.vdf`:

```
"appbuild"
{
  "appid"       "YOUR_APPID"
  "desc"        "the_question 1.0 (renmori protected)"
  "buildoutput" "D:\steam\output\"
  "contentroot" "D:\dists\the_question-7.0-market-protected\"
  "setlive"     ""          // upload only; set the live branch in the web UI
  "depots"
  {
    "YOUR_DEPOTID"
    {
      "FileMapping" { "LocalPath" "*"  "DepotPath" "."  "recursive" "1" }
    }
  }
}
```

```bash
steamcmd +login YOUR_ACCOUNT +run_app_build "D:\steam\app_build_YOUR_APPID.vdf" +quit
```

The Steamworks SteamPipe GUI performs the same operation; point it at the protected folder.

For **per-platform depots**, protect each platform build separately and give each its own depot with its own `contentroot`.

## Step 3: Launch options

In the Steamworks web interface (Installation → General Installation → Launch Options), set one launch option per operating system, each pointing at the corresponding launcher inside the build:

| Operating system | Executable |
|------------------|------------|
| Windows | `the_question.exe` |
| Linux | `the_question.sh` |
| macOS | `the_question.app` |

The launcher boots Ren'Py, and `renmori.rpe` then takes over asset loading and decrypts assets in memory. The process is transparent to players.

## Steam compatibility notes

- **Do not add Steam DRM on top** (the DRMToolkit executable wrapper): it rewrites the launcher binary, can conflict with runtime self-checks, and is weak on its own, whereas RenMori already protects the data layer
- **The Steam overlay works normally**: RenMori only hooks Ren'Py's file loading and never performs process or DLL injection, so the overlay is unaffected
- **Achievements and Cloud save data** go through Ren'Py's Python API and are unaffected; `renmori.rmc` is a static file, so Steam's file verification and delta updates work normally
- **`steam_appid.txt`** is read by the Steam SDK directly, outside `renpy.loader`, so RenMori keeps it as plaintext by default (`DEFAULT_KEEP_ON_DISK`); keeping it in the distribution build is harmless, and other externally read files can be added through `keep_on_disk` in `renmori.toml` (see [Configuration](../cli/configuration.md))

## Checklist

- [ ] Built from source in the Ren'Py launcher (Build Distributions)
- [ ] Ran `renmori protect` on the extracted build folder
- [ ] `renmori verify` passed
- [ ] SteamPipe `contentroot` points at the **protected folder**, not a `.zip`
- [ ] Launch options set per operating system (`the_question.exe` / `.sh` / `.app`)
- [ ] No Steam DRM wrapper applied
- [ ] Did **not** re-run the launcher on the protected folder
