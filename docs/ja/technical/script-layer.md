---
title: "スクリプト層：rpyc の暗号化と逆コンパイル対策"
description: "RenMori が Ren'Py の .rpyc スクリプトを暗号化し、un.rpyc などの注入式デコンパイラを阻止する仕組みと、リリース時のロックダウン施策を解説する"
---

# スクリプト層

M1 の時点で、すべての `.rpyc` はコンテナ内で暗号化されているため、配布されたビルドに対して既存のツールがそれらに到達することはできません。M2 では、コンテナの中身が露出した場合（コンテナ鍵の流出や導出、またはメモリダンプ）に備えて Ren'Py スクリプトの*ソース*に対する**多層防御**を追加し、さらに注入式デコンパイラを阻止して配布用ビルドをロックダウンする**エンジンの堅牢化**を追加します。

## 1. スクリプトの変換（ベースライン）

コンパイル済みスクリプトは、AST を pickle として RPYC2 のスロットペイロードに格納しています（`zlib(pickle((data, stmts)))`）。RenMori はビルド時に、各 pickle ペイロードを次のものに置き換えます。

```
SCRIPT_MAGIC (b"RMSC\x01") || nonce(12) || AES-256-GCM(script_key, pickle)
```

- **`script_key` はコンテナのマスター鍵から独立している**：マスター鍵だけでコンテナの中身を露出させても、スクリプト鍵も必要となるため、デコンパイル可能なスクリプトは得られ*ない*。スクリプト鍵はランタイムの拡張に置かれ、本番ではクローズドのネイティブランタイムに置かれる
- この変換は可逆かつ無損失：ランタイムは Ren'Py が unpickle する前に元とまったく同じ pickle へ復号するため、AST のセマンティクスには一切影響しない。ビルド側の実装は [`script/transform.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/script/transform.py)、ランタイム側は [`runtime/hook.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/runtime/hook.py) における `renpy.script.loads` へのパッチ

### デコンパイラが失敗する理由

格納されたスロットペイロードはもはや pickle ではないため、これを抽出したデコンパイラから見えるのは `SCRIPT_MAGIC || ciphertext` だけです。同一の `script.rpyc` に対して、次の 2 つのツールで検証済みです。

| ツール | 元の `.rpyc` | RenMori による変換後 |
|------|------------------|---------------------|
| `unrpyc` | `.rpy` にデコンパイルされる | **失敗** |
| `unrpyc --try-harder` | — | **失敗**（zlib/base64/hex/エスケープの各デコード層は AES-GCM を扱えない） |
| `rpycdec` | `.rpy` にデコンパイルされる | **失敗**（`Unsupported file format`） |

### クローズドでの強化：ビルドごとの AST 構造のランダム化

ベースラインを元に戻すのに必要なのは、鍵を用いた 1 つの手順だけです。あるビルドのスクリプト鍵を入手した攻撃者は、標準の pickle を取り戻せます。クローズドの多態化エンジンはさらに先へ進みます。このエンジンはコンパイル済みスクリプトの*構造*をビルドごとにランダム化するため、完全に復号されたとしても、ペイロードにはデコンパイラが処理の振り分けに使える標準のクラス名が含まれず、それを復元できる単一の可逆な鍵も存在しません。これはプレイヤーには決して配布されないビルド時の変換であり、ビルドごとに異なるため、解析結果を流用することはできません。その仕組みと実装は独自のものであり、非公開リポジトリ `MewBaka/RenMori-core` で管理されています。

## 2. 注入の阻止（エンジン層）

`un.rpyc` 型のデコンパイラは、`game/` に置かれてスクリプトとして読み込まれ、その init コードがすべてをダンプするという仕組みで動作します。RenMori は、物理的にゲームディレクトリ内に解決されるスクリプト系ファイル（`.rpyc/.rpymc/.rpy/.rpym/.rpe`）を**開くこと**を拒否するため、注入されたファイルのコードが実行されることはありません。`renpy/common` 以下のエンジンスクリプトは影響を受けません（この防御の対象はゲームディレクトリに限られます）。正規の Ren'Py スクリプトはコンテナからのみ供給されます。検証結果として、ディスク上に置いた `game/*.rpyc` は `load_core` から `None` が返される一方、コンテナ内のスクリプトは引き続き読み込まれます。

## 3. リリース時のロックダウン

保護済みビルドでは、ランタイムが `config.developer = False` と `config.console = False` を設定し、データをエクスポートするサブコマンド（`compile`、`dialogue`、`translate`、`add_from`、`merge_strings`）を拒否します。`renpy.sh … lint` と `run` は引き続き動作します。

## 検証

```bash
python tools/verify_in_renpy.py --sdk /Applications/renpy-8.5.2-sdk \
    --game /Applications/renpy-8.5.2-sdk/the_question
```

フェーズ 1（拡張の読み込み）：アセットはバイト単位で一致し、各スクリプトのペイロードは変換済み（もはや pickle ではない）で、かつ有効な pickle に戻すことができ、ディスク上に置いたスクリプトは拒否されます。フェーズ 2（完全な `lint`）：エンジンは変換済みのすべてのスクリプトをエンドツーエンドで読み込んで解析し、エラーは発生しません。これに加えて、[`tests/test_script.py`](https://github.com/MewBaka/RenMori/blob/main/tests/test_script.py) の単体テストが、無損失な変換の往復を検証しています。検証スクリプトは [`tools/verify_in_renpy.py`](https://github.com/MewBaka/RenMori/blob/main/tools/verify_in_renpy.py) です。
