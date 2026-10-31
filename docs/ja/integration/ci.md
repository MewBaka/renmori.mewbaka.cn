---
title: CI との連携
description: CI パイプラインで RenMori を非対話的に実行し、鍵とクローズドプラグインのキャッシュを管理して、renmori verify をリリースのゲートとして利用する方法を解説する
---

# CI との連携

RenMori は、標準的な Ren'Py の配布用ビルドに対して実行するビルド時の単一コマンドであり、ゲームのソースを変更する必要はありません。入力には `game/` サブディレクトリを含む任意のディレクトリを指定でき、これは Ren'Py ランチャーの Build Distributions が生成するものに相当します。

このページでは CI での利用方法のみを扱います。コマンドラインオプションの一覧は [renmori protect](../cli/protect.md)、`renmori.toml` の設定項目は[設定ファイル](../cli/configuration.md)、出力形式、ビルドマニフェスト、終了コードは[出力・ビルドマニフェスト・終了コード](../cli/output.md)を参照してください。

## パイプラインの基本的な流れ

```bash
renmori protect <game-build-dir> -o <output-dir> --quiet
renmori verify  <output-dir>
```

`protect` は `game/` 以下のすべてを `game/renmori.rmc` に格納し、コンパイル済みの Ren'Py スクリプトを変換し、平文の元ファイルを削除したうえで、ローダー拡張 `game/renmori.rpe` を書き込み、`renmori-manifest.json` を出力します。`verify` はこのビルドマニフェストに基づいて保護済みビルドを再検証するため（コンテナのハッシュ、必須ファイル、平文の残存がないこと）、CI のゲートとして適しています。

`-o` を指定した場合、元のビルドは一切変更されず（保護されるのはコピー）、バックアップも作成されません。`-o` を指定しないインプレース保護では、まず元のビルドを同じ階層の `<dir>_bak` ディレクトリにコピーし、このディレクトリがすでに存在する場合は失敗します。`--no-backup` を指定するとこのコピーを省略します。

stdout の最終行は常に JSON オブジェクト（`{"status": "ok", …}` または `{"status": "error", …}`）であり、進捗は stderr に出力されます。JSON のキーと値はどのロケールでも英語のままであるため、パイプラインでの解析は出力の装飾や言語の影響を受けません。`--quiet` を指定すると JSON のみが出力されます。パイプラインでは終了コードによって成否を判定してください。各終了コードは[出力・ビルドマニフェスト・終了コード](../cli/output.md)に記載されています。

## 非対話時の動作

RenMori が確認プロンプトを表示するのは対話型端末（TTY）上のみで、対象はインプレース保護前の `[y/N]` 確認と、クローズドプラグインのダウンロード前の確認です。以下のいずれかに該当する場合はすべてのプロンプトがスキップされるため、パイプラインが入力待ちで停止することはありません。

- `-y` / `--yes` を指定した場合
- `--quiet` を指定した場合
- stdin が TTY でない場合（CI では通常この状態）

TTY でない環境では色付き出力が自動で無効になり、`NO_COLOR` も尊重されます。人が読むための出力の言語はシステムのロケールに従い、`--lang en|zh` または環境変数 `RENMORI_LANG` で固定できます。

## 保護強度とクローズドプラグイン

`strength` を設定しない場合、RenMori はデフォルトでフル保護、すなわちクローズドプラグインが報告する最も強い強度を使用します。利用可能なプラグインがない場合は、ベースライン形式へ暗黙に格下げすることなく実行が失敗します。CI では必要に応じて次のいずれかを選択します。

| 設定 | 動作 |
|------|------|
| 未設定（デフォルト） | プラグインが報告する最も強い強度を使用し、利用可能なプラグインがない場合は失敗 |
| `--strength auto` | プラグインが利用可能ならプラグインを使用し、そうでなければベースライン形式を使用 |
| `--strength baseline` | オープンソースのベースライン形式を強制し、プラグインは一切ダウンロードしない |

プラグインが必要な場合、RenMori は `--plugin` または環境変数 `RENMORI_PLUGIN` で指定されたパス、ローカルキャッシュの順に探し、最後に公開リリースからプラグインをダウンロードして `SHA256SUMS` で検証し、キャッシュに保存します。非対話環境では確認なしでダウンロードが行われます。詳細は[保護強度とクローズドプラグイン](../cli/plugin.md)を参照してください。

### CI でのプラグインのキャッシュ

プラグインのキャッシュディレクトリは、プラグインのリリースタグごとに分かれています。

| プラットフォーム | キャッシュディレクトリ |
|----------|-----------------|
| Linux / macOS | `$XDG_CACHE_HOME/renmori/plugin/<tag>`、`XDG_CACHE_HOME` が未設定の場合は `~/.cache/renmori/plugin/<tag>` |
| Windows | `%LOCALAPPDATA%\renmori\plugin\<tag>` |

このディレクトリを CI の実行間で保持すれば、ビルドのたびにプラグインをダウンロードせずに済みます。GitHub Actions では、Protect ステップの前にキャッシュステップを追加し、キャッシュキーを RenMori が使用するプラグインのリリースタグと一致させます。

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/renmori/plugin
    key: renmori-plugin-${{ runner.os }}-plugin-v1.2.5
