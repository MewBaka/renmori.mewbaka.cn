---
title: "renmori gui：GUI で Ren'Py ゲームを保護"
description: "コマンドラインを使わずに、Tkinter ベースの GUI で Ren'Py ビルドの保護・検証と renmori.toml の編集をウィンドウ上で行う"
---

# renmori gui

`renmori gui` は Tkinter ベースのネイティブウィンドウを開き、ターミナルを使わずに保護、検証、設定ファイルの編集を行えるようにします。

GUI は 1.1.0 から提供されており、独自の保護ロジックは持たず、ターミナルと同じ `renmori protect` と `renmori verify` を子プロセスとして実行します。そのため、プラグインの自動ダウンロード、検証、JSON 形式の結果はいずれも CLI と同じ動作になります。

## 構文

```bash
renmori gui [--lang {auto,en,zh}]
```

表示言語は CLI と同じ規則で決まり、`--lang`、環境変数 `RENMORI_LANG`、システムのロケールの順に参照されます。GUI が対応する言語は英語と中国語のみで、日本語を含むその他のロケールでは英語で表示されるため、本ページでは画面上の表記を英語のまま記載します。なお、`--no-color` と `--quiet` は GUI には影響しません。

## 動作環境

Tkinter は CPython に同梱されているため、GUI による追加の依存関係はありません。また、`renmori gui` を実行しない限り CLI が Tkinter を読み込むこともありません。ただし、以下の環境では個別の対応が必要です。

| 環境 | 対応方法 |
|---|---|
| Debian、Ubuntu などのディストリビューション付属の Python | Tkinter が別パッケージになっているため、`sudo apt install python3-tk` またはディストリビューションの該当パッケージをインストールする |
| Homebrew でインストールした Python（macOS） | `brew install python-tk` を実行する |
| uv または python-build-standalone が提供する Python | Tcl/Tk のデータはインタープリターに同梱されているが `TCL_LIBRARY`、`TK_LIBRARY` が未設定のため、GUI の起動時に自動で検出して設定する |
| ディスプレイのない環境（SSH セッション、CI ランナー、コンテナ） | ウィンドウを開けないため、CLI を使用する |

起動できない場合、`renmori gui` は理由を stderr に出力し、終了コード 2 で終了します。

| 出力 | 原因 |
|---|---|
| `GUI needs Tkinter, which is not available` | 使用中の Python に Tkinter が含まれていない。上表に従ってインストールする |
| `Cannot open a window (no display).` | 利用可能なグラフィカルディスプレイがない |

## ウィンドウの構成

ウィンドウには Protect、Verify、Config の 3 つのタブがあり、下部にステータスバーがあります。ステータスバーには Ready、Running… が順に表示され、ジョブ終了時に ✓ Done または ✗ Failed が、設定ファイルの保存後には保存先のパスが表示されます。

Protect タブと Verify タブの下部にはそれぞれログ領域があります。ジョブを開始すると、先頭行に実際に実行されるコマンド全体（`$` で始まる行）が表示され、続いて stderr の進捗情報と stdout 最終行の JSON 結果を含む CLI の出力がすべてリアルタイムに表示されます。この内容は CLI の生の出力であり、そのままトラブルシューティングに利用できます。

同時に実行できるジョブは 1 つのみで、実行中は対応するボタンが無効になります。ジョブが終了するまでウィンドウを閉じないでください。

## Protect タブ

Protect タブは [`renmori protect`](./protect.md) に対応します。

### パス

| フィールド | 対応するオプション | 説明 |
|---|---|---|
| Game build | `<game-dir \| game.zip>` | Folder… で `game/` を含む配布用ビルドのディレクトリを、.zip… でランチャーが生成したアーカイブを選択する |
| Output (-o) | `-o, --output` | 空欄の場合はその場で保護する（既定ではまず `<dir>_bak` にバックアップ）。指定する場合、そのディレクトリは存在していてはならない |

### オプション

| コントロール | 対応するオプション | 既定の状態 | 説明 |
|---|---|---|---|
| Strength | `--strength` | 空欄 | 空欄、`full`、`auto`、`baseline` から選択。空欄の場合はオプションを渡さず、設定ファイルの値を使用し、設定がなければ `full` |
| Chunk size | `--chunk-size` | 空欄 | 単位はバイトで、ベースラインのみに適用。空欄の場合は設定ファイルの値または既定値 65536 |
| Platforms | `--platforms` | auto-detect | auto-detect のチェックを外すと `mac-universal`、`linux-x64`、`win-x64` から選択できる。チェックを外していずれも選択しない場合は自動検出として扱う。プラグイン使用時のみ有効 |
| Lockdown (disable console/developer/export) | `--no-lockdown` | オン | チェックを外すと `--no-lockdown` と同等。オンのままではオプションを渡さず、設定ファイルの `lockdown` を使用し、設定がなければ有効 |
| Native launcher (on by default; uncheck for --no-launcher) | チェックを外すと `--no-launcher` | オン | プラグイン使用時のみ有効 |
| No backup (in-place) | `--no-backup` | オフ | その場で保護する際に `<dir>_bak` を作成しない。出力先を指定した場合は無効 |
| Keep plaintext (debug) | `--keep-plaintext` | オフ | アーカイブ化した元ファイルを削除しない。デバッグ専用であり、配布用ビルドには使用しない |
| Plugin path | `--plugin` | 空欄 | 自動ダウンロードしたプラグインではなく、指定したプラグインのバイナリを使用する |
| Config (-c) | `-c, --config` | 空欄 | 空欄の場合は `<game-dir>/renmori.toml` またはカレントディレクトリの `renmori.toml` を自動検出する |

