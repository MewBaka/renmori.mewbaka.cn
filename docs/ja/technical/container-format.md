---
title: "コンテナ形式 v1 の仕様"
description: RenMori のベースラインコンテナ形式 v1 の公開仕様として、ファイルレイアウト、ヘッダーとインデックスの構造、チャンク単位の暗号化、HKDF による鍵導出、ノンスと AAD の方式を解説する
---

# コンテナ形式

このページでは、固定かつ公開された中程度の強度の**ベースライン**コンテナ形式（v1）について説明します。本番の配布用ビルドはクローズドの多態化エンジンを経由し、このエンジンがビルドごとにレイアウトと鍵導出をランダム化します。本仕様が記述するのは、オープンなフレームワークが実装し、テストしている固定のベースラインです。

整数はすべてリトルエンディアンです。暗号化にはすべて **AES-256-GCM**（16 バイトの認証タグ）を使用します。

## レイアウト

```
+-------------------------------+  offset 0
| Header (64 bytes)             |
+-------------------------------+  offset 64
| Encrypted file payloads       |   (one region per file, in add order)
|   file A: chunk 0, chunk 1, …  |
|   file B: chunk 0, …           |
+-------------------------------+  header.index_offset
| Encrypted index (GCM)         |
+-------------------------------+  EOF
```

### ヘッダー（64 バイト）

| オフセット | サイズ | フィールド | 説明 |
|-------:|-----:|-------|-------|
| 0 | 8 | magic | `52 45 4E 4D 4F 52 49 01`（`RENMORI\x01`） |
| 8 | 2 | version | `1` |
| 10 | 2 | flags | 予約、`0` |
| 12 | 4 | chunk_size | チャンクあたりの平文のバイト数（デフォルト 65536） |
| 16 | 8 | index_offset | 暗号化されたインデックスのバイトオフセット |
| 24 | 8 | index_length | 暗号化されたインデックスの長さ（平文の長さ + 16 バイトの認証タグ） |
| 32 | 12 | index_nonce | インデックスの GCM ノンス |
| 44 | 16 | container_id | コンテナごとにランダム、すべての鍵導出のソルトとなる |
| 60 | 4 | reserved | `0` |

ヘッダーの先頭 **60 バイト**（`reserved` 以外のすべてのフィールド）はインデックスの GCM AAD となるため、ヘッダーを改変するとインデックスを復号できなくなります。

### インデックス

インデックスは GCM で暗号化された UTF-8 の JSON オブジェクトです。

```json
{ "v": 1, "files": { "<name>": [data_offset, size, "<file_id hex>"], … } }
```

- `name`：Ren'Py のゲームディレクトリからの相対パス。スラッシュ区切りで、先頭のスラッシュは付かない（例：`images/bg.png`）
- `data_offset`：そのファイルの最初の暗号化チャンクの絶対オフセット
- `size`：平文のサイズ（バイト単位）
- `file_id`：16 バイトの乱数（16 進表記）。ファイルごとに一意で、ファイル鍵のソルトとなる

### ファイルペイロード

各ファイルの平文は `chunk_size` バイトごとのチャンクに分割されます（空のファイルは 1 つの空のチャンクとして扱われるため、この場合も認証タグを持ちます）。各チャンクは個別に暗号化され、`ciphertext || tag`（平文の長さ + 16）の形で格納されます。最後のチャンク以外はすべて平文をちょうど `chunk_size` バイト保持するため、ファイルのチャンク *i* は常に `data_offset + i*(chunk_size + 16)` から始まり、走査を行わずに**シークによるランダムアクセス**が可能です。

## 鍵導出（HKDF-SHA256、RFC 5869）

```
index_key      = HKDF(ikm=master_key, salt=container_id, info="renmori/v1/index")
file_key(id)   = HKDF(ikm=master_key, salt=container_id, info="renmori/v1/file/" + id)
```

- `master_key` は 32 バイトで、実行時にこれをどこから得るかは本ベースライン仕様の範囲**外**である。オープンなフレームワークはこれを入力として受け取り、配布されるゲームではクローズドの鍵導出ロジックがこれを隠蔽し再構築する
- ファイルごとの鍵により、ノンスの方式の適用範囲はファイルごとに 1 つの鍵に限定される

### チャンクごとのノンス（12 バイト）と AAD

```
nonce(i) = file_id[:8] || uint32_le(i)
aad(i)   = uint32_le(i) || uint8(1 if last chunk else 0)
```

カウンターによって各ノンスはファイル内で一意となり、ファイルごとに一意な鍵によってファイル間でも一意となります。AAD は各チャンクをその位置に結び付け、最後のチャンクに印を付けるため、チャンクの並べ替えはできず、ファイルを気付かれないように切り詰めることもできません。

## セキュリティに関する注記（ベースライン）

- GCM によりチャンクごとに機密性と完全性を確保するため、どこが改ざんされても復号は失敗する
- この形式は**公開かつ固定**であるため、単独ではベースラインの強度しか持たない。汎用的な読み取りツールが成立するのは、攻撃者がマスター鍵も保持している場合*に限られる*。実際の障壁は実行時の鍵導出（クローズド）とビルドごとの多態化（クローズド）であり、いずれも本仕様の対象外
- 設計上の対象外：メモリからの抽出と画面のキャプチャ（[脅威モデル](./threat-model.md)を参照）

## リファレンス実装

- 書き込み：[`src/renmori/container/writer.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/writer.py)
- 読み込みとストリーミング：[`src/renmori/container/reader.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/reader.py)
- AES-GCM バックエンド：[`src/renmori/container/crypto.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/crypto.py)
- 形式の定数と鍵導出：[`src/renmori/container/format.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/format.py)
