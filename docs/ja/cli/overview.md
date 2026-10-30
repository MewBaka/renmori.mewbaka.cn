---
title: CLI の概要
description: renmori コマンドラインツールの位置付け、インストール方法、コマンド構成、共通オプションと環境変数
---

# CLI の概要

`renmori` は RenMori のコマンドラインツールで、Ren'Py ランチャーが生成した配布用ビルドを対象に、ビルド時にアセットのアーカイブ化、スクリプトの変換、ローダーの書き込みと結果の検証を行います。ゲームのソースプロジェクトの読み取りや変更は行わず、Ren'Py SDK にも依存しません。クローズドプラグインの初回ダウンロードを除き、ネットワークにはアクセスしません。

典型的なリリース手順で使用するコマンドは次の 2 つのみです。

```bash
renmori protect ./dist/MyGame-1.0-pc -o ./dist/MyGame-1.0-pc-protected
renmori verify  ./dist/MyGame-1.0-pc-protected
```

## ツールの担当範囲

| 工程 | 担当 | 説明 |
|---|---|---|
| シナリオとリソースの制作 | 開発者、Ren'Py SDK | RenMori は関与しない |
| 配布用ビルドの生成 | Ren'Py ランチャーの *Build Distributions* | RenMori の入力 |
| アーカイブ化、暗号化、スクリプト変換、ローダーの書き込み | `renmori protect` | 保護済みの配布用ビルドを出力 |
| 保護済みビルドの検証 | `renmori verify` | CI のゲートとして利用可能 |
| ランタイムでの復号 | ゲームと共に配布されるローダー拡張とネイティブコア | プレイヤーのマシン上、エンジン内部で実行 |
| アップロードと配布 | 開発者、SteamPipe、itch.io など | [Steam へのリリース](../integration/steam-release.md)を参照 |

## インストール

`renmori` は PyPI パッケージ `renmori` として公開されており、Python 3.9 以降が必要です。依存パッケージ `cryptography` はインストール時に自動で取得されます。この依存はビルド時のツールでのみ使用され、保護済みのゲームは実行時にいかなる pip パッケージにも依存しません。

```bash
pip install renmori
renmori --version
```

独立したコマンドラインツールとしてインストールする場合は、uv または pipx も利用できます。いずれも `renmori` 用の隔離環境を作成します。

```bash
uv tool install renmori
pipx install renmori
```

設定ファイル `renmori.toml` の読み込みには、Python 3.11 以降の標準ライブラリ `tomllib` が必要です。3.9 または 3.10 で設定ファイルを使用する場合は、`tomli` を追加でインストールしてください。

```bash
pip install tomli
```

ソースの変更や開発への参加を行う場合は、リポジトリから編集可能モードでインストールできます。

```bash
git clone https://github.com/MewBaka/RenMori.git
cd RenMori
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
```

## 呼び出し方法

インストール後は、次の 2 つの等価な方法で呼び出せます。

```bash
renmori <command> [options]
python -m renmori <command> [options]
```

システムに複数の Python 環境があり、`renmori` が `PATH` に含まれていない場合は、2 つ目の方法で使用するインタープリタを明示的に指定できます。

## コマンド一覧

| コマンド | 機能 | 参照 |
|---|---|---|
| `renmori protect <ビルドディレクトリ \| ビルド.zip>` | 配布用ビルドを保護：すべてのアセットをアーカイブ化して暗号化し、コンパイル済みスクリプトを変換、平文の元ファイルを削除し、ローダー拡張とビルドマニフェストを書き込む | [protect](./protect.md) |
| `renmori verify <保護済みディレクトリ>` | ビルドマニフェストに基づき保護済みビルドを再検証：コンテナのハッシュ、必須ファイル、平文の残存 | [verify](./verify.md) |
| `renmori --version` | ツール名とバージョン番号を表示して終了 | — |
| `renmori -h`、`renmori <command> -h` | ヘルプを表示して終了 | — |

## 共通オプション

以下のオプションは `protect` と `verify` の両方で有効で、`renmori protect ./build --quiet` のようにサブコマンドの後に記述する必要があります。

