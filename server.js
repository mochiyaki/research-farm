// Zero-dependency server: serves the UI and proxies Telem (router.telem.ai has no browser CORS).
const http = require('http'), fs = require('fs'), path = require('path');
const KEY = process.env.TELEM_API_KEY || 'API-HERE';
const PORT = process.env.PORT || 8787;
const MAX_PAGE = 24000;

async function telem(endpoint, body) {
  const r = await fetch('https://router.telem.ai/v1/' + endpoint, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(45000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Telem ' + r.status + ': ' + JSON.stringify(j).slice(0, 300));
  return j;
}

const routes = {
  async search({ query, num = 4 }) {
    const j = await telem('search', { user_input: { query }, search: { providers: { include: ['exa', 'brave'] }, num_results: num } });
    const out = [];
    for (const run of j.preprocessor_runs || [])
      for (const r of run.output_payload?.results || [])
        out.push({ provider: run.preprocessor_name, url: r.url, title: r.title || r.url, summary: r.summary || '', rank: r.rank });
    return { results: out };
  },
  async fetch({ urls }) {
    const j = await telem('fetch', { urls });
    const out = [];
    for (const run of j.preprocessor_runs || [])
      for (const r of run.output_payload?.fetched_results || [])
        out.push({ url: r.url, ok: r.status === 'succeeded', content: (r.content || '').slice(0, MAX_PAGE) });
    return { pages: out };
  },
};

http.createServer(async (req, res) => {
  const m = req.url.match(/^\/api\/(search|fetch)$/);
  if (m && req.method === 'POST') {
    let buf = '';
    req.on('data', c => (buf += c));
    req.on('end', async () => {
      try {
        const data = await routes[m[1]](JSON.parse(buf || '{}'));
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: String(e.message || e) }));
      }
    });
    return;
  }
  fs.readFile(path.join(__dirname, 'index.html'), (err, d) => {
    if (err) { res.writeHead(500); return res.end('index.html missing'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(d);
  });
}).listen(PORT, () => console.log('Critter Research Lab -> http://localhost:' + PORT));
