---
title: Steam へのリリース
description: 保護済みの Ren'Py 配布用ビルドを、ビルド、保護、SteamPipe でのアップロードの順に Steam へ公開する手順と、デポの構成、起動オプション、Steam との互換性に関する注意点を解説する
---

# Steam へのリリース

RenMori が保護するのは、**ビルド済みの** Ren'Py 配布用ビルドです。Steam への公開は順序の決まった 3 つの手順で行い、この順序が重要です。

```
Ren'Py launcher: Build Distributions   →   renmori protect   →   SteamPipe upload
   (from your project source)              (encrypt game/)        (upload the folder)
```

:::danger 順序を逆にしない
先に保護を行ってから、プロジェクトに対して Ren'Py ランチャーの Build Distributions を再実行すると、ランチャーはソースから再ビルドして新たに**保護されていない**配布用ビルドを生成し、保護は失われます。保護はランチャーの出力に対して行い、保護済みのフォルダを決してランチャーに戻さないでください。
:::

このガイドでは、Ren'Py SDK に付属するサンプルプロジェクト `the_question` とその **market** ビルドを例に使用します。このビルドには 3 つのプラットフォームがすべて含まれているためです。

## アップロードするビルドの選択

Ren'Py ランチャーは次のビルドを生成できます。

- **pc**：Windows と Linux
- **mac**：macOS
- **market**：Windows（`.exe`）、macOS（`.app`）、Linux（`.sh`）のランチャーが単一の `game/` を共有する 1 つのユニバーサルパッケージ

Steam ではどちらの方式も利用できます。

| 方式 | 作業内容 | トレードオフ |
|---------|-------------|-----------|
| **Market（簡易）** | 1 つの market フォルダを保護し、すべての OS にマウントされる **1 つのデポ**に配置して、OS ごとに起動オプションを設定 | すべてのプレイヤーが 3 プラットフォーム分のファイルをダウンロードする |
| **プラットフォーム別（軽量）** | **pc** と **mac** を個別にビルドし、それぞれに `renmori protect` を実行して、それぞれを**専用のデポ**（Windows / macOS / Linux）にアップロード | 手順は増えるが、各プレイヤーは自分のプラットフォームのファイルのみをダウンロードする |

RenMori の保護はプラットフォームに依存しません。`renmori.rpe` ローダーは、各 OS 上で Ren'Py に同梱された Python の中で動作します。そのため、**market ビルドに対して `protect` を 1 回実行するだけで、Windows、macOS、Linux をまとめてカバーできます**。

## 手順 1：保護

ランチャーが生成した market アーカイブをフォルダに展開し（RenMori が受け付けるのはディレクトリであり、`.zip` ではありません）、次のコマンドを実行します。

```bash
renmori protect ./the_question-7.0-market -o ./the_question-7.0-market-protected
renmori verify  ./the_question-7.0-market-protected
```

`game/` が変更されます。ネイティブランチャー（デフォルト）を使う場合は、各プラットフォームのエントリポイントもランチャーに置き換えられ、元のエンジンは `.renmori_real` という名前で横に残ります。`--no-launcher` の場合に変更されるのは `game/` のみです。

```
the_question-7.0-market-protected/
├─ game/
│   ├─ renmori.rmc        # all assets, encrypted
│   ├─ renmori.rpe        # runtime loader (Ren'Py loads it automatically)
│   ├─ renmori_core-*     # native runtime, one per platform
│   └─ steam_appid.txt    # kept as plaintext (the Steam SDK reads it directly)
├─ lib/
│   └─ py3-linux-x86_64/
│       ├─ the_question               # native launcher (Linux entry point)
│       └─ the_question.renmori_real  # original engine
├─ renpy/                 # untouched
├─ the_question.app/      # Contents/MacOS/the_question is the native launcher
├─ the_question.exe       # native launcher (Windows entry point)
├─ the_question.renmori_real.exe  # original engine
├─ the_question.py
├─ the_question.sh        # untouched — Linux entry script
└─ renmori-manifest.json
```

`game/` 以下にあった平文の `.rpa` アーカイブと `.rpyc` ファイルはなくなり、`unrpa` や `unrpyc` が処理できる対象は残りません。

## 手順 2：SteamPipe でのアップロード

Steam は単一のファイルを受け付け**ません**。ビルドとは**フォルダの中身全体**であり、SteamPipe でデポにアップロードします。したがって、次の点に注意してください。

- `.zip` をアップロード**しない**
- `renmori.rmc` だけをアップロード**しない**
- デポの `contentroot` を**保護済みのフォルダ**に向け、その中身（`game/`、`lib/`、`renpy/`、各ランチャー）をすべて SteamPipe にアップロードさせる

`app_build_<APPID>.vdf`：

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

Steamworks の SteamPipe GUI でも同じ操作を行えます。その場合も保護済みのフォルダを指定してください。

