// Notify IndexNow (Bing, Yandex, Naver, Seznam, Yep) about added, changed or deleted pages.
//
//   node scripts/indexnow.mjs --all               every URL in the live sitemap
//   node scripts/indexnow.mjs --since <git-rev>   pages whose source changed in <git-rev>..HEAD
//   node scripts/indexnow.mjs <url>...            the given URLs
//
// Add --dry-run to print the URLs without submitting them.
import { execFileSync } from 'node:child_process';

const SITE = 'https://renmori.mewbaka.cn';
// Public by design: search engines verify it against docs/public/<key>.txt
const KEY = 'eed3c9b2494eb2a66836ce31191239f8';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10000;

// Sources that change the rendered head or layout of every page
const GLOBAL_SOURCES = [/^rspress\.config\.ts$/, /^theme\/.*\.tsx?$/];
// docs/<lang>/<path>.md(x); zh is the default locale and has no prefix
const PAGE_SOURCE = /^docs\/(zh|en|ja)\/(.+)\.mdx?$/;

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function pageUrl(lang, path) {
  const prefix = lang === 'zh' ? '' : `/${lang}`;
  if (path === 'index') return `${SITE}${prefix}/`;
  return `${SITE}${prefix}/${path.replace(/\/index$/, '')}`;
}

async function changedUrls(since) {
  const out = execFileSync('git', ['diff', '--name-status', '-M', `${since}..HEAD`], { encoding: 'utf8' });
  // A rename line lists both paths: the old URL is gone and the new one is added
  const paths = out
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => line.split('\t').slice(1));
  if (paths.some((p) => GLOBAL_SOURCES.some((re) => re.test(p)))) return sitemapUrls();
  return paths.flatMap((p) => {
    const m = p.match(PAGE_SOURCE);
    return m ? [pageUrl(m[1], m[2])] : [];
  });
}

async function submit(urls) {
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE).host,
        key: KEY,
        keyLocation: `${SITE}/${KEY}.txt`,
        urlList: urls.slice(i, i + MAX_URLS_PER_REQUEST),
      }),
    });
    // 200: accepted; 202: accepted, key verification pending
    if (res.status !== 200 && res.status !== 202) {
      throw new Error(`IndexNow returned ${res.status}: ${await res.text()}`);
    }
    console.log(`IndexNow accepted ${Math.min(MAX_URLS_PER_REQUEST, urls.length - i)} URLs (HTTP ${res.status})`);
  }
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const rest = args.filter((a) => a !== '--dry-run');

let urls;
if (rest[0] === '--all') urls = await sitemapUrls();
else if (rest[0] === '--since' && rest[1]) urls = await changedUrls(rest[1]);
else if (rest.length > 0 && !rest[0].startsWith('--')) urls = rest;
else {
  console.error('Usage: node scripts/indexnow.mjs [--dry-run] (--all | --since <git-rev> | <url>...)');
  process.exit(2);
}

urls = [...new Set(urls)];
const foreign = urls.filter((u) => !u.startsWith(`${SITE}/`));
if (foreign.length > 0) throw new Error(`URLs outside ${SITE}: ${foreign.join(', ')}`);

if (urls.length === 0) console.log('No page changes to submit');
else if (dryRun) console.log(urls.join('\n'));
else await submit(urls);
