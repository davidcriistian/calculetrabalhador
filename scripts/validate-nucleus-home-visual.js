const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PAGE_URL = 'http://127.0.0.1:4174/';
const DEBUG_URL = 'http://127.0.0.1:9223';
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function startServer() {
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, PAGE_URL).pathname);
    let filePath = path.resolve(ROOT, requestPath.replace(/^\/+/, ''));
    if (!filePath.toLowerCase().startsWith(ROOT.toLowerCase())) { response.writeHead(403); response.end('Forbidden'); return; }
    if (requestPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (error, data) => {
      if (error) { response.writeHead(404); response.end('Not found'); return; }
      response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(data);
    });
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(4174, '127.0.0.1', () => resolve(server)); });
}

async function waitForDebug() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(`${DEBUG_URL}/json/version`); if (response.ok) return; } catch (error) { /* browser starting */ }
    await wait(250);
  }
  throw new Error('Edge remote debugging endpoint did not start.');
}

async function connect() {
  const targets = await fetch(`${DEBUG_URL}/json/list`).then((response) => response.json());
  const target = targets.find((item) => item.type === 'page');
  if (!target) throw new Error('No Edge page target found.');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const handlers = pending.get(message.id); pending.delete(message.id);
    if (message.error) handlers.reject(new Error(message.error.message)); else handlers.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { id += 1; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  return { socket, send };
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed.');
  return result.result.value;
}

async function run() {
  if (!fs.existsSync(EDGE)) throw new Error('Microsoft Edge is not available.');
  const nuclei = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'brain', 'nuclei.json'), 'utf8')).items || [];
  const pjNucleus = nuclei.find((item) => item.id === 'pj');
  const expectedPjCount = pjNucleus && pjNucleus.articleFilter && Array.isArray(pjNucleus.articleFilter.slugs)
    ? pjNucleus.articleFilter.slugs.length
    : 0;
  const mobileLimit = pjNucleus.homeSection.responsivePresentation.mobile.itemLimit;
  const desktopLimit = pjNucleus.homeSection.responsivePresentation.desktop.itemLimit;
  const server = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-edge-nucleus-home-'));
  const browser = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=9223', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let socket;
  const results = [];
  try {
    await waitForDebug();
    const connection = await connect(); socket = connection.socket; const send = connection.send;
    await send('Page.enable');
    const viewports = [['narrow-mobile', 320, 800], ['common-mobile', 430, 900], ['tablet', 768, 1024], ['desktop', 1440, 1000]];
    for (const [name, width, height] of viewports) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768, screenWidth: width, screenHeight: height });
      await send('Page.navigate', { url: PAGE_URL });
      await wait(2500);
      const metrics = await evaluate(send, `(() => {
        const section = document.querySelector('[data-section-id="nucleus-articles-pj"]');
        const clt = document.querySelector('[data-section-id="nucleus-articles-clt"]');
        const grid = section && section.querySelector('.ct-nucleus-article-grid');
        const cards = grid ? [...grid.querySelectorAll('.ct-article-anchor')] : [];
        const visibleCards = cards.filter((card) => getComputedStyle(card).display !== 'none');
        const style = grid ? getComputedStyle(grid) : null;
        return {
          ready: document.documentElement.dataset.homeRefactorV8,
          sectionCount: document.querySelectorAll('[data-section-type="NUCLEUS_ARTICLE_SECTION"]').length,
          pj: !!section,
          clt: !!clt,
          isolatedGuideCard: !!document.querySelector('[data-guide-asset-id]'),
          oldHeading: document.body.innerText.includes('Guias por tema'),
          allCards: cards.length,
          visibleCards: visibleCards.length,
          hrefs: visibleCards.map((card) => card.getAttribute('href')),
          viewAll: section && section.querySelector('.ct-article-all').getAttribute('href'),
          gridAutoFlow: style && style.gridAutoFlow,
          overflowX: style && style.overflowX,
          horizontalScrollable: grid ? grid.scrollWidth > grid.clientWidth + 1 : false,
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          footer: !!document.querySelector('.ct-footer')
        };
      })()`);
      const mobileOrTablet = width <= 840;
      const valid = metrics.ready === 'ready'
        && metrics.sectionCount === 2
        && metrics.pj && metrics.clt
        && !metrics.isolatedGuideCard && !metrics.oldHeading
        && metrics.allCards === expectedPjCount
        && metrics.visibleCards === Math.min(mobileOrTablet ? mobileLimit : desktopLimit, expectedPjCount)
        && metrics.viewAll === '/blog/categoria/pj/'
        && (mobileOrTablet ? metrics.gridAutoFlow === 'column' && metrics.overflowX === 'auto' && metrics.horizontalScrollable : metrics.gridAutoFlow !== 'column' && !metrics.horizontalScrollable)
        && !metrics.pageOverflow && metrics.footer;
      results.push({ name, width, height, mode: mobileOrTablet ? 'CAROUSEL' : 'GRID', status: valid ? 'PASS' : 'FAIL', metrics });
    }

    await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 1000 });
    for (const [name, blockedUrl, expectedState] of [
      ['articles-catalog-failure', '*data/articles.json*', 'degraded'],
      ['nuclei-catalog-failure', '*data/brain/nuclei.json*', 'ready']
    ]) {
      await send('Network.setBlockedURLs', { urls: [blockedUrl] });
      await send('Page.navigate', { url: PAGE_URL });
      await wait(2500);
      const metrics = await evaluate(send, `({
        state: document.documentElement.dataset.homeRefactorV8,
        header: !!document.querySelector('.ct-header'),
        tools: document.querySelectorAll('.ct-tool-card').length,
        nucleusSections: document.querySelectorAll('[data-section-type="NUCLEUS_ARTICLE_SECTION"]').length,
        footer: !!document.querySelector('.ct-footer'),
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1
      })`);
      const valid = metrics.state === expectedState && metrics.header && metrics.tools > 0 && metrics.nucleusSections === 0 && metrics.footer && !metrics.pageOverflow;
      results.push({ name, width: 1440, height: 1000, mode: 'FAIL_SAFE', status: valid ? 'PASS' : 'FAIL', metrics });
    }
    await send('Network.setBlockedURLs', { urls: [] });
    const desktop = results.find((item) => item.name === 'desktop');
    for (const result of results.filter((item) => item.mode === 'CAROUSEL')) {
      if (desktop && JSON.stringify(result.metrics.hrefs) !== JSON.stringify(desktop.metrics.hrefs.slice(0, 6))) result.status = 'FAIL';
    }
    const report = { status: results.every((item) => item.status === 'PASS') ? 'PASS' : 'FAIL', browser: 'Microsoft Edge headless', results };
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== 'PASS') process.exitCode = 1;
  } finally {
    if (socket) socket.close();
    browser.kill();
    await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), wait(2000)]);
    await new Promise((resolve) => server.close(resolve));
    const tempRoot = path.resolve(os.tmpdir());
    if (path.dirname(path.resolve(profile)).toLowerCase() === tempRoot.toLowerCase() && path.basename(profile).startsWith('ct-edge-nucleus-home-')) {
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }); } catch (error) { console.warn(`Temporary profile cleanup warning: ${error.code}`); }
    }
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