**プラットフォーム別のデポ**を使用する場合は、各プラットフォームのビルドを個別に保護し、それぞれに専用のデポと専用の `contentroot` を割り当てます。

## 手順 3：起動オプション

Steamworks の Web 管理画面（Installation → General Installation → Launch Options）で、OS ごとに 1 つずつ起動オプションを設定し、それぞれビルド内の対応するランチャーを指定します。

| OS | 実行ファイル |
|------------------|------------|
| Windows | `the_question.exe` |
| Linux | `the_question.sh` |
| macOS | `the_question.app` |

エントリポイント（`--no-launcher` でビルドした場合を除き、ネイティブランチャー）が Ren'Py を起動すると、`renmori.rpe` がアセットの読み込みを引き継ぎ、メモリ上でアセットを復号します。どちらの場合も起動オプションは同じで、この処理はプレイヤーからは意識されません。

## Steam との互換性に関する注意点

- **Steam DRM を重ねて適用しない**（DRMToolkit による実行ファイルのラッパー）：ランチャーのバイナリを書き換えるため実行時の自己検査と衝突するおそれがあり、それ自体の保護も弱い一方で、RenMori はすでにデータ層を保護している
- **Steam オーバーレイは通常どおり動作する**：ランチャーを使わない場合（`--no-launcher`）、RenMori は Ren'Py のファイル読み込みのみをフックし、プロセスへの注入や DLL インジェクションを一切行わないため、オーバーレイには影響しない。ネイティブランチャー（デフォルト）を使う場合は後述のネイティブランチャーの節を参照
- **実績と Steam クラウドのセーブデータ**は Ren'Py の Python API を経由するため影響を受けない。`renmori.rmc` は静的なファイルであるため、Steam のファイル検証と差分アップデートも通常どおり機能する
- **`steam_appid.txt`** は Steam SDK が `renpy.loader` を経由せずに直接読み込むため、RenMori はデフォルトでこのファイルを平文のまま残す（`DEFAULT_KEEP_ON_DISK`）。配布用ビルドに残しても問題はなく、外部から読み込まれるその他のファイルは `renmori.toml` の `keep_on_disk` で追加できる（[設定ファイル](../cli/configuration.md)を参照）

## ネイティブランチャーと Steam

1.2.6 以降、プラグインを使う場合はネイティブランチャーがデフォルトで有効になり、`--no-launcher` で無効にできます。ランチャーは各プラットフォームのエントリポイント（Windows では `the_question.exe`、Linux では `the_question.sh` が起動するエンジンスタブ `lib/py3-linux-x86_64/the_question`、macOS では `the_question.app` 内の実行ファイル）として組み込まれるため、起動オプションは変わりません。ランチャーは起動時の認証を行ってから本来のエンジンを起動し、この手順により Steam オーバーレイと Steamworks SDK が前提とするプロセスモデルが変わるため、Steam との互換性は OS ごとに記録しています：

| OS | エンジンの起動方法 | 状況 |
|---|---|---|
| macOS | `execv`（同じ PID、環境変数を継承） | 検証済み：オーバーレイは本来のエンジンに再びアタッチされ、`SteamAPI_Init` はアプリのコンテキストを保持する |
| Windows | `_spawnv`（エンジンは子プロセスとして動作） | 未テスト：子プロセスのモデルはオーバーレイの注入に最も影響しやすい |
| Linux | `execv`（macOS と同じ） | 未テスト：macOS と同様に動作する見込み |

リリース前に Windows でオーバーレイと実績を確認し、正常に動作しない場合は Windows 向けの depot を `--no-launcher` でビルドしてください。

ランチャーは `game/` 以下に単体の Ren'Py スクリプトや拡張を見つけると起動を拒否します。そのため、プレイヤーが `.rpy` ファイルとして `game/` に置いた MOD やパッチがあるとランチャー付きのビルドは起動しません。こうした内容はビルドに含めて配布してください。1.2.0 以前にランチャー付きで保護したビルドにはこの検査がないため、1.2.5 以降で保護し直してください。

## チェックリスト

- [ ] Ren'Py ランチャーでソースからビルドした（Build Distributions）
- [ ] 展開したビルドフォルダに対して `renmori protect` を実行した
- [ ] `renmori verify` が成功した
- [ ] SteamPipe の `contentroot` が `.zip` ではなく**保護済みのフォルダ**を指している
- [ ] OS ごとに起動オプションを設定した（`the_question.exe` / `.sh` / `.app`）
- [ ] Steam DRM のラッパーを適用していない
- [ ] 保護済みのフォルダに対してランチャーを再実行**していない**
- [ ] ネイティブランチャー（デフォルト）を使う場合：Windows で Steam オーバーレイと実績を確認した（いずれも未検証）
- [ ] 1.2.6 以降で保護した
