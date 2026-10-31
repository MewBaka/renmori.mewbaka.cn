---
title: Performance Benchmark
description: Asset read throughput, latency, script loading, build time and size overhead of unprotected, baseline-protected and fully protected builds, measured inside a real Ren'Py engine
---

# Performance Benchmark

This page records the performance benchmark results for RenMori 1.1.0: the tests run inside a real Ren'Py 8.5.2 engine, build the same asset set as unprotected, baseline-protected and fully protected distribution builds, and time every asset read through the engine's own loading path, `renpy.loader.load`, so the figures reflect the shipped runtime rather than a standalone crypto library.

The benchmark script is [`tools/benchmark.py`](https://github.com/MewBaka/RenMori/blob/main/tools/benchmark.py) in the repository, and the raw results behind this page are in [`docs/benchmarks/2026-10-31-apple-m1.json`](https://github.com/MewBaka/RenMori/blob/main/docs/benchmarks/2026-10-31-apple-m1.json).

## Summary

- With full protection, in-engine decryption throughput is 567 to 1529 MB/s depending on file size
- Reading a 2 MB CG takes about 0.95 ms longer with full protection than without; for reference, one frame at 60 FPS lasts 16.7 ms
- A random seek plus a 64 KB read in a video takes 0.086 ms (median) with full protection
- A `lint` run, which loads and parses every script, goes from 0.52 s to 0.67 s
- The `game/` directory of a protected build grows by only 0.18%
- Protecting 319 MB of assets at build time takes about 13 s with full protection

## Test environment

| Item | Value |
|---|---|
| Date | 2026-10-31 |
| Device | Apple M1, 8 GB memory |
| Operating system | macOS 26.5.1 (arm64) |
| Ren'Py | 8.5.2.26010301 |
| RenMori | 1.1.0, closed plugin plugin-v1.1.0 |
| Build tool Python | 3.12.12 |

## Method

### Workload

The Ren'Py SDK sample project `the_question` is extended with a synthetic asset set sized like a commercial visual novel, 812 files in all, bringing `game/` to 319.3 MB including the sample's own files; the synthetic assets are random bytes, as incompressible as encoded images, audio and video.

| Category | Extension | File size | Files | Total |
|---|---|---:|---:|---:|
| CG | `.png` | 2 MB | 40 | 80.0 MB |
| Sprites | `.png` | 600 KB | 60 | 35.2 MB |
| UI assets | `.png` | 24 KB | 400 | 9.4 MB |
| BGM | `.ogg` | 4 MB | 10 | 40.0 MB |
| Voice | `.opus` | 60 KB | 300 | 17.6 MB |
| Video | `.webm` | 64 MB | 2 | 128.0 MB |

### Measurements

| Measurement | Method |
|---|---|
| In-engine read throughput | A benchmark extension injected into each build reads every file through `renpy.loader.load` in 1 MB blocks during engine startup; each category gets one warm-up pass, then 5 timed passes, and the median is reported |
| Video streaming latency | On a 64 MB video, "open and read the first 64 KB" and "random seek then read 64 KB" are each sampled 200 times, and the median is reported |
| Script loading | A full `renpy.sh <game> lint` runs 3 times per build and the median is reported; `lint` loads and parses every script from the container |
| Build time | `renmori protect` runs 3 times on the same input and the median is reported |
| Size overhead | The difference in `game/` size between the protected and unprotected builds, covering the container, the loader extension and the script transform |
| Chunk size | In the build tool's Python, the reference reader measures sequential throughput and random 4 KB read latency on 64 MB of data for 4 chunk sizes |

MB on this page means 2<sup>20</sup> bytes.

## Results

### In-engine read throughput

In MB/s; higher is better.

| Category | File size | Unprotected | Full protection | Baseline protection |
|---|---:|---:|---:|---:|
| CG | 2 MB | 5590 | 1529 | 108 |
| Sprites | 600 KB | 5585 | 1463 | 120 |
| UI assets | 24 KB | 729 | 567 | 100 |
| BGM | 4 MB | 4608 | 1048 | 115 |
| Voice | 60 KB | 1197 | 749 | 97 |
| Video | 64 MB | 3822 | 1287 | 112 |

### Per-file read time

In ms, the time to read one whole file.

| Category | File size | Unprotected | Full protection | Added time |
|---|---:|---:|---:|---:|
| CG | 2 MB | 0.36 | 1.31 | +0.95 |
| Sprites | 600 KB | 0.11 | 0.40 | +0.30 |
| UI assets | 24 KB | 0.032 | 0.041 | +0.009 |
| BGM | 4 MB | 0.87 | 3.82 | +2.95 |
| Voice | 60 KB | 0.049 | 0.078 | +0.029 |

Video is streamed by the engine rather than read as a whole file, so the latency figures in the next section apply to it.

### Video streaming latency

In ms, median.

| Measurement | Unprotected | Full protection | Baseline protection |
|---|---:|---:|---:|
| Open and read the first 64 KB | 0.051 | 0.082 | 0.596 |
| Random seek then read 64 KB | 0.035 | 0.086 | 1.113 |

### Script loading

| Build | `lint` time |
|---|---:|
| Unprotected | 0.52 s |
| Full protection | 0.67 s |
| Baseline protection | 0.58 s |

`the_question` contains 52 compiled scripts, and the three builds differ by no more than 0.15 s.

### Build time and size overhead

| Strength | Time | Rate | `game/` size change |
|---|---:|---:|---:|
| Baseline protection | 2.52 s | 126.8 MB/s | +0.147% |
| Full protection | 13.41 s | 23.8 MB/s | +0.177% |

Build time is spent only on the developer's machine or in CI and never affects players; full protection is performed by the closed plugin and includes extra work such as per-build structural polymorphism, so it takes longer than baseline protection.

### Chunk size

These figures come from the build tool's Python with the `cryptography` backend and serve to compare `chunk_size` trade-offs; they do not represent absolute in-engine performance.

| Chunk size | Sequential throughput | Random 4 KB read (median) | Random 4 KB read (p95) | Size overhead |
|---:|---:|---:|---:|---:|
| 16 KB | 1273 MB/s | 0.011 ms | 0.022 ms | 0.098% |
| 64 KB (default) | 2008 MB/s | 0.024 ms | 0.050 ms | 0.025% |
| 256 KB | 2339 MB/s | 0.077 ms | 0.124 ms | 0.006% |
| 1 MB | 1461 MB/s | 0.286 ms | 0.482 ms | 0.002% |

Larger chunks raise sequential throughput and lower size overhead but make each random read decrypt more data; the default of 64 KB balances the two and rarely needs changing.

## Interpreting the results

Full protection uses the native runtime provided by the closed plugin and is the default for distribution builds; baseline protection uses the reference reader written in Python, with roughly 1/14 to 1/6 of the throughput of full protection, and suits only situations where the plugin cannot be used (see [Protection Strength and the Closed Plugin](../cli/plugin.md)).

The unprotected figures above approach memory-copy speed because the assets were already in the operating system's page cache during the test; this setup removes disk performance from the comparison so the results reflect only the CPU cost of decryption, and on a player's machine the first read is usually bound by disk speed, which narrows the relative gap between protected and unprotected builds.

## Limitations

- Frame time during real play is not measured; this page covers asset reading and decryption only, not image decoding, audio decoding or rendering
- The synthetic assets are random bytes that the engine reads but does not decode
- The tests run with a warm page cache and exclude cold-start disk I/O
- Only one Apple M1 device was tested; figures for Windows, Linux and Steam Deck have not been measured yet

## Reproducing

This needs the Ren'Py SDK and the RenMori source repository; full protection needs the closed plugin, which is downloaded automatically on the first run.

```bash
git clone https://github.com/MewBaka/RenMori.git
cd RenMori && pip install -e .
python tools/benchmark.py --sdk /path/to/renpy-8.5.2-sdk \
    --game /path/to/renpy-8.5.2-sdk/the_question --json result.json
```

| Option | Default | Notes |
|---|---|---|
| `--scale` | 1.0 | Workload size multiplier; 1.0 is about 310 MB of synthetic assets |
| `--passes` | 5 | Timed passes per category in the engine |
| `--repeat` | 3 | Repetitions of `protect` and `lint` |
| `--strength` | `both` | Which protected builds to produce: `both`, `baseline` or `full` |
| `--json` | none | Writes the raw and summarized results to the given file |
| `--keep` | off | Keeps the work directory for inspecting the generated builds |

Absolute figures vary between devices, so compare the relative results of the three builds on the same device.
