import { useLang } from '@rspress/core/runtime';
import { COPY, type Copy } from './homeDataCopy';
import './HomeData.css';

const DOCS = 'https://github.com/MewBaka/RenMori/blob/main/docs/';

// Throughput meter scale; the real-time band is the upper bound of "a few MB/s"
const METER_MAX = 80;
const THROUGHPUT = 74;
const REALTIME_BAND = 10;
const TICKS = [0, 20, 40, 60, 80];

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

function Meter({ t }: { t: Copy }) {
  const pct = (v: number) => `${(v / METER_MAX) * 100}%`;
  return (
    <article className="rm-data__card rm-data__card--wide">
      <h3 className="rm-data__card-title">{t.meter.title}</h3>
      <div className="rm-meter" role="img" aria-label={`${t.meter.fillLabel}; ${t.meter.bandLabel}`}>
        <div className="rm-meter__row">
          <span className="rm-meter__name">{t.meter.fillName}</span>
          <div className="rm-meter__track">
            <div className="rm-meter__seg rm-meter__seg--fill" style={{ width: pct(THROUGHPUT) }} tabIndex={0}>
              <span className="rm-tip">{t.meter.fillLabel}</span>
            </div>
          </div>
          <span className="rm-meter__value">≈ {THROUGHPUT} MB/s</span>
        </div>
        <div className="rm-meter__row">
          <span className="rm-meter__name">{t.meter.bandName}</span>
          <div className="rm-meter__track">
            <div className="rm-meter__seg rm-meter__seg--band" style={{ width: pct(REALTIME_BAND) }} tabIndex={0}>
              <span className="rm-tip">{t.meter.bandLabel}</span>
            </div>
          </div>
          <span className="rm-meter__value">{t.meter.bandValue}</span>
        </div>
        <div className="rm-meter__axis">
          <span className="rm-meter__name" />
          <div className="rm-meter__ticks">
            {TICKS.map((v) => (
              <span key={v} style={{ left: pct(v) }}>
                {v}
              </span>
            ))}
          </div>
          <span className="rm-meter__value rm-meter__unit">MB/s</span>
        </div>
      </div>
      <p className="rm-data__body">{t.meter.body}</p>
    </article>
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
        <Meter t={t} />
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
              <a href={DOCS + file} target="_blank" rel="noreferrer">
                {label}
              </a>
            </span>
          ))}
        </p>
      </footer>
    </section>
  );
}
