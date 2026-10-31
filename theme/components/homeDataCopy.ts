// Copy for the home page data section. Every figure traces back to the RenMori
// docs listed in `sources`; keep the measurement caveats in `notes` accurate.

export type Copy = {
  title: string;
  lead: string;
  kpis: { value: string; label: string; note: string }[];
  meter: {
    title: string;
    fillName: string;
    fillLabel: string;
    bandName: string;
    bandLabel: string;
    bandValue: string;
    body: string;
  };
  layout: {
    title: string;
    aria: string;
    header: string;
    chunk: string;
    cipher: string;
    tag: string;
    index: string;
    notToScale: string;
    formula: string;
    body: string;
  };
  disk: {
    title: string;
    before: string;
    beforeNote: string;
    after: string;
    beforeItems: string[];
    afterItems: [string, string][];
    plain: string;
    body: string;
  };
  tools: {
    title: string;
    cols: [string, string];
    rows: [string, string][];
    sigTitle: string;
    sigResult: string;
    body: string;
  };
  assets: {
    title: string;
    cols: [string, string, string];
    rows: [string, string][];
    ok: string;
    body: string;
  };
  spec: { title: string; rows: [string, string][] };
  notes: string[];
  sourcesLabel: string;
  sources: [string, string][];
};

const zh: Copy = {
  title: '数据与验证',
  lead: '以下数据均取自 RenMori 仓库中的里程碑验证记录与容器格式规范，每项数据均注明其测量或推算条件',
  kpis: [
    { value: '74 MB/s', label: '引擎内顺序解密吞吐', note: '基线参考读取器实测 ¹' },
    { value: '≈ 0.024%', label: '容器体积开销', note: '依据格式规范计算 ²' },
    { value: '7 / 7', label: '资产类型逐字节一致', note: 'SHA-256 比对 ³' },
    { value: '0', label: '可恢复的文件特征签名', note: '吉字节级容器扫描 ³' },
  ],
  meter: {
    title: '解密吞吐与实时播放需求',
    fillName: '顺序解密',
    fillLabel: '参考读取器引擎内顺序解密：约 74 MB/s',
    bandName: '实时音视频',
    bandLabel: '实时视频与音频解码所需：数 MB/s',
    bandValue: '数 MB/s',
    body: '基线 Python 参考读取器在引擎内对多 MB 级资产测得约 74 MB/s 的顺序解密吞吐，远高于实时视频与音频解码所需的数 MB/s。实际发行的原生解密器移除了逐分块的 Python 调用开销，其吞吐尚未单独测量。',
  },
  layout: {
    title: '分块布局与体积开销',
    aria: '容器布局：64 字节头部，随后为逐个加密分块，每个分块由 64 KB 密文与 16 字节认证标签组成，末尾为加密索引',
    header: '头部',
    chunk: '分块',
    cipher: '密文 64 KB',
    tag: '标签 16 B',
    index: '加密索引',
    notToScale: '示意图，未按比例绘制',
    formula: 'offset(i) = data_offset + i × (chunk_size + 16)',
    body: '每个分块独立加密并附带 16 字节 GCM 认证标签，体积开销约为 16 / 65,536 ≈ 0.024%，另有 64 字节头部与加密索引。固定的分块步长使任意位置均可按 seek 直接定位，大文件以流式方式解密，无需整体载入内存。',
  },
  disk: {
    title: '磁盘上的文件',
    before: '保护前',
    beforeNote: '典型发行版构建（示意）',
    after: '保护后',
    beforeItems: ['game/archive.rpa', 'game/images.rpa', 'game/script.rpyc', 'game/script.rpy'],
    afterItems: [
      ['game/renmori.rmc', '加密容器'],
      ['game/renmori.rpe', '运行时加载器'],
    ],
    plain: '明文',
    body: '保护完成后，磁盘上不再残留明文封包、.rpyc 或 .rpy，全部资产仅以加密形式存在于容器中，运行时仅额外生成 cache/ 目录。',
  },
  tools: {
    title: '现成工具与特征签名扫描',
    cols: ['工具', '实测结果'],
    rows: [
      ['unrpa', '拒绝该容器：版本自动探测失败，该文件并非 RPA 封包'],
      ['unrpyc', '无从下手：磁盘上不存在可供反编译的 .rpyc 或 .rpy'],
    ],
    sigTitle: '多字节文件魔数',
    sigResult: '未命中',
    body: '对吉字节级容器进行特征签名雕刻，未发现任何多字节文件魔数，仅余统计意义上预期的三字节巧合命中，且均不可恢复，容器与随机数据无从区分。',
  },
  assets: {
    title: '资产类型验证',
    cols: ['资产类型', '投递路径', '结果'],
    rows: [
      ['图像：立绘、CG（PNG/JPG）', '缓冲'],
      ['音频（Opus/OGG）', '缓冲'],
      ['脚本（.rpyc）', '缓冲'],
      ['翻译（tl/<language>/）', '缓冲'],
      ['字体，小型（TTF）', '缓冲'],
      ['字体，大型多 MB（TTF）', '流式'],
      ['视频，大型（WebM/OGV/AVI）', '流式'],
    ],
    ok: '逐字节一致',
    body: '每一种资产类型均经引擎内真实的 renpy.loader 解密，并与原始文件的 SHA-256 逐一比对。',
  },
  spec: {
    title: '加密规格',
    rows: [
      ['认证加密', 'AES-256-GCM'],
      ['密钥派生', 'HKDF-SHA256（RFC 5869）'],
      ['密钥粒度', '每文件独立密钥'],
      ['分块', '默认 64 KB，每分块 16 字节认证标签'],
      ['随机访问', '按 seek 定位分块，大文件流式解密'],
      ['构建独立性', '每次构建生成独立的 container_id 与逐文件密钥，不同构建的密钥互不可用'],
      ['逐构建多态与原生混淆', '构建期变换，不增加运行时开销'],
    ],
  },
  notes: [
    "¹ 于 Ren'Py 8.5.2 引擎内测量，使用 Python 参考读取器（经 ctypes 调用 librenpython 中的 OpenSSL EVP），以 64 KB 分块的 AES-256-GCM 顺序读取多 MB 级资产；实际发行的原生解密器尚未测量。",
    '² 依据容器格式 v1 规范计算，并非实测值。',
    "³ 验证基于 Ren'Py 8.5.2，使用 SDK 样例项目 the_question 与一个包含数千项资产的吉字节级发行版构建。",
  ],
  sourcesLabel: '数据来源：',
  sources: [
    ['M1 成果', '/milestones/m1-results'],
    ['容器格式 v1', '/technical/container-format'],
    ['架构', '/technical/architecture'],
    ['M4', '/milestones/m4'],
  ],
};