| オプション | デフォルト値 | 機能 |
|---|---|---|
| `--lang {auto,en,zh}` | `auto` | ユーザー向け出力の言語を設定。`auto` では `RENMORI_LANG`、`LC_ALL`、`LC_MESSAGES`、`LANG`、`LANGUAGE` とシステムのロケール設定を順に読み取り、`zh` で始まる場合は中国語、それ以外は英語を使用し、Windows ではシステムの表示言語も読み取る |
| `--no-color` | 無効 | ANSI カラーを無効化。stderr が端末でない場合、または環境変数 `NO_COLOR` が設定されている場合は自動で無効化 |
| `--quiet` | 無効 | スタイル付きの進捗情報を出力せず、stdout に最終行の JSON のみを出力し、エラーは `error: <message>` 形式のプレーンテキストで stderr に出力。非対話モードとしても扱われ、すべての確認プロンプトをスキップ |

:::tip
CLI の出力言語は現在、中国語と英語に対応しています。出力言語は stderr 上の進捗情報にのみ影響し、stdout 上の JSON のキー名と値は常に英語であるため、どのロケール設定でも解析結果は一貫します。詳細は[出力・ビルドマニフェスト・終了コード](./output.md)を参照してください。
:::

## 環境変数

| 環境変数 | 対象コマンド | 機能 |
|---|---|---|
| `RENMORI_LANG` | すべて | 出力言語を固定。値は `en` または `zh` で、ロケール関連の変数より優先 |
| `NO_COLOR` | すべて | 設定すると ANSI カラーを無効化 |
| `RENMORI_PLUGIN` | `protect` | クローズドプラグインの実行ファイルのパス。`--plugin` と同等で、設定すると自動ダウンロードを行わない |
| `RENMORI_NO_DOWNLOAD` | `protect` | 空でない任意の値を設定するとプラグインを自動ダウンロードしない。プラグインがない場合、フル保護は直ちに失敗し、`--strength auto` はベースラインにフォールバック |
| `RENMORI_PLUGIN_BASE_URL` | `protect` | プラグインと `SHA256SUMS` をこのアドレスから取得。社内ミラー向け |
| `RENMORI_PLUGIN_TAG` | `protect` | プラグインを取得する Release タグを指定し、ローカルキャッシュのディレクトリも決定 |
| `XDG_CACHE_HOME`、`LOCALAPPDATA` | `protect` | プラグインキャッシュのルートディレクトリを決定。[保護強度とクローズドプラグイン](./plugin.md)を参照 |
| 設定ファイルの `[keys]` で指定した変数 | `protect` | ベースライン保護のコンテナ鍵とスクリプト鍵の取得元。[設定ファイル](./configuration.md)を参照 |

## 処理の流れ

```
Ren'Py ランチャー Build Distributions
        │  配布用ビルドのディレクトリ、または *-pc.zip などの配布アーカイブ
        ▼
renmori protect
  1. 入力の解析（ディレクトリ、または .zip を展開して game/ を含むビルドルートを特定）
  2. 設定のマージ（コマンドライン > renmori.toml > デフォルト値）
  3. 保護強度の決定、必要に応じてクローズドプラグインを取得・検証
  4. 事前チェック：出力先またはバックアップディレクトリの衝突、アーカイブ対象のファイル数
  5. 概要の表示と確認（対話型端末のみ）
  6. コピーまたはバックアップ → アーカイブ化・暗号化 → スクリプト変換 → 平文の削除 → ローダー拡張の書き込み → ビルドマニフェストの書き込み
        │  保護済みの配布用ビルド
        ▼
renmori verify  →  検証に合格したらアップロードまたはパッケージ化して配布
```

## 関連ページ

- [`renmori protect`](./protect.md)：全オプション、ファイル処理ルールと実行手順
- [`renmori verify`](./verify.md)：検証項目と使い方
- [設定ファイル renmori.toml](./configuration.md)：全設定キーとマージルール
- [出力・ビルドマニフェスト・終了コード](./output.md)：スクリプトや CI で解析するための出力形式
- [保護強度とクローズドプラグイン](./plugin.md)：ベースライン保護とフル保護の違い、プラグインの取得とキャッシュ
- [トラブルシューティング](./troubleshooting.md)：全エラーメッセージと対処方法
