// Copy for the home page data section. Every figure traces back to the RenMori
// docs listed in `sources` (performance: /milestones/benchmark-game); keep the measurement caveats in `notes` accurate.

export type Copy = {
  title: string;
  lead: string;
  kpis: { value: string; label: string; note: string }[];
  charts: {
    original: string;
    protected: string;
    throughput: {
      title: string;
      groups: string[];
      band: { name: string; label: string; value: string };
      body: string;
    };
    frame: {
      title: string;
      groups: string[];
      band: { name: string; label: string; value: string };
      body: string;
    };
    startup: { title: string; groups: string[]; body: string };
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
  lead: '以下性能数据来自一款真实 GalGame 发行版构建的实测，在同一设备上对比原版与 RenMori 保护版：游玩过程中的额外读取延迟不足一帧时间的 1%，加密对玩家几乎无感',
  kpis: [
    { value: '≈ 0.15 ms', label: '随机读取最大额外延迟', note: '不足 60 FPS 单帧时间的 1% ¹' },
    { value: '584 MB/s', label: '冷缓存顺序读取吞吐', note: '全部 3.5 GB 资源实测 ¹' },
    { value: '+1.3 s', label: '冷启动额外耗时', note: '仅在启动时发生一次 ¹' },
    { value: '+0.09%', label: '发行版体积增加', note: '含三个平台的原生运行时 ¹' },
  ],
  charts: {
    original: '原版',
    protected: 'RenMori 保护版',
    throughput: {
      title: '顺序读取吞吐（冷缓存）',
      groups: ['图像', '音频', '视频', '全部资源'],
      band: { name: '实时音视频', label: '实时视频与音频解码所需：数 MB/s', value: '数 MB/s' },
      body: '冷缓存下，保护版读取全部 3.5 GB 资源的吞吐为 584 MB/s，约为原版的 45%，仍是实时音视频解码所需带宽的百倍以上。',
    },
    frame: {
      title: '单次读取耗时与一帧时间（冷缓存）',
      groups: ['平均图像', '随机 64 KB', '打开小文件', '随机 4 KB'],
      band: { name: '60 FPS 一帧', label: '60 FPS 下的单帧时间：16.7 ms', value: '16.7' },
      body: '即使在冷缓存下，保护版读取一张平均大小的图像也只需约 3.4 ms，随机读取的额外延迟不超过 0.15 ms，均远小于 60 FPS 下的单帧时间，游玩时不会产生可察觉的卡顿。',
    },
    startup: {
      title: '启动至首帧耗时',
      groups: ['冷启动', '热启动'],
      body: "额外耗时只在启动时发生一次：为避免在磁盘上留下明文，保护版不写入 Ren'Py 的字节码等运行时缓存，每次启动需重新编译脚本，进入游戏后不再有差异。",
    },
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
    "¹ 性能数据于 2026-10-31 在 Apple M1（8 GB 内存，macOS 26.5.1）上实测，Ren'Py 8.5.2，RenMori 1.2.0 完整保护并通过原生 launcher 启动；样本为一款真实 GalGame 的发行版构建，比较两个构建中一致的 1407 个条目（3593 MB），冷缓存测量每次使用全新的 APFS 克隆。",
    '² 分块布局中的 0.024% 体积开销依据容器格式 v1 规范计算，并非实测值。',
    "³ 现成工具、特征签名与资产类型验证基于 Ren'Py 8.5.2，使用 SDK 样例项目 the_question 与一个包含数千项资产的吉字节级发行版构建。",
  ],
  sourcesLabel: '数据来源：',
  sources: [
    ['真实游戏实测', '/milestones/benchmark-game'],
    ['M1 成果', '/milestones/m1-results'],
    ['容器格式 v1', '/technical/container-format'],
    ['架构', '/technical/architecture'],
    ['M4', '/milestones/m4'],
  ],
};

const en: Copy = {
  title: 'Data and verification',
  lead: 'The performance figures below were measured on the distribution build of a real GalGame, comparing the original and RenMori-protected builds on the same device: the extra read latency during play is under 1% of a frame, so players will hardly notice the encryption',
  kpis: [
    { value: '≈ 0.15 ms', label: 'Max extra random-read latency', note: 'Under 1% of a 60 FPS frame ¹' },
    { value: '584 MB/s', label: 'Cold-cache sequential reads', note: 'All 3.5 GB of assets ¹' },
    { value: '+1.3 s', label: 'Extra cold-start time', note: 'Once per launch only ¹' },
    { value: '+0.09%', label: 'Distribution size increase', note: 'Including native runtimes for 3 platforms ¹' },
  ],
  charts: {
    original: 'Original',
    protected: 'RenMori protected',
    throughput: {
      title: 'Sequential read throughput (cold cache)',
      groups: ['Images', 'Audio', 'Video', 'All assets'],
      band: { name: 'Real-time A/V', label: 'Required for real-time video and audio decoding: a few MB/s', value: 'a few MB/s' },
      body: 'With a cold cache, the protected build reads all 3.5 GB of assets at 584 MB/s, about 45% of the original and still more than a hundred times the bandwidth real-time audio and video decoding needs.',
    },
    frame: {
      title: 'Time per read vs. one frame (cold cache)',
      groups: ['Average image', 'Random 64 KB', 'Small file', 'Random 4 KB'],
      band: { name: '60 FPS frame', label: 'Frame time at 60 FPS: 16.7 ms', value: '16.7' },
      body: 'Even with a cold cache, the protected build reads an image of average size in about 3.4 ms, and random reads gain at most 0.15 ms, all far below one frame at 60 FPS, so there is no noticeable stutter during play.',
    },
    startup: {
      title: 'Time to first frame',
      groups: ['Cold start', 'Warm start'],
      body: "The extra time occurs once per launch: to leave no plaintext on disk, the protected build does not write Ren'Py's runtime caches such as bytecode, so scripts are recompiled at every start; once the game is running there is no difference.",
    },
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
    "¹ Performance measured on 2026-10-31 on an Apple M1 (8 GB memory, macOS 26.5.1) with Ren'Py 8.5.2 and RenMori 1.2.0 full protection started through the native launcher; the sample is the distribution build of a real GalGame, comparing the 1407 entries (3593 MB) identical in both builds, with every cold-cache measurement on a fresh APFS clone.",
    '² The 0.024% size overhead in the chunk layout is derived from the container format v1 specification, not measured.',
    "³ The off-the-shelf tool, file signature and asset type checks were run on Ren'Py 8.5.2 with the SDK sample project the_question and a gigabyte-scale distribution build containing thousands of assets.",
  ],
  sourcesLabel: 'Sources:',
  sources: [
    ['Real-game benchmark', '/milestones/benchmark-game'],
    ['M1 results', '/milestones/m1-results'],
    ['Container format v1', '/technical/container-format'],
    ['Architecture', '/technical/architecture'],
    ['M4', '/milestones/m4'],
  ],
};

const ja: Copy = {
  title: 'データと検証',
  lead: '以下の性能データは、実在する GalGame の配布用ビルドを同一デバイス上でオリジナル版と RenMori 保護版に分けて実測したものです。プレイ中に増える読み込み遅延は 1 フレームの 1% に満たず、暗号化はプレイヤーにほとんど体感されません',
  kpis: [
    { value: '≈ 0.15 ms', label: 'ランダム読み込みの最大追加遅延', note: '60 FPS の 1 フレームの 1% 未満 ¹' },
    { value: '584 MB/s', label: 'コールドキャッシュでの順次読み込み', note: '全 3.5 GB のアセットで実測 ¹' },
    { value: '+1.3 s', label: 'コールドスタートの追加時間', note: '起動時に一度だけ発生 ¹' },
    { value: '+0.09%', label: '配布サイズの増加', note: '3 プラットフォーム分のネイティブランタイムを含む ¹' },
  ],
  charts: {
    original: 'オリジナル版',
    protected: 'RenMori 保護版',
    throughput: {
      title: 'シーケンシャル読み込みスループット（コールドキャッシュ）',
      groups: ['画像', '音声', '動画', '全アセット'],
      band: { name: 'リアルタイム再生', label: 'リアルタイムの動画・音声デコードに必要な帯域：数 MB/s', value: '数 MB/s' },
      body: 'コールドキャッシュで、保護版が全 3.5 GB のアセットを読み込むスループットは 584 MB/s で、オリジナル版の約 45% ですが、リアルタイムの音声・動画デコードに必要な帯域の 100 倍以上です。',
    },
    frame: {
      title: '1 回の読み込み時間と 1 フレームの比較（コールドキャッシュ）',
      groups: ['平均的な画像', 'ランダム 64 KB', '小さなファイル', 'ランダム 4 KB'],
      band: { name: '1 フレーム', label: '60 FPS での 1 フレームの時間：16.7 ms', value: '16.7' },
      body: 'コールドキャッシュでも、保護版は平均的な大きさの画像 1 枚を約 3.4 ms で読み込み、ランダム読み込みで増える遅延も 0.15 ms 以下です。いずれも 60 FPS での 1 フレームを大きく下回り、プレイ中に体感できるカクつきは生じません。',
    },
    startup: {
      title: '最初のフレームまでの時間',
      groups: ['コールドスタート', 'ウォームスタート'],
      body: "追加の時間は起動時に一度だけ発生します。保護版はディスク上に平文を残さないよう、バイトコードなどの Ren'Py のランタイムキャッシュを書き込まないため、起動のたびにスクリプトを再コンパイルします。ゲーム開始後に差はありません。",
    },
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
    "¹ 性能データは 2026-10-31 に Apple M1（メモリ 8 GB、macOS 26.5.1）上で実測。Ren'Py 8.5.2、RenMori 1.2.0 フル保護でネイティブ launcher 経由で起動。サンプルは実在する GalGame の配布用ビルドで、両ビルドで一致する 1407 件のエントリ（3593 MB）を比較し、コールドキャッシュの測定には毎回新しい APFS クローンを使用。",
    '² チャンク構造に示した 0.024% のサイズオーバーヘッドはコンテナ形式 v1 仕様から算出した値であり、実測値ではない。',
    "³ 既存ツール、ファイルシグネチャ、アセット種別の検証は Ren'Py 8.5.2 上で、SDK サンプルプロジェクト the_question と、数千件のアセットを含むギガバイト級の配布用ビルドを用いて実施。",
  ],
  sourcesLabel: 'データの出典：',
  sources: [
    ['実ゲームでの実測', '/milestones/benchmark-game'],
    ['M1 の成果', '/milestones/m1-results'],
    ['コンテナ形式 v1', '/technical/container-format'],
    ['アーキテクチャ', '/technical/architecture'],
    ['M4', '/milestones/m4'],
  ],
};

export const COPY = { zh, en, ja };
