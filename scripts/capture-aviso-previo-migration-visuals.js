const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const {spawn} = require('child_process');
const {pathToFileURL} = require('url');

const ROOT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PAGE_URL = 'http://127.0.0.1:4173/calculadora-aviso-previo/';
const FILE_URL = pathToFileURL(path.join(ROOT, 'calculadora-aviso-previo', 'index.html')).href;
const DEBUG_URL = 'http://127.0.0.1:9222';
const OUTPUT_DIR = path.join(ROOT, 'data', 'operations', 'reports', 'end-to-end', 'migrate-calculator-calculadora-aviso-previo', 'visual');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const contentTypes = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.xml':'application/xml; charset=utf-8'};

function startServer() {
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, PAGE_URL).pathname);
    let filePath = path.resolve(ROOT, requestPath.replace(/^\/+/, ''));
    if (!filePath.toLowerCase().startsWith(ROOT.toLowerCase())) { response.writeHead(403); response.end('Forbidden'); return; }
    if (requestPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (error, data) => { if (error) { response.writeHead(404); response.end('Not found'); return; } response.writeHead(200, {'Content-Type':contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream','Cache-Control':'no-store'}); response.end(data); });
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(4173, '127.0.0.1', () => resolve(server)); });
}

async function waitForDebug() { for (let attempt = 0; attempt < 60; attempt += 1) { try { const response = await fetch(`${DEBUG_URL}/json/version`); if (response.ok) return; } catch (_) {} await wait(250); } throw new Error('Edge remote debugging endpoint did not start.'); }
async function connect() {
  const targets = await fetch(`${DEBUG_URL}/json/list`).then((response) => response.json());
  const target = targets.find((item) => item.type === 'page'); if (!target) throw new Error('No Edge page target found.');
  const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once:true}); socket.addEventListener('error', reject, {once:true}); });
  let id = 0; const pending = new Map();
  socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const handlers = pending.get(message.id); pending.delete(message.id); if (message.error) handlers.reject(new Error(message.error.message)); else handlers.resolve(message.result); });
  return {socket, send:(method, params={}) => new Promise((resolve, reject) => { id += 1; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); })};
}
async function evaluate(send, expression) { const result = await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true}); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed.'); return result.result.value; }
async function screenshot(send, name) { const result = await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false}); fs.writeFileSync(path.join(OUTPUT_DIR,`${name}.png`),Buffer.from(result.data,'base64')); }
async function navigate(send, url, width, height) { await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768,screenWidth:width,screenHeight:height}); await send('Page.navigate',{url}); await wait(2600); const ready=await evaluate(send,'({ready:document.readyState,bodyWidth:document.body.scrollWidth,viewport:innerWidth,rule:!!window.CalculeTrabalhadorTabelas})'); if(ready.ready!=='complete'||ready.bodyWidth>ready.viewport+1||!ready.rule)throw new Error(`Render readiness/overflow failed: ${JSON.stringify(ready)}`); await evaluate(send,'window.scrollTo(0,0);true'); await wait(100); }
async function runRenderedScenario(send, scenario) {
  const result = await evaluate(send, `(async function(){
    document.querySelector('#salary').value=${JSON.stringify(String(scenario.salary))};
    document.querySelector('#start-date').value=${JSON.stringify(scenario.startDate)};
    document.querySelector('#end-date').value=${JSON.stringify(scenario.endDate)};
    document.querySelector('#notice-type').value=${JSON.stringify(scenario.noticeType)};
    document.querySelector('#calculator-form').requestSubmit();
    await new Promise(function(resolve){setTimeout(resolve,250)});
    return {
      resultVisible:!document.querySelector('#resultado').classList.contains('hidden'),
      totalDays:document.querySelector('#total-days').textContent,
      workedDays:document.querySelector('#worked-days').textContent,
      indemnifiedDays:document.querySelector('#indemnified-days').textContent,
      discountDays:document.querySelector('#discount-days').textContent,
      proportionalDays:document.querySelector('#additional-days').textContent,
      estimatedValue:document.querySelector('#estimated-value').textContent,
      memoryItems:document.querySelectorAll('#memory-list li').length,
      error:document.querySelector('#form-error').textContent,
      diagnostics:window.__CalculeAvisoPrevioDiagnostics,
      visibleText:document.body.innerText
    };
  })()`);
  const leaks = /aviso-previo@|regra ativa|projeção governada|revisão jurídica resolvida|cenários reconciliados|fingerprint|stale state|Registry|Publishing/i.test(result.visibleText);
  if (!result.resultVisible || result.totalDays !== `${scenario.totalDays} dias` || result.workedDays !== `${scenario.workedDays} dias` || result.indemnifiedDays !== `${scenario.indemnifiedDays} dias` || result.discountDays !== `${scenario.discountDays} dias` || result.proportionalDays !== `${scenario.proportionalDays} dias` || result.estimatedValue.replace(/\s/g,' ') !== scenario.estimatedValue || result.memoryItems < 6 || leaks) {
    throw new Error(`${scenario.id} rendered calculation failed: ${JSON.stringify({...result,visibleText:undefined})}`);
  }
  return result;
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR,{recursive:true}); const server=await startServer(); const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ct-edge-aviso-')); const browser=spawn(EDGE,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9222',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true}); let socket;
  try {
    await waitForDebug(); const connection=await connect(); socket=connection.socket; const send=connection.send; await send('Page.enable');
    const scenarios=[
      {id:'employer-proportional',salary:3000,startDate:'2020-01-01',endDate:'2025-01-01',noticeType:'indenizado',totalDays:45,workedDays:0,indemnifiedDays:45,discountDays:0,proportionalDays:15,estimatedValue:'R$ 4.500,00'},
      {id:'employee-resignation-correction',salary:3000,startDate:'2020-01-01',endDate:'2025-01-01',noticeType:'desconto',totalDays:30,workedDays:0,indemnifiedDays:0,discountDays:30,proportionalDays:0,estimatedValue:'R$ 3.000,00'},
      {id:'worked-proportional-correction',salary:3000,startDate:'2020-01-01',endDate:'2025-01-01',noticeType:'trabalhado',totalDays:45,workedDays:30,indemnifiedDays:15,discountDays:0,proportionalDays:15,estimatedValue:'R$ 4.500,00'}
    ];
    await navigate(send,FILE_URL,430,900);
    const fileResult=await runRenderedScenario(send,scenarios[0]);
    if(fileResult.diagnostics.ruleSource!=='governed-derived-fallback')throw new Error(`file:// did not use the governed derived fallback: ${JSON.stringify(fileResult.diagnostics)}`);
    await navigate(send,PAGE_URL,430,900);
    for(const scenario of scenarios)await runRenderedScenario(send,scenario);
    const httpDiagnostics=await evaluate(send,'window.__CalculeAvisoPrevioDiagnostics');
    if(httpDiagnostics.ruleSource!=='governed-aggregate-json')throw new Error(`HTTP did not consume governed aggregate JSON: ${JSON.stringify(httpDiagnostics)}`);
    const viewports=[['small-mobile',320,800],['large-mobile',430,900],['intermediate',768,1024],['desktop',1440,1000]];
    for(const [name,width,height] of viewports){
      await navigate(send,PAGE_URL,width,height); await screenshot(send,`${name}-entry`);
      await evaluate(send,'document.querySelector("#calculator-form").scrollIntoView({block:"start"});document.querySelector("#salary").focus();true'); await wait(250); await screenshot(send,`${name}-form-focus`);
      await evaluate(send,'document.querySelector("#resultado-vazio").scrollIntoView({block:"center"});true'); await wait(200); await screenshot(send,`${name}-empty-state`);
      await evaluate(send,'document.querySelector("#salary").value="0";document.querySelector("#start-date").value="2020-01-01";document.querySelector("#end-date").value="2024-01-01";document.querySelector("#calculator-form").requestSubmit();document.querySelector("#form-error").scrollIntoView({block:"center"});true'); await wait(250); await screenshot(send,`${name}-error-state`);
      await navigate(send,`${PAGE_URL}?visual-test=result`,width,height); await screenshot(send,`${name}-result`);
      const runtime=await evaluate(send,'window.testarCalculadoraAvisoPrevio()'); if(runtime.passed!==runtime.total)throw new Error(`${name} runtime test failed: ${JSON.stringify(runtime)}`);
      const actions=await evaluate(send,'(async function(){Object.defineProperty(navigator,"clipboard",{value:{writeText:async function(){}},configurable:true});var copy=document.querySelector("#btn-copy");copy.click();await new Promise(function(resolve){setTimeout(resolve,100)});var copied=/copiado/i.test(copy.textContent);var downloadName="";var originalClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){downloadName=this.download};document.querySelector("#btn-download").click();HTMLAnchorElement.prototype.click=originalClick;var printHtml="";var originalOpen=window.open;window.open=function(){return{document:{open:function(){},write:function(value){printHtml=value},close:function(){}}}};document.querySelector("#btn-print").click();window.open=originalOpen;return{copied:copied,downloadName:downloadName,printed:printHtml.includes("Relatório de Aviso Prévio")&&printHtml.includes("@page"),slotHidden:document.querySelector("#CANONICAL_RESULT_RECOMMENDATION_SLOT").hidden,overflow:document.body.scrollWidth<=innerWidth+1}})()');
      if(!actions.copied||actions.downloadName!=='relatorio-aviso-previo.pdf'||!actions.printed||!actions.slotHidden||!actions.overflow)throw new Error(`${name} action check failed: ${JSON.stringify(actions)}`);
      await evaluate(send,'document.querySelector("#btn-copy").scrollIntoView({block:"end"});true'); await wait(250); await screenshot(send,`${name}-result-actions`);
      await navigate(send,`${PAGE_URL}?visual-test=report`,width,height); await screenshot(send,`${name}-adaptive-report`);
      const report=await evaluate(send,'({a4:document.querySelector("style").textContent.includes("@page"),noNavigation:!document.querySelector("nav"),selectable:document.body.innerText.includes("Dias totais"),overflow:document.body.scrollWidth<=innerWidth+1})'); if(!report.a4||!report.noNavigation||!report.selectable||!report.overflow)throw new Error(`${name} report check failed: ${JSON.stringify(report)}`);
    }
    console.log('Aviso Previo local runtime: file:// governed derived fallback PASS; HTTP governed aggregate JSON PASS');
    console.log('Aviso Previo rendered scenarios: employer proportional, employee resignation correction and worked proportional correction PASS');
    console.log('Aviso Previo visual matrix: 4 viewports x entry/form/empty/error/result/actions/report PASS');
  } finally {
    if(socket)socket.close(); browser.kill(); await Promise.race([new Promise((resolve)=>browser.once('exit',resolve)),wait(2000)]); await new Promise((resolve)=>server.close(resolve)); const tempRoot=path.resolve(os.tmpdir()); if(path.dirname(path.resolve(profile)).toLowerCase()===tempRoot.toLowerCase()&&path.basename(profile).startsWith('ct-edge-aviso-')){try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:250});}catch(error){console.warn(`Temporary Edge profile cleanup warning: ${error.code}`);}}
  }
}
run().catch((error)=>{console.error(error);process.exitCode=1;});
