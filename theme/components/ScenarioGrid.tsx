import type { ReactNode } from 'react';
import { useLang } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme-original';
import './ScenarioGrid.css';

type Scenario = { page: string; icon: ReactNode };
type Copy = { title: string; desc: string }[];

const svg = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const SCENARIOS: Scenario[] = [
  {
    page: '/integration/steam-release',
    icon: svg(
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <path d="M12 15v3" />
      </>,
    ),
  },
  {
    page: '/integration/ci',
    icon: svg(
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="8" r="2.5" />
        <path d="M6 8.5v7" />
        <path d="M18 10.5c0 4-6 3-11 6" />
      </>,
    ),
  },
  {
    page: '/technical/architecture',
    icon: svg(
      <>
        <path d="M12 3 2 8l10 5 10-5-10-5Z" />
        <path d="m2 13 10 5 10-5" />
        <path d="m2 18 10 5 10-5" />
      </>,
    ),
  },
  {
    page: '/license/developer-notes',
    icon: svg(
      <>
        <rect x="5" y="4" width="14" height="18" rx="2" />
        <path d="M9 4V2.5h6V4" />
        <path d="m9 13 2 2 4-4" />
      </>,
    ),
  },
];

const COPY: Record<string, Copy> = {
  zh: [
    { title: '加密并发布游戏', desc: '保护发行版构建并上传至 Steam 等发行平台' },
    { title: '集成在 CI 过程中', desc: '在流水线中自动完成保护与校验' },
    { title: '了解项目架构', desc: '资源、脚本与引擎各层的保护设计' },
    { title: '游戏发布注意', desc: '授权范围、第三方组件义务与发布前检查清单' },
  ],
  en: [
    { title: 'Protect and release your game', desc: 'Protect the distribution build and upload it to Steam and other storefronts' },
    { title: 'Integrate into CI', desc: 'Automate protection and verification in your pipeline' },
    { title: 'Understand the architecture', desc: 'How the asset, script and engine layers are protected' },
    { title: 'Before you release', desc: 'License scope, third-party obligations and the pre-release checklist' },
  ],
  ja: [
    { title: 'ゲームを暗号化してリリースする', desc: '配布用ビルドを保護し、Steam などのプラットフォームにアップロード' },
    { title: 'CI に組み込む', desc: 'パイプラインで保護と検証を自動化' },
    { title: 'アーキテクチャを理解する', desc: 'アセット、スクリプト、エンジンの各層における保護の設計' },
    { title: 'リリース時の注意事項', desc: '許諾範囲、サードパーティコンポーネントの義務、リリース前チェックリスト' },
  ],
};

export function ScenarioGrid() {
  const lang = useLang();
  const copy = COPY[lang] ?? COPY.en;
  // zh is the default locale and carries no prefix
  const prefix = lang === 'zh' ? '' : `/${lang}`;

  return (
    <div className="rm-scenarios">
      {SCENARIOS.map(({ page, icon }, i) => (
        <Link key={page} href={prefix + page} className="rm-scenario">
          <span className="rm-scenario__icon">{icon}</span>
          <span className="rm-scenario__text">
            <span className="rm-scenario__title">{copy[i].title}</span>
            <span className="rm-scenario__desc">{copy[i].desc}</span>
          </span>
          <span className="rm-scenario__arrow" aria-hidden="true">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
