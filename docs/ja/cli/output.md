---
title: 出力・ビルドマニフェスト・終了コード
description: renmori の stderr と stdout の出力規約、結果 JSON のフィールド、renmori-manifest.json の形式、および全終了コード
---

# 出力・ビルドマニフェスト・終了コード

`renmori` は開発者と自動化パイプラインの両方を対象としています。開発者は stderr 上のスタイル付きでローカライズされた進捗情報を読み、スクリプトや CI は stdout 上の結果 JSON と終了コードを解析します。両者は互いに独立しており、出力言語やカラーの設定は stdout の内容に影響しません。

## 出力チャネル

| チャネル | 内容 | `--lang`、`--no-color` の影響 | `--quiet` の影響 |
|---|---|---|---|
| stderr | バナー、設定に関する表示、概要パネル、確認プロンプト、ステップ行、結果パネル、リリースの案内、エラーメッセージ | あり | あり（`error: <message>` 形式のエラーメッセージのみ残る） |
| stdout | 最終行は常に 1 つの JSON オブジェクト | なし | なし |

JSON のキー名と値は常に英語で、どのロケール設定でも構造は同じです。解析時は stdout の最終行を読み取ってください。

## `protect` の結果 JSON

保護に成功した場合：

```json
{
  "status": "ok",
  "output": "/abs/path/MyGame-1.0-pc-protected",
  "manifest": {
    "file_count": 842,
    "container_sha256": "9f2c…",
    "strength": "baseline"
  },
  "backup": "/abs/path/MyGame-1.0-pc_bak"
}
```

実際の出力は 1 行の JSON であり、ここでは読みやすさのために整形しています。

| フィールド | 説明 |
|---|---|
| `status` | `"ok"` |
| `output` | 保護済みビルドの絶対パス |
| `manifest.file_count` | コンテナに格納されたファイル数 |
| `manifest.container_sha256` | コンテナファイルの SHA-256 |
| `manifest.strength` | 実際に使用された保護強度 |
| `backup` | インプレース保護時に作成されたバックアップディレクトリ。バックアップを作成した場合のみ出力 |

失敗した場合：

```json
{"status": "error", "message": "/abs/path/MyGame has no 'game/' directory"}
```

確認プロンプトでキャンセルした場合：

```json
{"status": "aborted"}
```

## `verify` の結果 JSON

| 結果 | JSON |
|---|---|
| 合格 | `{"status": "ok", "file_count": 842, "container_sha256": "…"}` |
| 検証の失敗 | `{"status": "error", "problems": ["container sha mismatch", …]}` |
| ビルドマニフェストがない | `{"status": "error", "message": "no renmori-manifest.json in …"}` |

## ビルドマニフェスト renmori-manifest.json

`protect` は保護済みビルドのルートディレクトリに `renmori-manifest.json` を書き込み、今回の保護の結果を記録します。このファイルは `verify` やリリース工程で使用されます。`game/` の外に置かれ、鍵は一切含みません。

### ベースライン保護

```json
{
  "renmori_version": "1.0.0",
  "container_format": 1,
  "strength": "baseline",
  "chunk_size": 65536,
  "lockdown": true,
  "container_sha256": "9f2c…",
  "container_bytes": 1073741824,
  "file_count": 842,
  "files": [
    {"name": "audio/theme.ogg", "size": 4194304},
    {"name": "images/bg room.png", "size": 812345}
  ]
}
```

| フィールド | 説明 |
|---|---|
| `renmori_version` | 保護を実行した `renmori` のバージョン |
| `container_format` | コンテナ形式のバージョン。ベースラインは `1`（形式の定義は[コンテナ形式](../technical/container-format.md)を参照） |
| `strength` | 保護強度 |
| `chunk_size` | チャンクサイズ（単位はバイト） |
| `lockdown` | ロックダウンが有効かどうか |
| `container_sha256` | コンテナファイルの SHA-256。`verify` はこれで変更を検出 |
| `container_bytes` | コンテナファイルのサイズ（単位はバイト） |
| `file_count` | コンテナに格納されたファイル数 |
| `files` | 名前順に並べたファイルのリスト。各項目はゲーム相対パス `name` と元のサイズ `size` を含む |

### フル保護

```json
{
  "renmori_version": "1.0.0",
  "container_format": "poly",
  "strength": "poly",
  "lockdown": true,
  "container": "renmori.rmc",
  "container_sha256": "9f2c…",
  "file_count": 842,
  "script_count": 120,
  "platforms": ["win-x64", "linux-x64"],
  "cores": [],
  "launcher": null
}
```

| フィールド | 説明 |
|---|---|
| `container_format` | `"poly"`。プラグインが生成するビルドごとのポリモーフィック形式を表す |
| `strength` | プラグインが報告した保護強度 |
| `container` | プラグインが報告したコンテナのファイル名 |
| `script_count` | 変換されたスクリプトの数 |
| `platforms` | プラグインが生成した対象プラットフォーム |
| `cores` | プラグインがビルドに書き込んだネイティブコア |
| `launcher` | ネイティブランチャーの情報。有効でない場合は空 |

フル保護のマニフェストにはファイルごとのリストは含まれません。`platforms`、`cores`、`launcher` の具体的な値はプラグインによって決まり、上記の例は構造を示すためのものです。

:::warning
ビルドマニフェストはビルドディレクトリ内に残ります。ベースラインのマニフェストの `files` にはすべてのアセットのパスとサイズが列挙されますが、内容や鍵は一切含まれません。配布用ビルドにこのファイルを含めたくない場合は、`verify` の完了後、アップロードの前に移動してください。ただし、その後再び検証するにはこのファイルが必要です。
:::

## 終了コード

| 終了コード | 名称 | 発生する状況 |
|---:|---|---|
| 0 | 成功 | 保護の完了、検証にすべて合格 |
| 2 | 使用方法または前提条件のエラー | 入力ディレクトリに `game/` がない、ビルドが保護済み、`-o` のディレクトリまたは `_bak` バックアップがすでに存在する、設定ファイルが存在しないか TOML の解析サポートがない、鍵の環境変数の形式が誤っている、フル保護に必要なプラグインが利用できない、指定した強度にプラグインが対応していない、アーカイブ可能なファイルがない、`.zip` 内にビルドが見つからないか複数ある・安全でないパスを含む・破損している、確認プロンプトでキャンセルした、`verify` がビルドマニフェストを見つけられない、コマンドライン引数の誤り（引数パーサーが報告し、この場合 JSON は出力されない） |
| 1 | 実行時の失敗 | アーカイブ化中のエラー（例：未対応の RPA 形式）、プラグインの実行失敗、`verify` が問題を検出 |

パイプラインはこれにより、「入力または設定の修正が必要」（2）と「ビルド自体に問題がある」（1）を区別できます。各エラーメッセージの対処方法は[トラブルシューティング](./troubleshooting.md)を参照してください。

## スクリプトでの解析

`jq` で結果を読み取る場合：

```bash
renmori protect ./build/MyGame-pc --no-backup --quiet -y | tail -n 1 > result.json
jq -r '.manifest.container_sha256' result.json
```

Python で読み取る場合：

```python
import json
import subprocess

proc = subprocess.run(
    ["renmori", "verify", "./out", "--quiet"],
    stdout=subprocess.PIPE, text=True,
)
result = json.loads(proc.stdout.strip().splitlines()[-1])
if proc.returncode != 0:
    raise SystemExit(result.get("problems") or result.get("message"))
```
