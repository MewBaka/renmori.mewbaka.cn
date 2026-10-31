---
title: "renmori verify：保護済みビルドの検証"
description: "ビルドマニフェストに基づき、暗号化した Ren'Py ビルドの完全性と平文ファイルの残存を検証する。リリース前のチェックや CI のゲートとして利用できる"
---

# renmori verify

`renmori verify` は、保護済みビルド自身の `renmori-manifest.json` に基づき、保護の完了後にビルドが変更されていないか、実行に必要なファイルが欠けていないか、そしてディスク上に直接抽出可能な平文のスクリプトやアーカイブが残っていないかを確認します。ファイルの読み取りのみを行い、内容は一切変更しないため、リリース前に手動で実行することも、CI パイプラインのゲートとして使用することもできます。

## 構文

```bash
renmori verify <protected-dir> [--lang {auto,en,zh}] [--no-color] [--quiet]
```

| 引数 | 説明 |
|---|---|
| `protected-dir` | `renmori protect` が生成した保護済みビルドのルートディレクトリ、すなわち `renmori-manifest.json` と `game/` を含むディレクトリ |

## 検証項目

| 検証内容 | 失敗時に報告される問題 |
|---|---|
| ビルドルートに `renmori-manifest.json` が存在する | `no renmori-manifest.json in <dir>`（終了コード 2 で直ちに終了） |
| `game/renmori.rmc` が存在する | `missing renmori.rmc` |
| `game/renmori.rpe` が存在する | `missing renmori.rpe` |
| コンテナファイルの SHA-256 がマニフェストの `container_sha256` と一致する | `container sha mismatch` |
| `game/` とそのすべてのサブディレクトリに `.rpa`、`.rpyc`、`.rpy`、`.rpyb`、`.rpymc` ファイルが存在しない | `plaintext left: <path>`（最初に見つかった 1 件のみを報告） |

ビルドマニフェストがない場合に直ちに終了する点を除き、その他の検証結果はまとめて報告されます。いずれかの検証が失敗すると、コマンドはすべての問題を列挙して終了コード 1 で終了します。

コンテナのハッシュ検証では、保護後にコンテナが差し替えられた場合、切り詰められた場合や転送中に破損した場合、およびビルドマニフェストが別の保護処理によるものである場合を検出できます。平文の残存検証は `cache/` ディレクトリも対象とします。このディレクトリ内の `.rpyb` ファイルにはスクリプトのコンパイル済みバイトコードが含まれているためです。

## 検証の対象外

`verify` は静的なファイル検査であり、以下は対象外です。

- ゲームを実行せず、コンテナも復号しないため、すべてのアセットをエンジンが正しく読み込めるかは確認できない。エンドツーエンドの検証には、実際の Ren'Py SDK で保護済みビルドを読み込むリポジトリの [`tools/verify_in_renpy.py`](https://github.com/MewBaka/RenMori/blob/main/tools/verify_in_renpy.py) を使用できる
- `game/` 以外のファイル（各プラットフォームのランチャーや `lib/` 内のランタイムなど）は検査しない
- `exclude` または `keep_on_disk` によってディスク上に保持されたスクリプト以外のファイルは検査しない（これらのファイルは設計上、平文で存在する）
- ビルドに使用された保護強度がリリース要件を満たしているかは判断しない。保護強度はマニフェストの `strength` フィールドに記録されており、パイプラインで別途確認できる

## 出力

進捗情報は stderr に、最終行の JSON は stdout に出力されます。

検証に合格した場合：

```json
{"status": "ok", "file_count": 842, "container_sha256": "9f2c…"}
```

検証に失敗した場合：

```json
{"status": "error", "problems": ["container sha mismatch", "plaintext left: game/script.rpyc"]}
```

ビルドマニフェストがない場合：

```json
{"status": "error", "message": "no renmori-manifest.json in /path/to/build"}
```

各フィールドの意味と終了コードは[出力・ビルドマニフェスト・終了コード](./output.md)を参照してください。

## 終了コード

| 終了コード | 意味 |
|---:|---|
| 0 | すべての検証に合格 |
| 1 | 少なくとも 1 つの検証が失敗 |
| 2 | ディレクトリに `renmori-manifest.json` が存在しない |

## 例

リリース前に手動で検証する場合：

```bash
renmori verify ./dist/MyGame-1.0-pc-protected
```

CI のゲートとして使用し、JSON のみを出力する場合：

```bash
renmori verify ./build/MyGame-pc-protected --quiet
```

シェルスクリプトで結果に応じてアップロードを続行するか判断する場合：

```bash
if renmori verify ./out --quiet > verify.json; then
  echo "verified"
else
  cat verify.json
  exit 1
fi
```

:::tip
`protect` と `verify` の間でビルドに変更を加えてはいけません。内容を調整する必要がある場合は、保護済みディレクトリを変更するのではなく、新しい配布用ビルドまたはバックアップから `protect` をやり直してください。
:::
