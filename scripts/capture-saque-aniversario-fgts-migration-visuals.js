const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const {spawn} = require('child_process');
const {pathToFileURL} = require('url');

const ROOT = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PAGE_URL = 'http://127.0.0.1:4173/saque-aniversario-fgts/';
const AVISO_URL = 'http://127.0.0.1:4173/calculadora-aviso-previo/';
const FILE_URL = pathToFileURL(path.join(ROOT, 'saque-aniversario-fgts', 'index.html')).href;
const DEBUG_URL = 'http://127.0.0.1:9222';
const OUTPUT_DIR = path.join(ROOT, 'data', 'operations', 'reports', 'end-to-end', 'migrate-calculator-saque-aniversario-fgts', 'visual');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const contentTypes = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.xml':'application/xml'};

function startServer() {
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, PAGE_URL).pathname);
    let filePath = path.resolve(ROOT, requestPath.replace(/^\/+/, ''));
    if (!filePath.toLowerCase().startsWith(ROOT.toLowerCase())) { response.writeHead(403); response.end('Forbidden'); return; }
    if (requestPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (error, data) => {
      if (error) { response.writeHead(404); response.end('Not found'); return; }
      response.writeHead(200, {'Content-Type':contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream','Cache-Control':'no-store'});
      response.end(data);
    });
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(4173, '127.0.0.1', () => resolve(server)); });
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
  return {socket, send:(method, params={}) => new Promise((resolve, reject) => { id += 1; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); })};
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed.');
  return result.result.value;
}

async function screenshot(send, name) {
  const result = await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  fs.writeFileSync(path.join(OUTPUT_DIR,`${name}.png`),Buffer.from(result.data,'base64'));
}

async function navigate(send, url, width, height) {
  const requestedVisualState=new URL(url).searchParams.get('visual-test');
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768,screenWidth:width,screenHeight:height});
  await send('Page.navigate',{url});
  let state;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await wait(100);
    state = await evaluate(send, '({ready:document.readyState,bodyWidth:document.body?document.body.scrollWidth:0,documentWidth:document.documentElement?document.documentElement.scrollWidth:0,viewport:innerWidth,helper:!!window.CalculeTrabalhadorTabelas,runtime:!!window.calculateSaqueAniversarioPage,source:window.CalculeTrabalhadorSaqueAniversarioDiagnostics&&window.CalculeTrabalhadorSaqueAniversarioDiagnostics.ruleSource,assets:(function(){var h=document.querySelector(".ct-global-logo__img"),f=document.querySelector(".ct-global-footer__logo");return !!h&&!!f&&h.complete&&f.complete&&h.naturalWidth>0&&f.naturalWidth>0})()})');
    if (state.ready === 'complete' && state.helper && state.runtime && state.source && state.source !== 'pending' && (requestedVisualState==='report'||state.assets)) break;
  }
  if (!state || state.ready !== 'complete' || !state.helper || !state.runtime || Math.max(state.bodyWidth,state.documentWidth) > state.viewport + 1 || state.source === 'pending' || (requestedVisualState!=='report'&&!state.assets)) throw new Error(`Render readiness/overflow/assets failed: ${JSON.stringify(state)}`);
  const visualState=requestedVisualState;
  if(visualState==='result'){
    let resultReady=false;
    for(let attempt=0;attempt<80;attempt+=1){await wait(100);resultReady=await evaluate(send,'!!document.querySelector("#result-content")&&!document.querySelector("#result-content").hidden&&document.querySelector("#withdrawal").textContent!=="R$ 0,00"');if(resultReady)break;}
    if(!resultReady)throw new Error('Visual result state did not render.');
    await evaluate(send,'var section=document.querySelector("#result-content");window.scrollTo(0,Math.max(0,section.getBoundingClientRect().top+window.scrollY-160));true');await wait(150);
    return;
  }
  if(visualState==='report'){
    let reportReady=false;
    for(let attempt=0;attempt<80;attempt+=1){await wait(100);reportReady=await evaluate(send,'!document.querySelector("nav")&&document.body.innerText.includes("Relatorio do Saque Aniversario FGTS")&&document.body.innerText.includes("Memoria de calculo")');if(reportReady)break;}
    if(!reportReady)throw new Error('Visual adaptive report state did not render.');
    await evaluate(send,'window.scrollTo(0,0);true');await wait(100);
    return;
  }
  await evaluate(send,'window.scrollTo(0,0);true');
  await wait(100);
}

