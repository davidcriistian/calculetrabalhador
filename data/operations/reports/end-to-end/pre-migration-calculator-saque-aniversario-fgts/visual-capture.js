const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const {spawn} = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PAGE_URL = 'http://127.0.0.1:4174/saque-aniversario-fgts/';
const DEBUG_URL = 'http://127.0.0.1:9224';
const OUTPUT_DIR = path.join(__dirname, 'visual');
const OUTPUT_JSON = path.join(__dirname, 'visual-runtime-results.json');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const contentTypes = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};

function startServer() {
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, PAGE_URL).pathname);
    let filePath = path.resolve(ROOT, requestPath.replace(/^\/+/, ''));
    if (!filePath.toLowerCase().startsWith(ROOT.toLowerCase())) { response.writeHead(403); response.end('Forbidden'); return; }
    if (requestPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (error, data) => {
      if (error) { response.writeHead(404); response.end('Not found'); return; }
      response.writeHead(200, {'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store'});
      response.end(data);
    });
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(4174, '127.0.0.1', () => resolve(server)); });
}

async function waitForDebug() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { const response = await fetch(`${DEBUG_URL}/json/version`); if (response.ok) return; } catch (_) {}
    await wait(250);
  }
  throw new Error('Edge remote debugging endpoint did not start.');
}

async function connect() {
  const targets = await fetch(`${DEBUG_URL}/json/list`).then((response) => response.json());
  const target = targets.find((item) => item.type === 'page');
  if (!target) throw new Error('No Edge page target found.');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once:true}); socket.addEventListener('error', reject, {once:true}); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const handlers = pending.get(message.id); pending.delete(message.id);
    if (message.error) handlers.reject(new Error(message.error.message)); else handlers.resolve(message.result);
  });
  return {socket, send: (method, params = {}) => new Promise((resolve, reject) => { id += 1; pending.set(id, {resolve, reject}); socket.send(JSON.stringify({id, method, params})); })};
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {expression, awaitPromise:true, returnByValue:true});
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed.');
  return result.result.value;
}

async function screenshot(send, name) {
  const result = await send('Page.captureScreenshot', {format:'png', fromSurface:true, captureBeyondViewport:false});
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, {recursive:true});
  const server = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-edge-saque-aniversario-'));
  const browser = spawn(EDGE, ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9224',`--user-data-dir=${profile}`,'about:blank'], {stdio:'ignore', windowsHide:true});
  let socket;
  const audit = {version:'1.0.0', generatedAt:'2026-07-15', page:PAGE_URL, viewports:[], consoleErrors:[], status:'PASS'};
  try {
    await waitForDebug();
    const connection = await connect(); socket = connection.socket; const send = connection.send;
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', {source:'window.__preMigrationErrors=[];window.addEventListener("error",function(e){window.__preMigrationErrors.push(String(e.message||e.error||"error"))});window.addEventListener("unhandledrejection",function(e){window.__preMigrationErrors.push(String(e.reason||"rejection"))});'});
    const viewports = [['mobile',390,844],['tablet',768,1024],['desktop',1440,1000]];
    for (const [name,width,height] of viewports) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768,screenWidth:width,screenHeight:height});
      await send('Page.navigate',{url:PAGE_URL}); await wait(2200);
      const readiness = await evaluate(send,'({ready:document.readyState,bodyWidth:document.body.scrollWidth,viewport:innerWidth,runtime:!!window.CalculeTrabalhadorTabelas,rows:document.querySelectorAll("#fgts-rates-body tr").length})');
      if (readiness.ready !== 'complete' || !readiness.runtime || readiness.rows !== 7 || readiness.bodyWidth > readiness.viewport + 1) throw new Error(`${name} readiness failed: ${JSON.stringify(readiness)}`);
      await evaluate(send,'window.scrollTo(0,0);true'); await screenshot(send,`${name}-entry`);
      await evaluate(send,'document.querySelector("#balance").focus();document.querySelector("#balance").scrollIntoView({block:"center"});true'); await wait(150); await screenshot(send,`${name}-focus`);
      await evaluate(send,'document.querySelector("#balance").value="abc";document.querySelector("#balance").dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#empty-state").scrollIntoView({block:"center"});true'); await wait(150); await screenshot(send,`${name}-invalid-empty-state`);
      const result = await evaluate(send,'(async function(){var input=document.querySelector("#balance");input.value="100000";input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#birth-month").value="Julho";document.querySelector("#birth-month").dispatchEvent(new Event("change",{bubbles:true}));await new Promise(function(resolve){setTimeout(resolve,300)});document.querySelector("#results-grid").scrollIntoView({block:"center"});return{withdrawal:document.querySelector("#withdrawal").textContent,percentage:document.querySelector("#percentage").textContent,additional:document.querySelector("#additional").textContent,remaining:document.querySelector("#remaining").textContent,visible:!document.querySelector("#results-grid").hidden,emptyHidden:document.querySelector("#empty-state").hidden,month:document.querySelector("#month-info").textContent}})()');
      if (!result.visible || !result.emptyHidden || result.percentage !== '40%' || !/450,00/.test(result.withdrawal)) throw new Error(`${name} result failed: ${JSON.stringify(result)}`);
      await screenshot(send,`${name}-result`);
      await evaluate(send,'document.querySelector("#rates-title").scrollIntoView({block:"start"});true'); await wait(150); await screenshot(send,`${name}-rates-table`);
      await evaluate(send,'document.querySelector("#changes-title").scrollIntoView({block:"start"});true'); await wait(150); await screenshot(send,`${name}-editorial`);
      await evaluate(send,'document.querySelector("#faq-title").scrollIntoView({block:"start"});document.querySelector("#faq-title").nextElementSibling.open=true;true'); await wait(150); await screenshot(send,`${name}-faq`);
      const metrics = await evaluate(send,'({overflow:document.body.scrollWidth>innerWidth+1,bodyWidth:document.body.scrollWidth,viewport:innerWidth,errors:window.__preMigrationErrors,faqCount:document.querySelectorAll("section[aria-labelledby=faq-title] details").length,tableRows:document.querySelectorAll("#fgts-rates-body tr").length,explicitErrorNode:!!document.querySelector("[role=alert],.error,#form-error"),resultVisible:!document.querySelector("#results-grid").hidden})');
      audit.viewports.push({name,width,height,readiness,result,metrics,evidence:[`${name}-entry.png`,`${name}-focus.png`,`${name}-invalid-empty-state.png`,`${name}-result.png`,`${name}-rates-table.png`,`${name}-editorial.png`,`${name}-faq.png`]});
      audit.consoleErrors.push(...metrics.errors.map((message) => ({viewport:name,message})));
    }
    if (audit.consoleErrors.length || audit.viewports.some((item) => item.metrics.overflow)) throw new Error(`Visual audit errors: ${JSON.stringify(audit)}`);
    fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
    console.log('Saque-Aniversario visual audit: 3 viewports x 7 states PASS; no overflow; no runtime errors.');
  } finally {
    if (socket) socket.close(); browser.kill();
    await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), wait(2000)]);
    await new Promise((resolve) => server.close(resolve));
    try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:250}); } catch (error) { console.warn(`Temporary profile cleanup warning: ${error.code}`); }
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