const en: Copy = {
  title: 'Data and verification',
  lead: 'All figures below are taken from the milestone verification records and the container format specification in the RenMori repository, with the measurement or derivation conditions stated for each',
  kpis: [
    { value: '74 MB/s', label: 'In-engine sequential decryption', note: 'Measured, baseline reference reader ¹' },
    { value: '≈ 0.024%', label: 'Container size overhead', note: 'Derived from the format spec ²' },
    { value: '7 / 7', label: 'Asset types byte-identical', note: 'SHA-256 comparison ³' },
    { value: '0', label: 'Recoverable file signatures', note: 'Gigabyte-scale container scan ³' },
  ],
  meter: {
    title: 'Decryption throughput vs. real-time playback',
    fillName: 'Sequential decryption',
    fillLabel: 'Reference reader, in-engine sequential decryption: about 74 MB/s',
    bandName: 'Real-time A/V',
    bandLabel: 'Required for real-time video and audio decoding: a few MB/s',
    bandValue: 'a few MB/s',
    body: 'The baseline Python reference reader measured about 74 MB/s of in-engine sequential decryption on multi-megabyte assets, far above the few MB/s that real-time video and audio decoding require. The shipped native decryptor removes the per-chunk Python call overhead; its throughput has not been measured separately.',
  },
  layout: {
    title: 'Chunk layout and size overhead',
    aria: 'Container layout: a 64-byte header, then individually encrypted chunks of 64 KB ciphertext plus a 16-byte authentication tag, followed by the encrypted index',
    header: 'Header',
    chunk: 'Chunk',
    cipher: 'Ciphertext 64 KB',
    tag: 'Tag 16 B',
    index: 'Encrypted index',
    notToScale: 'Schematic, not to scale',
    formula: 'offset(i) = data_offset + i × (chunk_size + 16)',
    body: 'Each chunk is encrypted independently with a 16-byte GCM authentication tag, giving a size overhead of 16 / 65,536 ≈ 0.024%, plus a 64-byte header and the encrypted index. The fixed chunk stride allows any position to be reached by seeking directly, and large files are decrypted as a stream without being loaded into memory in full.',
  },
  disk: {
    title: 'Files on disk',
    before: 'Before',
    beforeNote: 'Typical distribution build (illustrative)',
    after: 'After',
    beforeItems: ['game/archive.rpa', 'game/images.rpa', 'game/script.rpyc', 'game/script.rpy'],
    afterItems: [
      ['game/renmori.rmc', 'Encrypted container'],
      ['game/renmori.rpe', 'Runtime loader'],
    ],
    plain: 'Plaintext',
    body: 'After protection, no plaintext archive, .rpyc or .rpy remains on disk; every asset exists only in encrypted form inside the container, and the runtime adds only a cache/ directory.',
  },
  tools: {
    title: 'Off-the-shelf tools and signature scan',
    cols: ['Tool', 'Measured result'],
    rows: [
      ['unrpa', 'Rejects the container: version auto-detection fails because the file is not an RPA archive'],
      ['unrpyc', 'Nothing to decompile: no .rpyc or .rpy exists on disk'],
    ],
    sigTitle: 'Multi-byte file signatures',
    sigResult: 'Not found',
    body: 'Signature carving over a gigabyte-scale container found no multi-byte file signatures, only the three-byte coincidental matches expected by chance, none of them recoverable; the container is indistinguishable from random data.',
  },
  assets: {
    title: 'Asset type verification',
    cols: ['Asset type', 'Delivery path', 'Result'],
    rows: [
      ['Images: sprites, CGs (PNG/JPG)', 'Buffered'],
      ['Audio (Opus/OGG)', 'Buffered'],
      ['Scripts (.rpyc)', 'Buffered'],
      ['Translations (tl/<language>/)', 'Buffered'],
      ['Fonts, small (TTF)', 'Buffered'],
      ['Fonts, large multi-MB (TTF)', 'Streamed'],
      ['Video, large (WebM/OGV/AVI)', 'Streamed'],
    ],
    ok: 'Byte-identical',
    body: 'Every asset type was decrypted through the real in-engine renpy.loader and compared against the SHA-256 of the original file.',
  },
  spec: {
    title: 'Cryptographic specification',
    rows: [
      ['Authenticated encryption', 'AES-256-GCM'],
      ['Key derivation', 'HKDF-SHA256 (RFC 5869)'],
      ['Key granularity', 'Independent key per file'],
      ['Chunking', '64 KB by default, 16-byte authentication tag per chunk'],
      ['Random access', 'Seek directly to any chunk; large files are streamed'],
      ['Build independence', 'Each build generates its own container_id and per-file keys; keys from one build cannot read another'],
      ['Per-build polymorphism and native obfuscation', 'Build-time transforms with no runtime overhead'],
    ],
  },
  notes: [
    "¹ Measured inside the Ren'Py 8.5.2 engine with the Python reference reader (OpenSSL EVP in librenpython via ctypes), reading multi-megabyte assets sequentially with AES-256-GCM in 64 KB chunks; the shipped native decryptor has not been measured.",
    '² Derived from the container format v1 specification, not a measured value.',
    "³ Verified on Ren'Py 8.5.2 with the SDK sample project the_question and a gigabyte-scale distribution build containing thousands of assets.",
  ],
  sourcesLabel: 'Sources:',
  sources: [
    ['M1 results', '/milestones/m1-results'],
    ['Container format v1', '/technical/container-format'],
    ['Architecture', '/technical/architecture'],
    ['M4', '/milestones/m4'],
  ],
};