async function navigateReference(send, url, width, height) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768,screenWidth:width,screenHeight:height});
  await send('Page.navigate',{url});
  let state;
  for(let attempt=0;attempt<100;attempt+=1){
    await wait(100);
    state=await evaluate(send,'({ready:document.readyState,width:document.documentElement.scrollWidth,viewport:innerWidth,canonical:!!document.querySelector("[aria-label=Breadcrumb]")&&!!document.querySelector("a[href=\\"#simulador\\"]")})');
    if(state.ready==='complete'&&state.canonical)break;
  }
  if(!state||state.ready!=='complete'||!state.canonical||state.width>state.viewport+1)throw new Error(`Reference readiness failed: ${JSON.stringify(state)}`);
  await evaluate(send,'window.scrollTo(0,0);true');await wait(150);
}

async function captureComparison(send, mode, width, height, leftName, rightName) {
  const base='http://127.0.0.1:4173/data/operations/reports/end-to-end/migrate-calculator-saque-aniversario-fgts/visual/';
  const html='<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#e2e8f0;font-family:Arial,sans-serif;color:#0f172a}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;height:860px}figure{margin:0;min-width:0;background:white;border:1px solid #cbd5e1;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,.12)}figcaption{height:50px;padding:15px 18px;background:#0f172a;color:white;font-weight:800}img{display:block;width:100%;height:810px;object-fit:contain;object-position:top;background:white}</style></head><body><div class="grid"><figure><figcaption>Aviso Previo — padrao aprovado</figcaption><img src="'+base+leftName+'"></figure><figure><figcaption>FGTS — migracao corrigida</figcaption><img src="'+base+rightName+'"></figure></div></body></html>';
  const temporaryPath=path.join(OUTPUT_DIR,`comparison-${mode}-temporary.html`);
  fs.writeFileSync(temporaryPath,html,'utf8');
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:height});
  await send('Page.navigate',{url:base+path.basename(temporaryPath)});await wait(800);
  const ready=await evaluate(send,'({images:[...document.images].every(function(image){return image.complete&&image.naturalWidth>0}),overflow:document.documentElement.scrollWidth<=innerWidth+1})');
  if(!ready.images||!ready.overflow)throw new Error(`${mode} comparison failed: ${JSON.stringify(ready)}`);
  await screenshot(send,`comparison-${mode}`);
  fs.unlinkSync(temporaryPath);
}

function expectedFor(balance) {
  const bands = [
    [500,50,0,'Até R$ 500,00'],[1000,40,50,'R$ 500,01 a R$ 1.000,00'],
    [5000,30,150,'R$ 1.000,01 a R$ 5.000,00'],[10000,20,650,'R$ 5.000,01 a R$ 10.000,00'],
    [15000,15,1150,'R$ 10.000,01 a R$ 15.000,00'],[20000,10,1900,'R$ 15.000,01 a R$ 20.000,00'],
    [Infinity,5,2900,'Acima de R$ 20.000,00']
  ];
  const [,,percentage,additional,label] = [0,...bands.find((item) => balance <= item[0])];
  const withdrawal = Math.round((balance * percentage / 100 + additional + Number.EPSILON) * 100) / 100;
  return {percentage,additional,label,withdrawal,remaining:Math.round((balance-withdrawal+Number.EPSILON)*100)/100};
}

async function submitBalance(send, balance, id) {
  const expected = expectedFor(balance);
  const rendered = await evaluate(send, `(async function(){
    var value=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(${balance});
    document.querySelector('#balance').value=value;
    document.querySelector('#birth-month').value='Julho';
    document.querySelector('#calculator-form').requestSubmit();
    await new Promise(function(resolve){setTimeout(resolve,120)});
    return {
      visible:!document.querySelector('#result-content').hidden,
      withdrawal:document.querySelector('#withdrawal').textContent,
      percentage:document.querySelector('#percentage').textContent,
      additional:document.querySelector('#additional').textContent,
      band:document.querySelector('#band-result').textContent,
      remaining:document.querySelector('#remaining').textContent,
      memory:document.querySelectorAll('#memory-list li').length,
      rows:document.querySelectorAll('#result-table tr').length,
      rateRows:document.querySelectorAll('#fgts-rates-body tr').length,
      error:document.querySelector('#form-error').textContent,
      visibleText:document.body.innerText,
      diagnostics:window.CalculeTrabalhadorSaqueAniversarioDiagnostics,
      scrollX:window.scrollX,
      documentWidth:document.documentElement.scrollWidth,
      viewport:innerWidth
    };
  })()`);
  const money = (value) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value).replace(/\u00a0/g,' ');
  const normalize = (value) => String(value).replace(/\u00a0/g,' ');
  const leak = /(fingerprint|stale state|Registry|Publishing|projecao governada|regra canonica|fixtures|cenarios reconciliados)/i.test(rendered.visibleText);
  if (!rendered.visible || normalize(rendered.withdrawal)!==money(expected.withdrawal) || rendered.percentage!==`${expected.percentage}%` || normalize(rendered.additional)!==money(expected.additional) || rendered.band!==expected.label || normalize(rendered.remaining)!==money(expected.remaining) || rendered.memory!==7 || rendered.rows!==6 || rendered.rateRows!==7 || rendered.error || leak || rendered.documentWidth>rendered.viewport+1 || rendered.scrollX!==0) {
    throw new Error(`${id} rendered calculation failed: ${JSON.stringify({...rendered,visibleText:undefined,expected})}`);
  }
  return rendered;
}

