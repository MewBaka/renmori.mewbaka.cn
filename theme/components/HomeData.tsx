import { useLang } from '@rspress/core/runtime';
import { COPY, type Copy } from './homeDataCopy';
import './HomeData.css';

// Site-internal doc paths; zh is the default locale and carries no prefix
const docPath = (lang: string, page: string) => (lang === 'zh' ? '' : `/${lang}`) + page;

// Real-game benchmark (2026-10-31, Apple M1), medians from the report page
// /milestones/benchmark-game; each pair is [original, protected]
const THROUGHPUT: [number, number][] = [
  [1154, 555],
  [1132, 430],
  [1895, 658],
  [1303, 584],
];
// Cold-cache read time per access in ms: an average image (1.9 MB) derived from
// the image throughput above, then the random-read medians
const READ_MS: [number, number][] = [
  [1.65, 3.44],
  [0.252, 0.403],
  [0.196, 0.265],
  [0.216, 0.181],
];
const FRAME_MS = 16.7;
const STARTUP: [number, number][] = [
  [7.16, 8.44],
  [5.05, 5.83],
];

function Check({ label }: { label: string }) {
  return (
    <span className="rm-data__ok">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M3.5 8.5l3 3 6-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}

function Kpis({ t }: { t: Copy }) {
  return (
    <div className="rm-data__kpis">
      {t.kpis.map((k) => (
        <div className="rm-data__kpi" key={k.label}>
          <div className="rm-data__kpi-value">{k.value}</div>
          <div className="rm-data__kpi-label">{k.label}</div>
          <div className="rm-data__kpi-note">{k.note}</div>
        </div>
      ))}
    </div>
  );
}

type BarsProps = {
  t: Copy;
  title: string;
  groups: string[];
  values: [number, number][];
  max: number;
  ticks: number[];
  unit: string;
  fmt: (v: number) => string;
  band?: { name: string; label: string; value: string };
  // Band width on the axis; a band without one is drawn as a thin marker
  bandAt?: number;
  body: string;
  wide?: boolean;
};

// Grouped horizontal bars: original in a neutral tone, protected in the accent
function Bars({ t, title, groups, values, max, ticks, unit, fmt, band, bandAt, body, wide }: BarsProps) {
  const pct = (v: number) => `${Math.min(v / max, 1) * 100}%`;
  const series = [t.charts.original, t.charts.protected];
  return (
    <article className={wide ? 'rm-data__card rm-data__card--wide' : 'rm-data__card'}>
      <h3 className="rm-data__card-title">{title}</h3>
      <div className="rm-bars__legend">
        <span className="rm-bars__key rm-bars__key--orig">{series[0]}</span>
        <span className="rm-bars__key rm-bars__key--prot">{series[1]}</span>
      </div>
      <div className="rm-meter">
        {groups.map((g, gi) => (
          <div className="rm-bars__group" key={g}>
            {values[gi].map((v, si) => (
              <div className="rm-meter__row" key={si}>
                <span className="rm-meter__name">{si === 0 ? g : ''}</span>
                <div className="rm-meter__track">
                  <div
                    className={`rm-meter__seg ${si === 0 ? 'rm-bars__seg--orig' : 'rm-meter__seg--fill'}`}
                    style={{ width: pct(v) }}
                    tabIndex={0}
                  >
                    <span className="rm-tip">
                      {g} · {series[si]} · {fmt(v)} {unit}
                    </span>
                  </div>
                </div>
                <span className="rm-meter__value">{fmt(v)}</span>
              </div>
            ))}
          </div>
        ))}
        {band && (
          <div className="rm-bars__group">
            <div className="rm-meter__row">
              <span className="rm-meter__name">{band.name}</span>
              <div className="rm-meter__track">
                <div
                  className={`rm-meter__seg rm-meter__seg--band${bandAt ? '' : ' rm-bars__band'}`}
                  style={bandAt ? { width: pct(bandAt) } : undefined}
                  tabIndex={0}
                >
                  <span className="rm-tip">{band.label}</span>
                </div>
              </div>
              <span className="rm-meter__value">{band.value}</span>
            </div>
          </div>
        )}
        <div className="rm-meter__axis">
          <span className="rm-meter__name" />
          <div className="rm-meter__ticks">
            {ticks.map((v) => (
              <span key={v} style={{ left: pct(v) }}>
                {v}
              </span>
            ))}
          </div>
          <span className="rm-meter__value rm-meter__unit">{unit}</span>
        </div>
      </div>
      <p className="rm-data__body">{body}</p>
    </article>
  );
}

function Charts({ t }: { t: Copy }) {
  const c = t.charts;
  return (
    <>
      <Bars
        t={t}
        wide
        title={c.frame.title}
        groups={c.frame.groups}
        values={READ_MS}
        max={18}
        ticks={[0, 3, 6, 9, 12, 15, 18]}
        unit="ms"
        fmt={(v) => v.toFixed(2)}
        band={c.frame.band}
        bandAt={FRAME_MS}
        body={c.frame.body}
      />
      <Bars
        t={t}
        title={c.throughput.title}
        groups={c.throughput.groups}
        values={THROUGHPUT}
        max={2000}
        ticks={[0, 500, 1000, 1500, 2000]}
        unit="MB/s"
        fmt={(v) => String(v)}
        band={c.throughput.band}
        body={c.throughput.body}
      />
      <Bars
        t={t}
        title={c.startup.title}
        groups={c.startup.groups}
        values={STARTUP}
        max={10}
        ticks={[0, 2, 4, 6, 8, 10]}
        unit="s"
        fmt={(v) => v.toFixed(2)}
        body={c.startup.body}
      />
    </>
  );
}

function Layout({ t }: { t: Copy }) {
  const chunk = (i: string) => (
    <div className="rm-layout__chunk" key={i}>
      <span className="rm-layout__cipher">
        {t.layout.chunk} {i}
        <small>{t.layout.cipher}</small>
      </span>
      <span className="rm-layout__tag">
        <small>{t.layout.tag}</small>
      </span>
    </div>
  );
  return (
    <article className="rm-data__card">
      <h3 className="rm-data__card-title">{t.layout.title}</h3>
      <div className="rm-layout" role="img" aria-label={t.layout.aria}>
        <div className="rm-layout__header">
          {t.layout.header}
          <small>64 B</small>
        </div>
        {chunk('0')}
        {chunk('1')}
        <div className="rm-layout__more">…</div>
        <div className="rm-layout__index">
          {t.layout.index}
          <small>GCM</small>
        </div>
      </div>
      <p className="rm-data__caption">{t.layout.notToScale}</p>
      <code className="rm-data__formula">{t.layout.formula}</code>
      <p className="rm-data__body">{t.layout.body}</p>
    </article>
  );
}

function Disk({ t }: { t: Copy }) {
  return (
    <article className="rm-data__card">
      <h3 className="rm-data__card-title">{t.disk.title}</h3>
      <div className="rm-disk">
        <div className="rm-disk__col">
          <div className="rm-disk__head">
            {t.disk.before}
            <small>{t.disk.beforeNote}</small>
          </div>
          <ul>
            {t.disk.beforeItems.map((f) => (
              <li key={f} className="rm-disk__item rm-disk__item--plain">
                <code>{f}</code>
                <span className="rm-disk__badge">{t.disk.plain}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rm-disk__arrow" aria-hidden="true">
          →
        </div>
        <div className="rm-disk__col">
          <div className="rm-disk__head">{t.disk.after}</div>
          <ul>
            {t.disk.afterItems.map(([f, desc]) => (
              <li key={f} className="rm-disk__item rm-disk__item--sealed">
                <code>{f}</code>
                <span className="rm-disk__desc">{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="rm-data__body">{t.disk.body}</p>
    </article>
  );
}

function Tools({ t }: { t: Copy }) {
  return (
    <article className="rm-data__card">
      <h3 className="rm-data__card-title">{t.tools.title}</h3>
      <table className="rm-data__table">
        <thead>
          <tr>
            {t.tools.cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.tools.rows.map(([tool, result]) => (
            <tr key={tool}>
              <td>
                <code>{tool}</code>
              </td>
              <td>{result}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="rm-sig">
        <div className="rm-sig__title">{t.tools.sigTitle}</div>
        <ul className="rm-sig__list">
          {['PNG', 'RENPY RPC2', 'OggS', 'RIFF', 'OTTO', 'zip'].map((s) => (
            <li key={s}>
              <code>{s}</code>
              <Check label={t.tools.sigResult} />
            </li>
          ))}
        </ul>
      </div>
      <p className="rm-data__body">{t.tools.body}</p>
    </article>
  );
}

function Assets({ t }: { t: Copy }) {
  return (
    <article className="rm-data__card">
      <h3 className="rm-data__card-title">{t.assets.title}</h3>
      <table className="rm-data__table">
        <thead>
          <tr>
            {t.assets.cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.assets.rows.map(([type, path]) => (
            <tr key={type}>
              <td>{type}</td>
              <td className="rm-data__muted">{path}</td>
              <td>
                <Check label={t.assets.ok} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="rm-data__body">{t.assets.body}</p>
    </article>
  );
}

function Spec({ t }: { t: Copy }) {
  return (
    <article className="rm-data__card rm-data__card--wide">
      <h3 className="rm-data__card-title">{t.spec.title}</h3>
      <dl className="rm-spec">
        {t.spec.rows.map(([k, v]) => (
          <div className="rm-spec__row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function HomeData() {
  const lang = useLang();
  const t = COPY[lang as keyof typeof COPY] ?? COPY.en;
  return (
    <section className="rm-data">
      <header className="rm-data__intro">
        <h2 className="rm-data__title">{t.title}</h2>
        <p className="rm-data__lead">{t.lead}</p>
      </header>
      <Kpis t={t} />
      <div className="rm-data__grid">
        <Charts t={t} />
        <Layout t={t} />
        <Disk t={t} />
        <Tools t={t} />
        <Assets t={t} />
        <Spec t={t} />
      </div>
      <footer className="rm-data__footer">
        <ol className="rm-data__notes">
          {t.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ol>
        <p className="rm-data__sources">
          {t.sourcesLabel}
          {t.sources.map(([label, file], i) => (
            <span key={file}>
              {i > 0 ? ' · ' : ' '}
              <a href={docPath(lang, file)}>
                {label}
              </a>
            </span>
          ))}
        </p>
      </footer>
    </section>
  );
}
