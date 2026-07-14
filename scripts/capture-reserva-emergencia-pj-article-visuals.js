const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PAGE_URL = 'http://127.0.0.1:4173/blog/como-montar-uma-reserva-de-emergencia-sendo-pj/';
const DEBUG_URL = 'http://127.0.0.1:9222';
const OUTPUT_DIR = path.join(ROOT, 'data', 'operations', 'reports', 'end-to-end', 'deliver-article-reserva-emergencia-pj', 'visual');
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
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(4173, '127.0.0.1', () => resolve(server)); });
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
async function screenshot(send, name) {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const server = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-edge-article-reserva-pj-'));
  const browser = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=9222', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let socket;
  try {
    await waitForDebug();
    const connection = await connect(); socket = connection.socket; const send = connection.send;
    await send('Page.enable');
    const viewports = [['small-mobile', 320, 800], ['large-mobile', 430, 900], ['intermediate', 768, 1024], ['desktop', 1440, 1000]];
    const states = [['entry', 'window.scrollTo(0,0)'], ['summary-toc', 'document.querySelector("#sumario-title").scrollIntoView({block:"start"})'], ['table-cta', 'document.querySelector("#base-mensal").scrollIntoView({block:"start"})'], ['example-plan', 'document.querySelector("#exemplo").scrollIntoView({block:"start"})'], ['faq', 'document.querySelector("#faq-title").scrollIntoView({block:"start"})'], ['sources-footer', 'document.querySelector("#fontes-title").scrollIntoView({block:"start"})']];
    for (const [name, width, height] of viewports) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768, screenWidth: width, screenHeight: height });
      await send('Page.navigate', { url: PAGE_URL });
      await wait(2500);
      const ready = await evaluate(send, '({ready:document.readyState,h1:document.querySelectorAll("h1").length,bodyWidth:document.body.scrollWidth,viewport:innerWidth,header:!!document.querySelector("#global-header header"),footer:!!document.querySelector("#global-footer footer"),faq:document.querySelectorAll("details").length})');
      if (ready.ready !== 'complete' || ready.h1 !== 1 || ready.faq !== 14 || !ready.header || !ready.footer || ready.bodyWidth > ready.viewport + 1) throw new Error(`${name} readiness/overflow failed: ${JSON.stringify(ready)}`);
      for (const [state, expression] of states) {
        await evaluate(send, `${expression};true`); await wait(250); await screenshot(send, `${name}-${state}`);
      }
    }
    console.log('Reserva de emergência PJ visual matrix: 4 viewports × 6 sections PASS');
  } finally {
    if (socket) socket.close();
    browser.kill();
    await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), wait(2000)]);
    await new Promise((resolve) => server.close(resolve));
    const tempRoot = path.resolve(os.tmpdir());
    if (path.dirname(path.resolve(profile)).toLowerCase() === tempRoot.toLowerCase() && path.basename(profile).startsWith('ct-edge-article-reserva-pj-')) {
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }); } catch (error) { console.warn(`Temporary profile cleanup warning: ${error.code}`); }
    }
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