async function submitInvalid(send, value, expectedText, id) {
  const rendered = await evaluate(send, `(async function(){document.querySelector('#clear-button').click();document.querySelector('#balance').value=${JSON.stringify(value)};document.querySelector('#calculator-form').requestSubmit();await new Promise(function(resolve){setTimeout(resolve,80)});return{error:document.querySelector('#form-error').textContent,errorHidden:document.querySelector('#form-error').hidden,resultHidden:document.querySelector('#result-content').hidden,emptyVisible:!document.querySelector('#empty-state').hidden};})()`);
  if (rendered.errorHidden || !rendered.resultHidden || !rendered.emptyVisible || rendered.error !== expectedText) throw new Error(`${id} invalid-state failed: ${JSON.stringify(rendered)}`);
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR,{recursive:true});
  const server = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(),'ct-edge-fgts-'));
  const browser = spawn(EDGE,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9222',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
  let socket;
  try {
    await waitForDebug();
    const connection = await connect(); socket=connection.socket; const send=connection.send;
    await send('Page.enable');
    await navigate(send,FILE_URL,430,900);
    const fileResult=await submitBalance(send,20000.01,'file-derived-fallback');
    if(fileResult.diagnostics.ruleSource!=='governed-derived-fallback'||fileResult.diagnostics.staleState!=='SYNCED'||fileResult.diagnostics.legacyFallbackActive!==false)throw new Error(`file:// governed fallback failed: ${JSON.stringify(fileResult.diagnostics)}`);
    const fileActions=await evaluate(send,'(async function(){Object.defineProperty(navigator,"clipboard",{value:{writeText:async function(){}},configurable:true});var copy=document.querySelector("#btn-copy");copy.click();await new Promise(function(resolve){setTimeout(resolve,80)});var copied=/copiado/i.test(copy.textContent);var downloadName="";var originalClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){downloadName=this.download};document.querySelector("#btn-download").click();HTMLAnchorElement.prototype.click=originalClick;var printHtml="";var originalOpen=window.open;window.open=function(){return{document:{open:function(){},write:function(value){printHtml=value},close:function(){}}}};document.querySelector("#btn-print").click();window.open=originalOpen;return{copied:copied,downloadName:downloadName,printed:printHtml.includes("Relatorio do Saque Aniversario FGTS")&&printHtml.includes("@page")}})()');
    if(!fileActions.copied||fileActions.downloadName!=='relatorio-saque-aniversario-fgts.pdf'||!fileActions.printed)throw new Error(`file:// actions failed: ${JSON.stringify(fileActions)}`);

    await navigate(send,PAGE_URL,430,900);
    const balances=[500,500.01,1000,1000.01,5000,5000.01,10000,10000.01,15000,15000.01,20000,20000.01,123.45,100000];
    for (const balance of balances) await submitBalance(send,balance,`balance-${balance}`);
    await submitInvalid(send,'','Informe o saldo para fazer a simulacao.','empty');
    await submitInvalid(send,'abc','Digite um valor valido.','invalid');
    await submitInvalid(send,'R$ 0,00','Informe um saldo maior que zero.','zero');
    const diagnostics=await evaluate(send,'window.CalculeTrabalhadorSaqueAniversarioDiagnostics');
    if(diagnostics.ruleSource!=='governed-aggregate-json'||diagnostics.staleState!=='SYNCED'||diagnostics.legacyFallbackActive!==false)throw new Error(`HTTP governed source failed: ${JSON.stringify(diagnostics)}`);
    const publicLayers=await evaluate(send,'({footer:!!document.querySelector(".ct-global-footer"),rates:!!document.querySelector("#rates-title"),faq:!!document.querySelector("#faq-title"),links:!!document.querySelector("#links-title"),balanceLabel:!!document.querySelector("label[for=balance]"),monthLabel:!!document.querySelector("label[for=birth-month]")})');
    if(!Object.values(publicLayers).every(Boolean))throw new Error(`Public footer/editorial/accessibility layers failed: ${JSON.stringify(publicLayers)}`);
    await evaluate(send,'document.querySelector("#balance").focus();true');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
    const keyboardTarget=await evaluate(send,'document.activeElement&&document.activeElement.id');
    if(keyboardTarget!=='birth-month')throw new Error(`Keyboard journey failed: expected birth-month, received ${keyboardTarget}`);

    const viewports=[['small-mobile',320,800],['large-mobile',430,900],['tablet',768,1024],['desktop',1440,1000]];
    for(const [name,width,height] of viewports){
      await navigate(send,PAGE_URL,width,height); await screenshot(send,`${name}-entry`);
      await evaluate(send,'document.querySelector("#calculator-form").scrollIntoView({block:"start"});document.querySelector("#balance").focus();true'); await wait(150); await screenshot(send,`${name}-form-focus`);
      await evaluate(send,'document.querySelector("#empty-state").scrollIntoView({block:"center"});true'); await wait(100); await screenshot(send,`${name}-empty-state`);
      await evaluate(send,'document.querySelector("#balance").value="R$ 0,00";document.querySelector("#calculator-form").requestSubmit();document.querySelector("#form-error").scrollIntoView({block:"center"});true'); await wait(150); await screenshot(send,`${name}-error-state`);
      await navigate(send,`${PAGE_URL}?visual-test=result`,width,height); await screenshot(send,`${name}-result`);
      const runtime=await evaluate(send,'window.testarCalculadoraSaqueAniversario()'); if(runtime.passed!==14||runtime.total!==14)throw new Error(`${name} runtime test failed: ${JSON.stringify(runtime)}`);
      const actions=await evaluate(send,'(async function(){Object.defineProperty(navigator,"clipboard",{value:{writeText:async function(){}},configurable:true});var copy=document.querySelector("#btn-copy");copy.click();await new Promise(function(resolve){setTimeout(resolve,80)});var copied=/copiado/i.test(copy.textContent);var downloadName="";var originalClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){downloadName=this.download};document.querySelector("#btn-download").click();HTMLAnchorElement.prototype.click=originalClick;var printHtml="";var originalOpen=window.open;window.open=function(){return{document:{open:function(){},write:function(value){printHtml=value},close:function(){}}}};document.querySelector("#btn-print").click();window.open=originalOpen;return{copied:copied,downloadName:downloadName,printed:printHtml.includes("Relatorio do Saque Aniversario FGTS")&&printHtml.includes("@page"),slotHidden:document.querySelector("#CANONICAL_RESULT_RECOMMENDATION_SLOT").hidden,overflow:document.body.scrollWidth<=innerWidth+1}})()');
      if(!actions.copied||actions.downloadName!=='relatorio-saque-aniversario-fgts.pdf'||!actions.printed||!actions.slotHidden||!actions.overflow)throw new Error(`${name} action check failed: ${JSON.stringify(actions)}`);
      await evaluate(send,'document.querySelector("#btn-copy").scrollIntoView({block:"end"});true'); await wait(120); await screenshot(send,`${name}-result-actions`);
      await navigate(send,`${PAGE_URL}?visual-test=report`,width,height); await screenshot(send,`${name}-adaptive-report`);
      const report=await evaluate(send,'({a4:document.querySelector("style").textContent.includes("@page"),noNavigation:!document.querySelector("nav"),selectable:document.body.innerText.includes("Valor estimado do saque")&&document.body.innerText.includes("Memoria de calculo"),overflow:document.body.scrollWidth<=innerWidth+1})');
      if(!report.a4||!report.noNavigation||!report.selectable||!report.overflow)throw new Error(`${name} report check failed: ${JSON.stringify(report)}`);
    }
    await navigateReference(send,AVISO_URL,1440,1000);await screenshot(send,'comparison-desktop-aviso-approved-source');
    await navigateReference(send,AVISO_URL,430,900);await screenshot(send,'comparison-mobile-aviso-approved-source');
    await captureComparison(send,'desktop',1440,900,'comparison-desktop-aviso-approved-source.png','desktop-entry.png');
    await captureComparison(send,'mobile',960,900,'comparison-mobile-aviso-approved-source.png','large-mobile-entry.png');
    console.log('Saque Aniversario runtime: file:// governed derived fallback PASS; HTTP governed aggregate JSON PASS');
    console.log('Saque Aniversario rendered form cases: 14 valid + empty/invalid/zero PASS');
    console.log('Saque Aniversario footer/editorial layers and keyboard journey: PASS');
    console.log('Saque Aniversario visual matrix: 4 viewports x 7 states = 28 PNG PASS');
    console.log('Canonical family comparisons: desktop + mobile PASS');
  } finally {
    if(socket)socket.close(); browser.kill(); await Promise.race([new Promise((resolve)=>browser.once('exit',resolve)),wait(2000)]); await new Promise((resolve)=>server.close(resolve));
    const tempRoot=path.resolve(os.tmpdir());
    if(path.dirname(path.resolve(profile)).toLowerCase()===tempRoot.toLowerCase()&&path.basename(profile).startsWith('ct-edge-fgts-')){try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:250});}catch(error){console.warn(`Temporary Edge profile cleanup warning: ${error.code}`);}}
  }
}

run().catch((error)=>{console.error(error);process.exitCode=1;});