const ja: Copy = {
  title: 'データと検証',
  lead: '以下のデータはすべて RenMori リポジトリのマイルストーン検証記録とコンテナ形式仕様に基づくものであり、各項目に測定または算出の条件を記載しています',
  kpis: [
    { value: '74 MB/s', label: 'エンジン内シーケンシャル復号', note: 'ベースライン参照リーダーで実測 ¹' },
    { value: '≈ 0.024%', label: 'コンテナのサイズオーバーヘッド', note: '形式仕様から算出 ²' },
    { value: '7 / 7', label: 'バイト単位で一致したアセット種別', note: 'SHA-256 照合 ³' },
    { value: '0', label: '復元可能なファイルシグネチャ', note: 'ギガバイト級コンテナを走査 ³' },
  ],
  meter: {
    title: '復号スループットとリアルタイム再生の要件',
    fillName: 'シーケンシャル復号',
    fillLabel: '参照リーダーによるエンジン内シーケンシャル復号：約 74 MB/s',
    bandName: 'リアルタイム再生',
    bandLabel: 'リアルタイムの動画・音声デコードに必要な帯域：数 MB/s',
    bandValue: '数 MB/s',
    body: 'ベースラインの Python 参照リーダーは、数 MB 規模のアセットに対してエンジン内で約 74 MB/s のシーケンシャル復号スループットを記録しており、リアルタイムの動画・音声デコードに必要な数 MB/s を大きく上回ります。製品版のネイティブ復号器はチャンクごとの Python 呼び出しのオーバーヘッドを排除していますが、そのスループットは個別には未測定です。',
  },
  layout: {
    title: 'チャンク構成とサイズオーバーヘッド',
    aria: 'コンテナ構成：64 バイトのヘッダー、続いて 64 KB の暗号文と 16 バイトの認証タグからなる個別に暗号化されたチャンク、末尾に暗号化インデックス',
    header: 'ヘッダー',
    chunk: 'チャンク',
    cipher: '暗号文 64 KB',
    tag: 'タグ 16 B',
    index: '暗号化インデックス',
    notToScale: '模式図（縮尺は実際と異なる）',
    formula: 'offset(i) = data_offset + i × (chunk_size + 16)',
    body: '各チャンクは 16 バイトの GCM 認証タグを伴って個別に暗号化され、サイズオーバーヘッドは 16 / 65,536 ≈ 0.024% です。これに加えて 64 バイトのヘッダーと暗号化インデックスが付属します。チャンク間隔が固定されているため任意の位置へ直接シークでき、大きなファイルは全体をメモリに読み込むことなくストリーミングで復号されます。',
  },
  disk: {
    title: 'ディスク上のファイル',
    before: '保護前',
    beforeNote: '一般的な配布用ビルド（例示）',
    after: '保護後',
    beforeItems: ['game/archive.rpa', 'game/images.rpa', 'game/script.rpyc', 'game/script.rpy'],
    afterItems: [
      ['game/renmori.rmc', '暗号化コンテナ'],
      ['game/renmori.rpe', 'ランタイムローダー'],
    ],
    plain: '平文',
    body: '保護後のディスク上には平文のアーカイブ、.rpyc、.rpy は一切残らず、すべてのアセットは暗号化された状態でコンテナ内にのみ存在します。ランタイムが追加で生成するのは cache/ ディレクトリのみです。',
  },
  tools: {
    title: '既存ツールとシグネチャ走査',
    cols: ['ツール', '実測結果'],
    rows: [
      ['unrpa', 'コンテナを拒否：RPA アーカイブではないため、バージョンの自動判別に失敗'],
      ['unrpyc', '対象なし：デコンパイル可能な .rpyc や .rpy がディスク上に存在しない'],
    ],
    sigTitle: 'マルチバイトのファイルシグネチャ',
    sigResult: '検出なし',
    body: 'ギガバイト級のコンテナに対するシグネチャカービングでは、マルチバイトのファイルシグネチャは一切検出されず、統計的に想定される 3 バイトの偶然一致のみが残り、いずれも復元できませんでした。コンテナはランダムデータと区別できません。',
  },
  assets: {
    title: 'アセット種別の検証',
    cols: ['アセット種別', '供給経路', '結果'],
    rows: [
      ['画像：立ち絵、CG（PNG/JPG）', 'バッファ'],
      ['音声（Opus/OGG）', 'バッファ'],
      ['スクリプト（.rpyc）', 'バッファ'],
      ['翻訳（tl/<language>/）', 'バッファ'],
      ['フォント、小（TTF）', 'バッファ'],
      ['フォント、数 MB 規模（TTF）', 'ストリーミング'],
      ['動画、大容量（WebM/OGV/AVI）', 'ストリーミング'],
    ],
    ok: 'バイト単位で一致',
    body: 'すべてのアセット種別をエンジン内の実際の renpy.loader で復号し、元ファイルの SHA-256 と照合しました。',
  },
  spec: {
    title: '暗号仕様',
    rows: [
      ['認証付き暗号', 'AES-256-GCM'],
      ['鍵導出', 'HKDF-SHA256（RFC 5869）'],
      ['鍵の粒度', 'ファイルごとに独立した鍵'],
      ['チャンク', 'デフォルト 64 KB、チャンクごとに 16 バイトの認証タグ'],
      ['ランダムアクセス', '任意のチャンクへ直接シーク、大容量ファイルはストリーミング'],
      ['ビルドの独立性', 'ビルドごとに独立した container_id とファイル鍵を生成し、異なるビルドの鍵は相互に利用不可'],
      ['ビルドごとの多態化とネイティブ難読化', 'ビルド時の変換であり、ランタイムのオーバーヘッドはなし'],
    ],
  },
  notes: [
    "¹ Ren'Py 8.5.2 エンジン内で、Python 参照リーダー（ctypes 経由で librenpython の OpenSSL EVP を使用）により、64 KB チャンクの AES-256-GCM で数 MB 規模のアセットを順次読み込んで測定。製品版のネイティブ復号器は未測定。",
    '² コンテナ形式 v1 仕様から算出した値であり、実測値ではない。',
    "³ Ren'Py 8.5.2 上で、SDK サンプルプロジェクト the_question と、数千件のアセットを含むギガバイト級の配布用ビルドを用いて検証。",
  ],
  sourcesLabel: 'データの出典：',
  sources: [
    ['M1 の成果', '/milestones/m1-results'],
    ['コンテナ形式 v1', '/technical/container-format'],
    ['アーキテクチャ', '/technical/architecture'],
    ['M4', '/milestones/m4'],
  ],
};

export const COPY = { zh, en, ja };
