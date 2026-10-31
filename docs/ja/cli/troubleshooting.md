---
title: "トラブルシューティング：エラーと対処法"
description: "renmori protect と renmori verify の全エラーメッセージとその原因・対処法、および暗号化した Ren'Py ゲームの実行時によくある問題"
---

# トラブルシューティング

エラーメッセージは英語で stdout の結果 JSON（`message` または `problems` フィールド）に書き込まれ、stderr の表示も同じ内容です。下表ではコマンドと段階ごとに全エラーと対処方法を示します。終了コードの意味は[出力・ビルドマニフェスト・終了コード](./output.md)を参照してください。

## protect：入力

| エラーメッセージ | 終了コード | 原因と対処 |
|---|---:|---|
| `<dir> has no 'game/' directory` | 2 | 入力ディレクトリに `game/` がない。`game/` 自体や Ren'Py のソースプロジェクトのディレクトリではなく、配布用ビルドのルートディレクトリを指定する |
| `<dir> is already protected (found renmori.rmc)` | 2 | `game/` にすでに `renmori.rmc` が存在する。新しい配布用ビルドまたは `_bak` バックアップから再実行する |
| `no 'game/' directory found in the archive` | 2 | `.zip` 内に `game/` を含むビルドが見つからない。ランチャーが生成した配布アーカイブを指定する |
| `the archive holds more than one game build (…)` | 2 | `.zip` のトップレベルに複数のビルドが含まれている。先に展開し、保護したいビルドを `renmori` に指定する |
| `unsafe path in archive: <member>` | 2 | アーカイブに展開先ディレクトリの外へ展開されるメンバーがあり、コマンドが処理を拒否した。アーカイブを作り直す |
| `output <dir> already exists` | 2 | `-o` で指定したディレクトリ、または `.zip` から導出された出力ディレクトリがすでに存在する。そのディレクトリを削除するか、別のパスを使用する |
| `nothing to pack under <dir>/game` | 2 | `game/` にアーカイブ可能なファイルがない。すべてが `exclude` に一致しているか、ビルド自体が空である可能性がある |

## protect：設定と鍵

| エラーメッセージ | 終了コード | 原因と対処 |
|---|---:|---|
| `config not found: <path>` | 2 | `-c` で指定したファイルが存在しない |
| `reading renmori.toml needs Python 3.11+ or the 'tomli' package` | 2 | 現在の Python が 3.11 未満で、`tomli` もインストールされていない。`pip install tomli` を実行するか Python をアップグレードする |
| `<VAR> must be hex` | 2 | `[keys]` で指定した環境変数に 16 進数以外の文字が含まれている |
| `<VAR> must be 32 bytes (64 hex chars), got <n>` | 2 | 鍵の長さが 32 バイトではない。64 文字の 16 進数を使用する |
| `<VAR> not set; using a random key`（通知） | — | `[keys]` で指定した環境変数が存在しないか空のため、今回のビルドではランダムな鍵を使用した。CI では Secret が注入されているかを確認する |

## protect：保護強度とプラグイン

| エラーメッセージ | 終了コード | 原因と対処 |
|---|---:|---|
| `full protection needs the closed plugin; …` | 2 | 強度が未設定のためプラグインが必要だが、利用できない（ダウンロードの拒否、`RENMORI_NO_DOWNLOAD` の設定、ネットワークの失敗、または現在のプラットフォーム向けのダウンロード可能なプラグインがない）。ダウンロードを許可するか、`--plugin` や `RENMORI_PLUGIN` でプラグインを指定するか、`--strength baseline` を明示的に使用する |
| `strength '<s>' requires the closed renmori plugin; …` | 2 | 指定した強度にはプラグインが必要だが、プラグインが利用できないか、その強度に対応していない |
| `Downloaded plugin failed its checksum; discarded`（通知） | — | ダウンロードしたファイルが `SHA256SUMS` と一致しないため破棄した。再試行するか、`RENMORI_PLUGIN_BASE_URL` が指すミラーが完全かを確認する |
| `Could not download the plugin: <err>`（通知） | — | ネットワークエラー、または `SHA256SUMS` に該当するエントリがない。ネットワークとプロキシの設定を確認するか、事前にキャッシュしたプラグインを使用する |
| `plugin not found, ignoring: <path>`（通知） | — | `--plugin` または `RENMORI_PLUGIN` が指すファイルが存在しないため無視し、キャッシュの検索またはダウンロードを続行した |
| `plugin interface <n> unsupported (need <m>); ignoring it`（通知） | — | プラグインのインターフェースバージョンが古い。プラグインをアップグレードするか、キャッシュを削除して再ダウンロードする |
| `plugin protection failed: <message>` | 1 | プラグインの実行に失敗した。元のビルドは復元され、`-o` の不完全な出力は削除済み。プラグインが stderr に出力した情報をもとに調査する |

