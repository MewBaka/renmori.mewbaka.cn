---
pageType: home

hero:
  name: RenMori
  text: |
    Full-data protection for
    commercial Ren'Py visual novels
  tagline: Released by MewBaka, protecting your visual novel without getting in the way
  image:
    src: /renmori-protector.svg
    alt: RenMori
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/MewBaka/RenMori

features:
  - title: Full-data encryption
    icon: /icons/lock.svg
    details: Scripts, sprites, CGs, audio, video, fonts, translations and configuration are packed into an encrypted container and decrypted only inside the running engine, leaving no plaintext assets on disk
  - title: Non-invasive
    icon: /icons/package.svg
    details: Works directly on the distribution build or <code>.zip</code> archive produced by the Ren'Py launcher, with no changes to the project source or existing workflow
  - title: Per-build variation
    icon: /icons/shuffle.svg
    details: Every build is protected differently, so reverse-engineering results for one title or version do not carry over to other builds
  - title: Zero configuration
    icon: /icons/sliders.svg
    details: Works out of the box; an optional <code>renmori.toml</code> controls chunk size, exclusion lists, locking, protection strength and key source
  - title: Built for CI
    icon: /icons/branch.svg
    details: Emits machine-readable JSON results with explicit exit codes, and <code>renmori verify</code> serves as a pipeline gate that packs and verifies every distribution build automatically
  - title: Free for commercial use
    icon: /icons/heart.svg
    details: Protecting any Ren'Py game is free, commercial titles included, and the runtime may be redistributed with the game at no cost
---
