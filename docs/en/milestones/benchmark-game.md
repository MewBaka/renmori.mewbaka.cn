---
title: Real-game Benchmark
description: Sequential reads, random reads and cold-start latency of a real GalGame distribution build, original versus RenMori full protection, measured on the same device
---

# Real-game Benchmark

This page records RenMori 1.2.0 measured on the distribution build of a real GalGame: the original build and its RenMori fully protected counterpart are compared on the same device for sequential read throughput, random read latency and cold-start latency, and the protected build is started through the native launcher, exactly as players run it.

Unlike the synthetic assets in the [Performance Benchmark](./benchmark.md), the sample here is the distribution build of a real title, about 3.5 GB of assets including CGs, sprites, UI assets, BGM, voice and video; the title's name is not disclosed on this page.

## Summary

For players, the encryption is practically imperceptible.

- Random reads gain at most about 0.15 ms, less than 1% of a frame at 60 FPS (16.7 ms)
- With a cold cache, sequential throughput across all assets is 584 MB/s, more than a hundred times the bandwidth that real-time audio and video decoding needs
- An image of average size (about 1.9 MB) takes about 1.8 ms longer to read with a cold cache, and Ren'Py usually preloads images in the background
- Cold start to the first frame goes from 7.16 s to 8.44 s; the extra 1.3 s happens once at launch and never during play
- The protected `game/` directory grows by only 0.09%, including the native runtimes for three platforms

## Environment

| Item | Value |
|---|---|
| Date | 2026-10-31 |
| Device | Apple M1, 8 GB memory, internal SSD |
| Operating system | macOS 26.5.1 (arm64) |
| Ren'Py | 8.5.2.26010301 |
| RenMori | 1.2.0, full protection (poly), lockdown enabled, started through the native launcher |

## Sample

The original is the title's distribution build, whose `game/` directory totals 3.51 GiB, with assets in a 2.05 GiB RPA archive and two standalone video files; the protected build was produced from the same build with `renmori protect`, and all of its assets live in the encrypted container `renmori.rmc`.

The tests compare only the entries that exist in both builds with identical sizes, 1407 entries totalling 3593 MB; 22 compiled scripts (`.rpyc` and `.rpymc`) are transformed by the script layer in the protected build, differ in size, and are excluded from the read tests.

| Category | Files | Total |
|---|---:|---:|
| Images | 774 | 1477 MB |
| Audio | 599 | 540 MB |
| Video | 2 | 1497 MB |
| Scripts | 21 | 0.3 MB |
| Other | 11 | 79 MB |
| All | 1407 | 3593 MB |

MB on this page means 2<sup>20</sup> bytes.

## Method

Every measurement runs inside the engine process and reads through the engine's own loading path, `renpy.loader.load`, so the protected figures include all decryption, authentication and container index lookups; both builds are started by running the executable inside the `.app` directly, so the protected build goes through the launcher's start-up sequence.

### Cold and warm cache

Before every cold-cache measurement, a fresh copy of the build is made with an APFS clone (`cp -c`); the clone shares its data on disk with the original but is a new file to the operating system, so none of its content is in the page cache and the first read of every file must go to disk. A preliminary check showed a median random 4 KB read latency of 104 µs on the first pass over a fresh clone and 1.4 µs on the second, confirming that the first pass is cold.

Warm-cache measurements repeat the reads on the same clone, with the data already in the page cache, so they reflect CPU cost only.

### Measurements

| Item | Method |
|---|---|
| Sequential reads | Read all 1407 entries completely in 1 MB blocks; pass 1 is cold, passes 2 to 4 are warm and their median is used; run 3 times, each on a fresh clone |
| Random 4 KB / 64 KB | Pick a random file among the 64 largest (each at least 4 MB, 2214 MB in total) and a random offset, seek and read 4 KB or 64 KB; 2000 samples each |
| Random small-file opens | Pick a random file among the 822 files no larger than 256 KB, open it and read it completely; 1000 samples |
| Cold start | From running the executable until the engine draws its first frame; each cold start uses a fresh clone, 5 runs; warm starts are measured 5 times on one clone after 1 priming run |

The cold and warm random-read passes use the same random sequence, and the median and p95 are computed over all samples from the 3 runs.

## Results

### Sequential reads

MB/s, higher is better.

