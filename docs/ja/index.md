---
pageType: home

hero:
  name: RenMori
  text: |
    商用 Ren'Py ビジュアルノベル向けの
    全データ保護ツール
  tagline: MewBaka が公開、プレイ体験を損なうことなくビジュアルノベルを保護
  image:
    src: /renmori-protector.svg
    alt: RenMori
  actions:
    - theme: brand
      text: クイックスタート
      link: /ja/guide/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/MewBaka/RenMori

features:
  - title: 全データ暗号化
    icon: /icons/lock.svg
    details: スクリプト、立ち絵、CG、音声、動画、フォント、翻訳、設定をすべて暗号化コンテナに格納し、実行中のエンジン内部でのみ復号するため、ディスク上に平文のアセットを残さない
  - title: 非侵入型
    icon: /icons/package.svg
    details: Ren'Py ランチャーが生成した配布用ビルドや <code>.zip</code> アーカイブを直接処理し、プロジェクトのソースや既存の開発フローを変更する必要がない
  - title: ビルドごとの差異化
    icon: /icons/shuffle.svg
    details: ビルドごとに異なる保護が生成されるため、特定の作品やバージョンに対する解析結果を他のビルドに流用できない
  - title: デフォルトで設定不要
    icon: /icons/sliders.svg
    details: そのまま利用でき、任意の <code>renmori.toml</code> でチャンクサイズ、除外リスト、ロック、保護強度、鍵の取得元を制御可能
  - title: CI を前提とした設計
    icon: /icons/branch.svg
    details: 機械可読な JSON 結果と明確な終了コードを出力し、<code>renmori verify</code> をパイプラインのゲートとして配布用ビルドごとにアーカイブ化と検証を自動化
  - title: 商用利用も無料
    icon: /icons/heart.svg
    details: 商用作品を含め、あらゆる Ren'Py ゲームの保護は無料であり、ランタイムはゲームと共に無償で再配布可能
---