## protect：実行

| エラーメッセージ | 終了コード | 原因と対処 |
|---|---:|---|
| `backup <dir>_bak already exists; …` | 2 | 前回のインプレース保護のバックアップが残っている。削除するか、`-o` を使用するか、バックアップが不要であることを確認したうえで `--no-backup` を使用する |
| `{"status": "aborted"}` | 2 | 確認プロンプトで `y` と回答しなかった。CI ではプロンプトは表示されない |
| `packing failed: unsupported RPA archive format: …` | 1 | `.rpa` アーカイブが RPA-3.0 または RPA-2.0 形式ではない（通常はサードパーティのツールで生成されたもの）。Ren'Py ランチャーが生成する標準のアーカイブを使用する |
| `packing failed: <err>` | 1 | アーカイブ化中にファイルの読み書きエラーが発生した（例：ディスク容量の不足、ファイルが使用中） |
| `warning: could not remove <path>: <err>`（通知） | — | アーカイブ化の後、平文の元ファイルの削除に失敗した。続けて実行する `renmori verify` が残存を報告するため、手動で削除してから再検証する |

## verify

| エラーメッセージ | 終了コード | 原因と対処 |
|---|---:|---|
| `no renmori-manifest.json in <dir>` | 2 | ディレクトリにビルドマニフェストがない。`protect` の出力ディレクトリを指定していること、マニフェストが移動されていないことを確認する |
| `missing renmori.rmc` | 1 | コンテナファイルがない |
| `missing renmori.rpe` | 1 | ローダー拡張がなく、ゲームは保護されたリソースを一切読み込めない |
| `container sha mismatch` | 1 | 保護後にコンテナが変更された、差し替えられた、転送中に破損した、またはマニフェストとコンテナが同じ保護処理によるものではない。`protect` を再実行する |
| `plaintext left: <path>` | 1 | `game/` に `.rpa`、`.rpyc`、`.rpy`、`.rpyb` または `.rpymc` が残っている。主な原因は `--keep-plaintext` の使用、平文の削除の失敗、または保護後にディレクトリへファイルをコピーしたこと |

## 保護済みビルドの実行時の問題

| 症状 | 原因と対処 |
|---|---|
| ゲームの起動後に画像やスクリプトが見つからない | 配布用ビルドに `renmori.rmc` または `renmori.rpe` が含まれていない。両者は必ず併せて配布する |
| Ren'Py ランチャーで再ビルドした後に保護が失われた | ランチャーはソースプロジェクトから再ビルドする。保護は常にビルド後の最後の手順とし、保護済みディレクトリに対してランチャーを実行しない |
| `exclude` したスクリプトが読み込めない | ランタイムのローダーはディスク上のスクリプト系ファイルを開くことを拒否する。スクリプトは除外しない |
| テスト用ビルドで開発者コンソールを使用したい | `--no-lockdown` で社内テスト用ビルドを生成し、リリース版ではロックダウンを有効のままにする |
| Ren'Py の `compile`、`dialogue`、`translate` などのコマンドラインサブコマンドが拒否される | ロックダウンが有効な場合の想定どおりの動作 |
| Steam SDK がゲームを認識しない | `steam_appid.txt` が平文のままディスク上に残っているかを確認する。このファイルはデフォルトで保持されるため、独自のビルド手順を使用している場合は削除されていないかを確認する。リリース手順は[Steam へのリリース](../integration/steam-release.md)を参照 |
| CI で確認プロンプトが一度も表示されない | 想定どおりの動作。プロンプトは対話型端末でのみ表示される |
| 出力に文字化けやカラー制御文字が含まれる | `--no-color` を使用するか、環境変数 `NO_COLOR` を設定する |

上表にない問題については、コマンド、`renmori --version` の出力と完全なエラーメッセージを添えて [GitHub Issues](https://github.com/MewBaka/RenMori/issues) で報告するか、[team@mewbaka.cn](mailto:team@mewbaka.cn) までメールでご連絡ください。
