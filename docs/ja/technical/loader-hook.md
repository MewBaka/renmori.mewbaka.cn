---
title: ローダーフック
description: RenMori が Ren'Py 8.5 のアセット読み込みに組み込まれる仕組みとして、ファイルオープンのコールバック、ファイルの検出、Ren'Py Extension の読み込みタイミング、RWops の戻り値の型、エンジン内での AES を解説する
---

# ローダーフック

このページには、Ren'Py **8.5.2** のソース（`renpy/loader.py`、`renpy/main.py`、`renpy/script.py`、`renpy/pygame/rwobject.pyx`）の読解と、SDK に同梱されたランタイムの調査から得られた知見を記録しています。これらの知見は、RenMori が対応するすべての Ren'Py バージョンで改めて検証する必要があります。

## 1. すべてのアセットは単一のチョークポイントを通る

`renpy.loader.load(name)` → `load_core(name)` → `renpy.loader.file_open_callbacks` 内の各関数を順に試し、最初に `None` 以外を返した結果を返します。デフォルトの順序は、`config.file_open_callback`、ファイルシステム、アーカイブ（RPA）、APK、リモートです。

呼び出し元の監査結果は次のとおりです。

| リソース | 呼び出し箇所 |
|----------|-----------|
| 画像 | `loader.load()` → `pygame.image.load(f, filename)`（`display/pgrender.py`） |
| 音声**と動画** | `renpy.audio.audio.load()` → `loader.load(fn, directory="audio")`。ムービーはオーディオチャンネルを通じて再生される |
| フォント | `loader.load(fn, directory="fonts")`（`text/font.py`） |
| スクリプト | `.rpyc` は `loader.load(fn, tl=False)` で読み込まれる（`script.py`）。ファイルがディスクとインデックスのどちらに由来するかは問わない |

**唯一の迂回経路：** `renpy.exists()` は `transfn()` を使用し、ディスクのみを対象とすることがドキュメントに明記されています。コンテナに移されたファイルに対してゲームが `renpy.exists()` を呼び出すと、`False` が返ります。フックはこれにパッチを当てます。

**RenMori は `file_open_callbacks` のインデックス 0 にコールバックを挿入する**ため、コンテナはディスク上のいかなるものよりも優先されます。

## 2. ファイルの検出：`scandirfiles_callbacks`

`listdirfiles()`（スクリプトの検出、`renpy.list_files()`、画像の自動定義、`loadable_cache` の構築に使用）は、`renpy.loader.scandirfiles_callbacks` 内の各関数を `add(dn, fn, files, seen)` で呼び出すことで構築されます。RenMori は、アーカイブのエントリと同じ方法で、すべてのコンテナエントリを `dn=None` で追加する関数を登録します。これにより、コンテナ内のファイルに対して `loadable()` が真となり、コンテナ内にのみ存在する `.rpyc` ファイルをスクリプトの検出で見つけられるようになります。

## 3. タイミング：フックは `index_files()` より前に組み込む必要がある

Ren'Py のスクリプトは、ゲームの `.rpy` コードが実行されるより前の起動時に検出されるため、通常の `init python` ブロックでは間に合いません。Ren'Py 8.5 は公式の早期フックとして **Ren'Py Extension** を提供しています。`renpy.main.main()` は、`renpy.loader.index_files()` の実行**前**、かつスクリプトの読み込み前に、Ren'Py のベースディレクトリ、`game/`、`game/libs` から、すべての `*.rpe`（`autorun.py` を含む zip で、`sys.path` に追加される）と `*.rpe.py` をソート順に読み込みます。

RenMori はランタイムを `game/renmori.rpe` として配布します。（これは後のバージョンでネイティブランチャーに移す予定です。`.rpe` は攻撃者にとっての注入ポイントでもあるため、RenMori 自身の署名済み拡張のみに限定するロックダウンが必要です。）

## 4. 戻り値の型が重要：`RWopsIO` と再オープンの罠

Ren'Py 8.5 は、`rwobject.pyx` の `to_rwops()` を通じてファイルオブジェクトを C コード（SDL_image、FreeType、ffmpeg）に渡します。その動作は順に次のとおりです。

1. `.raw` を繰り返しアンラップする
2. `RWopsIOImpl` であれば、その C の `SDL_RWops` を直接使用する（**高速で GIL を必要としない**）
3. **文字列の `.name` を持つ `io.IOBase` であれば、その名前でディスクからファイルを開き直す**（`.base`/`.length` があればそれも使用する）
4. それ以外の場合は、`read` メソッドを持つ任意のオブジェクトを Python のコールバックでラップし、**読み込みのたびに GIL を取得する**

RenMori にとっての影響は次のとおりです。

- **罠**：`io.IOBase` を継承して文字列の `.name` を公開する復号用ファイルオブジェクトはディスクから開き直され、ファイルが見つからずに失敗するか、生の暗号文を SDL に渡してしまう。そのため RenMori のストリームオブジェクトは `.name` と `.raw` のいずれも公開してはならない
- **小〜中規模のファイル**：全体を復号して `RWopsIO.from_buffer(plaintext, name=name)` を返す。これは純粋な C のバッファ RWops で、以後 GIL を取得せず、Ren'Py における最速の経路となる
- **大きなファイル（動画、長い BGM）**：`RWopsIO(stream, name=name)` を返す。`stream` は必要に応じてチャンクを復号する。この経路は Python のコールバックを通り、読み込みごとに 1 回 GIL を取得するためベンチマークが必要であり、本番での解決策はクローズドのランタイムにおけるネイティブの nogil な復号 `SDL_RWops` である

## 5. Ren'Py 自身の Python 内での AES：依存関係は不要

Ren'Py に同梱された Python には `cryptography` も `pycryptodome` も含まれていませんが、`ctypes` は同梱されており（3 つのランタイムすべてに `PyInit__ctypes` が存在）、さらに次のとおりです。

| ランタイム | AES-256-GCM の提供元 |
|---------|--------------------|
| macOS（`librenpython.dylib`、ユニバーサル） | 静的にリンクされ、**エクスポートもされた** OpenSSL（`EVP_aes_256_gcm`、`EVP_CIPHER_CTX_new`、`EVP_DecryptUpdate` など） |
| Linux（`librenpython.so`） | 同上、エクスポート済み |
| Windows（`librenpython.dll`、`libpython3.12.dll`） | EVP のシンボルは**エクスポートされていない**。代わりに OS の **CNG**（`bcrypt.dll`）を使用し、Vista 以降のすべての Windows でハードウェアアクセラレーション対応の AES-GCM を利用できる |

そのため、ランタイムの読み込み処理は `ctypes` を通じて OpenSSL（macOS/Linux）または CNG（Windows）を呼び出します。復号は AES-NI または ARMv8 の暗号拡張を用いてネイティブコードで実行され、Python 側で発生するのはチャンクごとの呼び出しのオーバーヘッドのみです。ビルドツールは `cryptography` パッケージを使用します。すべてのバックエンドは標準的な AES-256-GCM を生成するため、コンテナ形式はバックエンドに依存しません。