Protect タブには除外リストと鍵の取得元の設定がありません。これらが必要な場合は、Config タブで `renmori.toml` を生成し、Config (-c) で指定するか、ビルドディレクトリに保存して自動検出させてください。

### 実行の流れ

1. Protect をクリックすると、入力パスと出力パスを示す確認ダイアログが表示される
2. 確認後、GUI は `-y` を付けて `renmori protect` を実行するため、CLI 側での確認は行われない
3. 初回のフル保護では、個別の確認なしにプラグインが**直接ダウンロード**される。ダウンロードしたプラグインはリリースの `SHA256SUMS` で検証された後にキャッシュされる。ネットワークに接続させたくない場合は `RENMORI_PLUGIN` または `RENMORI_NO_DOWNLOAD=1` を設定する（[保護強度とクローズドプラグイン](./plugin.md) を参照）
4. ジョブ終了時、終了コードが 0 かつ JSON 結果の `status` が `ok` の場合にのみ、ステータスバーに ✓ Done が表示される

保護に成功した際のリリース案内はログ領域に出力されます。GUI では `--no-hints`、`--quiet`、`--no-color` は指定できません。

:::warning
GUI は常に `-y` を渡すため、確認ダイアログが保護前の唯一の確認手順となります。その場で保護すると選択したディレクトリが上書きされるため、確認前にパスを確かめ、No backup (in-place) はオフのままにしてください。
:::

## Verify タブ

Verify タブは [`renmori verify`](./verify.md) に対応します。Browse… で `renmori protect` が生成した保護済みビルドのディレクトリを選択し、Verify をクリックすると検証が始まります。検証内容は CLI と同じで、コンテナのハッシュ、必須ファイルの有無、ディスク上に平文のスクリプトやアーカイブが残っていないかを確認し、結果はログ領域の末尾に JSON 形式で表示されます。

## Config タブ

Config タブは `renmori.toml` のフォームエディターで、設定ファイルの生成、読み込み、保存を行います。Protect タブの設定には直接反映されないため、保存後に Protect タブの Config (-c) で指定するか、ビルドディレクトリに配置してください。各設定キーの詳細は [設定ファイル renmori.toml](./configuration.md) を参照してください。

### フォームの項目

| コントロール | 設定キー | 説明 |
|---|---|---|
| Strength | `[protect] strength` | 空欄の場合は書き込まない |
| Chunk size | `[protect] chunk_size` | 空欄の場合は書き込まない |
| Platforms | `[protect] platforms` | いずれもチェックしない場合は書き込まず、保護時に自動検出する |
| Lockdown | `[protect] lockdown` | 常に `true` または `false` として書き込む |
| Native launcher | `[protect] launcher` | チェックを外した場合のみ `false` を書き込む |
| Keep plaintext (debug) | `[protect] keep_plaintext` | チェックした場合のみ書き込む |
| Exclude globs (one per line) | `[protect] exclude` | 一致したファイルは暗号化しない |
| Keep on disk (one per line) | `[protect] keep_on_disk` | エンジン以外のプログラムが読み取るためにディスク上に残すファイル。`steam_appid.txt` は既定で含まれる |
| Keys (baseline only) master_env | `[keys] master_env` | 鍵そのものではなく、**環境変数名**を入力する |
| Keys (baseline only) script_env | `[keys] script_env` | 同上 |

### ボタン

| ボタン | 動作 |
|---|---|
| Open… | 既存の `renmori.toml` を読み込み、フォームに反映する |
| Generate preview | 現在のフォームの内容からプレビュー領域の設定テキストを再生成する |
| Save as… | 現在のフォームの内容から設定テキストを再生成して保存する。既定のファイル名は `renmori.toml` |

### 注意事項

- プレビュー領域のテキストは**表示専用**であり、Save as… はフォームの内容から再生成してプレビューを上書きするため、プレビュー上で手動編集した内容は保存されない
- ファイルを読み込む際、フォームに反映されるのは上表のキーのみで、それ以外のキーやコメントは保存時に失われる
- 設定ファイルの読み込みには Python 3.11 以上または `tomli` パッケージが必要。解析できない場合、GUI は理由を表示し、生のテキストをプレビュー領域に読み込む
- 鍵の項目には環境変数名のみを記録し、鍵そのものを設定ファイルに書き込まない。CI での鍵管理は [CI との連携](../integration/ci.md) を参照

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| `renmori gui` を実行するとすぐに終了し、終了コードが 2 になる | Tkinter またはディスプレイがない。「動作環境」を参照 |
| macOS でウィンドウが一時的に空白になる | 一部の環境では Tk の初回描画が遅いため、GUI は起動後にレイアウトを一度自動で更新する。それでも空白の場合はウィンドウのサイズを一度変更する |
| ステータスバーに ✗ Failed と表示される | ログ領域で `error:` から始まる行を確認し、[トラブルシューティング](./troubleshooting.md) に従って対処する |
| Config タブで変更した設定が反映されない | 設定ファイルを保存した後、Protect タブの Config (-c) で指定するか、ビルドディレクトリに配置する |
| プレビュー上の手動編集が失われる | 仕様どおりの動作。Save as… はフォームの内容から設定テキストを再生成する。手動で編集する場合は保存後にテキストエディターで編集する |

## 関連ページ

- [`renmori protect`](./protect.md)：全オプション、ファイル処理ルールと実行手順
- [`renmori verify`](./verify.md)：検証項目と使い方
- [設定ファイル renmori.toml](./configuration.md)：全設定キーとマージルール
- [保護強度とクローズドプラグイン](./plugin.md)：プラグインの取得、検証とキャッシュ