| Category | Original (cold) | Protected (cold) | Original (warm) | Protected (warm) |
|---|---:|---:|---:|---:|
| Images | 1154 | 555 | 1302 | 480 |
| Audio | 1132 | 430 | 1022 | 480 |
| Video | 1895 | 658 | 2281 | 557 |
| Scripts | 118 | 85 | 96 | 75 |
| Other | 1644 | 568 | 1621 | 458 |
| All | 1303 | 584 | 1547 | 419 |

The protected build reaches about 45% of the original's throughput with a cold cache and about 27% with a warm cache; with a warm cache there is no disk wait left, so the protected build's 420 to 560 MB/s is the current ceiling of decryption itself.

At the cold-cache throughput, an image of average size (about 1.9 MB) takes about 1.6 ms to read from the original and about 3.4 ms from the protected build; video and BGM are streamed by the engine at bitrates of typically a few MB/s, more than two orders of magnitude below 584 MB/s.

### Random reads

ms, lower is better.

| Test | Cache | Original median | Protected median | Original p95 | Protected p95 |
|---|---|---:|---:|---:|---:|
| Random 4 KB | Cold | 0.216 | 0.181 | 0.443 | 0.399 |
| Random 4 KB | Warm | 0.200 | 0.187 | 0.479 | 0.456 |
| Random 64 KB | Cold | 0.252 | 0.403 | 0.452 | 0.760 |
| Random 64 KB | Warm | 0.249 | 0.348 | 0.397 | 0.699 |
| Random small-file open | Cold | 0.196 | 0.265 | 0.937 | 0.988 |
| Random small-file open | Warm | 0.100 | 0.143 | 0.438 | 0.675 |

Random 4 KB reads are on par, within measurement error; random 64 KB reads gain 0.10 to 0.15 ms at the median because a 64 KB read usually spans two chunks, both of which must be decrypted and authenticated; random small-file opens gain 0.04 to 0.07 ms at the median, from the container index lookup and per-file key derivation.

### Cold start

Seconds from running the executable, median, with minimum and maximum in parentheses.

| Stage | Cache | Original | Protected | Difference |
|---|---|---:|---:|---:|
| Asset index ready | Cold | 3.13 (2.46–3.82) | 3.18 (2.80–3.74) | +0.05 |
| First frame drawn | Cold | 7.16 (6.01–7.70) | 8.44 (7.99–9.04) | +1.28 |
| Asset index ready | Warm | 0.97 (0.72–1.07) | 0.76 (0.65–1.33) | −0.21 |
| First frame drawn | Warm | 5.05 (3.82–6.50) | 5.83 (4.61–6.54) | +0.78 |

The launcher's start-up sequence and building the container index add almost nothing: with a cold cache the asset index is ready only 0.05 s later; warm starts vary widely from run to run, so the cold-start figures are the reference for the difference.

The extra time is concentrated in script loading: to leave no plaintext on disk, the protected build does not write Ren'Py's runtime caches such as bytecode and screen analysis, so the Python code in the scripts is recompiled on every start; in the Ren'Py log of a single run, the "Loading script" stage took 169 ms in the original and 1967 ms in the protected build.

### Size overhead

| Build | `game/` size |
|---|---:|
| Original | 3,768,321,012 bytes |
| Protected | 3,771,724,069 bytes |
| Difference | +0.09% |

The protected size includes the encrypted container, the runtime loader and the native runtimes for Windows, Linux and macOS; the encrypted container alone adds 0.08% over the original assets.

## Interpretation

The performance problems players notice are stutter and waiting: stutter depends on whether a single read completes within a frame, waiting on whether large assets are ready in time. Random reads gain at most about 0.15 ms, less than 1% of a frame; sequential throughput, even with a cold cache, is far above what streaming audio and video needs; during play the encryption introduces no noticeable stutter or waiting.

The only noticeable difference is about 1 s more at launch, which comes from the security trade-off of not writing plaintext caches and happens once per start.

## Limitations

- Frame time during actual play was not measured; this page covers asset reads only, not image decoding, audio decoding or rendering
- Tested on a single Apple M1 device; Windows, Linux and Steam Deck have not been measured
- The test device uses an internal SSD; on a hard disk, cold reads are more disk-bound and the relative gap between the protected and original builds usually narrows
- Warm-start figures vary widely and are for reference only
- The sample title and the measurement code are not public, so these figures cannot be reproduced directly by third parties; for a reproducible synthetic benchmark see the [Performance Benchmark](./benchmark.md)