```

以下の環境変数により、プラグインの取得方法をさらに制御できます。

| 環境変数 | 効果 |
|----------|--------|
| `RENMORI_PLUGIN` | プラグインのパスを明示的に指定し、キャッシュとダウンロードをスキップ。プラグインを事前に配置したオフラインのランナーに適する |
| `RENMORI_NO_DOWNLOAD=1` | 自動ダウンロードを一切行わない。プラグインがない場合は、強度の設定に応じて失敗するかベースラインにフォールバック |
| `RENMORI_PLUGIN_BASE_URL` | プラグインファイルと `SHA256SUMS` の取得元。デフォルトは公開リリース |
| `RENMORI_PLUGIN_TAG` | 取得するプラグインのリリースタグ。キャッシュのサブディレクトリもこの値で決まる |

## 鍵の管理

`[keys]` セクションはベースライン形式にのみ適用されます。クローズドプラグインを使用する場合、プラグインは自ら鍵を導出し、これらの設定を読み込みません。

デフォルトでは、`protect` はビルドごとに新しいランダムなマスター鍵と、それとは**独立した**スクリプト鍵を生成し、ローダー拡張に埋め込みます（これはベースラインのプレースホルダーであり、クローズドのランタイムでは代わりに実行時に鍵を導出します）。鍵を自分で管理する場合は、鍵を保持する環境変数の名前を `renmori.toml` で指定します。各鍵は 16 進数 64 文字（32 バイト）です。

```toml
[keys]
master_env = "RENMORI_MASTER_KEY"
script_env = "RENMORI_SCRIPT_KEY"
```

これらの変数には CI のシークレットストアから値を設定し、鍵を決してリポジトリにコミットしないでください。指定した変数が設定されていない場合、RenMori はランダムな鍵にフォールバックし、その旨を報告します。

:::warning
RenMori が読み込むのは `[keys]` で名前を指定した環境変数のみです。`renmori.toml` に `[keys]` セクションがない場合、CI で `RENMORI_MASTER_KEY` などの変数を設定しても効果はなく、すべてのビルドで引き続きランダムな鍵が使用されます。
:::

鍵を固定しても、ビルド間で出力がバイト単位で再現されることはありません（各ファイルがランダムなソルトを使用するため）。これは意図された設計です。パイプラインでは、ビルド間でコンテナのハッシュを比較するのではなく、`verify` の結果とビルドマニフェスト内のファイル一覧に対してアサーションを行ってください。

## GitHub Actions の例

リポジトリ内の [`examples/github-actions-protect.yml`](https://github.com/MewBaka/RenMori/blob/main/examples/github-actions-protect.yml) は、ゲームのビルド、`renmori protect` と `renmori verify` の実行、そして保護済みの配布用ビルドのアーティファクトとしてのアップロードという一連の流れを示しています。

```yaml
# Example GitHub Actions workflow: build a Ren'Py game, protect it with renmori,
# verify the result, and upload the protected build as an artifact.
#
# Copy to .github/workflows/protect.yml and adapt the build step to your project.
# renmori runs on the CI runner (the build environment); the protected runtime
# ships inside the game and needs no Python there.

name: Protect Ren'Py build

on:
  workflow_dispatch:
  push:
    tags: ["v*"]

jobs:
  protect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install renmori
        run: pip install renmori

      # Replace this with your real Ren'Py build. It must produce a directory
      # that contains a game/ subdirectory, e.g. dist/MyGame-1.0-pc.
      - name: Build the game
        run: |
          # renpy.sh "$PWD" distribute   # or your existing build script
          echo "produce ./dist/MyGame-pc here"

      # Full protection (the default) uses the closed plugin, downloaded once from
      # the public release and verified against SHA256SUMS. Cache it between runs;
      # keep the key's tag in sync with the plugin release tag renmori pulls.
      - uses: actions/cache@v4
        with:
          path: ~/.cache/renmori/plugin
          key: renmori-plugin-${{ runner.os }}-plugin-v1.2.5

      - name: Protect
        # The plugin derives its own keys, so no key secrets are needed here. Key
        # environment variables apply only to --strength baseline, and only when
        # renmori.toml names them in its [keys] section.
        run: |
          renmori protect ./dist/MyGame-pc -o ./dist/MyGame-pc-protected --quiet

      - name: Verify
        run: renmori verify ./dist/MyGame-pc-protected

      - uses: actions/upload-artifact@v4
        with:
          name: MyGame-pc-protected
          path: ./dist/MyGame-pc-protected
```

使用手順は次のとおりです。

1. このファイルをプロジェクトの `.github/workflows/protect.yml` にコピー
2. Build the game ステップを実際の Ren'Py のビルドコマンドに置き換える。このステップは `game/` サブディレクトリを含むディレクトリを生成する必要がある
3. 必要に応じてトリガーを調整。この例は手動実行時と `v*` タグのプッシュ時に実行される
4. この例にはプラグインキャッシュのステップが含まれている。RenMori の更新によってプラグインのリリースタグが変わった場合は、キャッシュキーも合わせて更新する

RenMori が動作するのは CI のランナー（ビルド環境）上のみです。保護済みのランタイムはゲームに同梱されるため、プレイヤーが Python を別途インストールする必要はありません。この例はデフォルトの強度で実行されるため、ランナー上でクローズドプラグインを取得します。プラグインは独自に鍵を導出するため、Protect ステップで鍵を設定する必要はありません。鍵の環境変数が効果を持つのは、ベースライン形式を使用し、かつ `renmori.toml` の `[keys]` セクションでそれらの名前を指定した場合に限られます。詳しくは上記の「鍵の管理」を参照してください。

## 実際のエンジンによるエンドツーエンドの検証（任意）

[`tools/verify_in_renpy.py`](https://github.com/MewBaka/RenMori/blob/main/tools/verify_in_renpy.py) はサンプルゲームを保護し、実際の Ren'Py SDK の中で、すべてのアセットがバイト単位で正確に復号されること、Ren'Py スクリプトが変換されたうえで引き続き解析できること、そして注入されたスクリプトが拒否されることを確認します。SDK とゲームを指定して実行し、SDK が利用できない環境ではこの検証はスキップされます。
