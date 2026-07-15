const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const {spawn} = require('child_process');
const {pathToFileURL} = require('url');

const ROOT = path.resolve(__dirname,'..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const HTTP_URL = 'http://127.0.0.1:4175/saque-aniversario-fgts/';
const FILE_URL = pathToFileURL(path.join(ROOT,'saque-aniversario-fgts','index.html')).href;
const DEBUG_URL = 'http://127.0.0.1:9224';
const OUTPUT_DIR = path.join(ROOT,'data','operations','reports','end-to-end','migrate-calculator-saque-aniversario-fgts','visual');
const wait = (ms) => new Promise((resolve)=>setTimeout(resolve,ms));
const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};

function startServer(requestLog){
  const server=http.createServer((request,response)=>{
    const requestPath=decodeURIComponent(new URL(request.url,HTTP_URL).pathname);
    let filePath=path.resolve(ROOT,requestPath.replace(/^\/+/,''));
    if(!filePath.toLowerCase().startsWith(ROOT.toLowerCase())){requestLog.push({url:request.url,status:403});response.writeHead(403);response.end('Forbidden');return;}
    if(requestPath.endsWith('/'))filePath=path.join(filePath,'index.html');
    fs.readFile(filePath,(error,data)=>{if(error){requestLog.push({url:request.url,status:404});response.writeHead(404);response.end('Not found');return;}requestLog.push({url:request.url,status:200});response.writeHead(200,{'Content-Type':contentTypes[path.extname(filePath).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});response.end(data);});
  });
  return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4175,'127.0.0.1',()=>resolve(server));});
}

async function waitForDebug(){for(let attempt=0;attempt<80;attempt+=1){try{const response=await fetch(`${DEBUG_URL}/json/version`);if(response.ok)return;}catch(_){}await wait(250);}throw new Error('Edge debug endpoint did not start.');}

async function connect(events){
  const targets=await fetch(`${DEBUG_URL}/json/list`).then((response)=>response.json());
  const target=targets.find((item)=>item.type==='page');if(!target)throw new Error('No Edge page target.');
  const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let id=0;const pending=new Map();
  socket.addEventListener('message',(event)=>{const message=JSON.parse(event.data);if(!message.id){events.push(message);return;}if(!pending.has(message.id))return;const handlers=pending.get(message.id);pending.delete(message.id);if(message.error)handlers.reject(new Error(message.error.message));else handlers.resolve(message.result);});
  return{socket,send:(method,params={})=>new Promise((resolve,reject)=>{id+=1;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};
}

async function evaluate(send,expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||'Evaluation failed');return result.result.value;}
async function screenshot(send,name){const result=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(path.join(OUTPUT_DIR,`${name}.png`),Buffer.from(result.data,'base64'));}

async function inspectPage(send,url,width,height,mode,events,requestLog){
  const eventStart=events.length;const requestStart=requestLog.length;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768,screenWidth:width,screenHeight:height});
  await send('Page.navigate',{url});
  let result;
  for(let attempt=0;attempt<100;attempt+=1){
    await wait(100);
    result=await evaluate(send,`(async function(){
      if(document.fonts&&document.fonts.ready)await document.fonts.ready;
      var header=document.querySelector('.ct-global-logo__img');
      var footer=document.querySelector('.ct-global-footer__logo');
      var images=[...document.images].map(function(image){return{src:image.currentSrc||image.src,complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight}});
      var icons=[...document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]')];
      var iconResults=await Promise.all(icons.map(function(link){return new Promise(function(resolve){var image=new Image();var done=function(ok){resolve({href:link.href,loaded:ok,naturalWidth:image.naturalWidth})};image.onload=function(){done(image.naturalWidth>0)};image.onerror=function(){done(false)};image.src=link.href;setTimeout(function(){if(!image.complete)done(false)},1500)})}));
      return{ready:document.readyState,header:header&&{src:header.currentSrc||header.src,complete:header.complete,naturalWidth:header.naturalWidth},footer:footer&&{src:footer.currentSrc||footer.src,complete:footer.complete,naturalWidth:footer.naturalWidth},images:images,icons:iconResults,fontStatus:document.fonts?document.fonts.status:'unsupported',pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
    })()`);
    if(result&&result.ready==='complete'&&result.header&&result.footer&&result.header.complete&&result.footer.complete)break;
  }
  const localEvents=events.slice(eventStart);
  const networkErrors=localEvents.filter((event)=>event.method==='Network.responseReceived'&&Number(event.params?.response?.status)>=400&&/^(file:|http:\/\/127\.0\.0\.1:4175)/.test(event.params.response.url)).map((event)=>({url:event.params.response.url,status:event.params.response.status}));
  const loadFailures=localEvents.filter((event)=>event.method==='Network.loadingFailed'&&!event.params?.canceled).map((event)=>event.params?.errorText).filter(Boolean);
  const consoleErrors=localEvents.filter((event)=>event.method==='Runtime.exceptionThrown'||(event.method==='Log.entryAdded'&&event.params?.entry?.level==='error')).map((event)=>event.method);
  const server404=requestLog.slice(requestStart).filter((item)=>item.status===404);
  const allImagesValid=result.images.length>=6&&result.images.every((image)=>image.complete&&image.naturalWidth>0);
  const allIconsValid=result.icons.length===5&&result.icons.every((icon)=>icon.loaded&&icon.naturalWidth>0);
  const protocolPrefix=mode==='file'?'file:':'http://127.0.0.1:4175/';
  const valid=result.ready==='complete'&&result.header.naturalWidth>0&&result.footer.naturalWidth>0&&result.header.src.startsWith(protocolPrefix)&&result.footer.src.startsWith(protocolPrefix)&&allImagesValid&&allIconsValid&&result.fontStatus==='loaded'&&!result.pageOverflow&&networkErrors.length===0&&loadFailures.length===0&&consoleErrors.length===0&&server404.length===0;
  const viewport=width<768?'mobile':'desktop';
  await evaluate(send,'window.scrollTo(0,0);true');await wait(100);await screenshot(send,`asset-integrity-${mode}-${viewport}-header`);
  await evaluate(send,'document.querySelector(".ct-global-footer").scrollIntoView({block:"end"});window.scrollTo(0,window.scrollY);true');await wait(150);await screenshot(send,`asset-integrity-${mode}-${viewport}-footer`);
  return{mode,width,height,status:valid?'PASS':'FAIL',headerLogo:result.header,footerLogo:result.footer,images:{count:result.images.length,allValid:allImagesValid,items:result.images},icons:{count:result.icons.length,allValid:allIconsValid,items:result.icons},fonts:result.fontStatus,networkErrors,loadFailures,consoleErrors,server404,pageOverflow:result.pageOverflow};
}

async function run(){
  fs.mkdirSync(OUTPUT_DIR,{recursive:true});
  const requestLog=[];const events=[];const server=await startServer(requestLog);const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ct-edge-assets-'));const browser=spawn(EDGE,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9224',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});let socket;
  try{
    await waitForDebug();const connection=await connect(events);socket=connection.socket;const send=connection.send;await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Log.enable');
    const results=[];
    for(const [mode,url] of [['file',FILE_URL],['http',HTTP_URL]])for(const [width,height] of [[430,900],[1440,1000]])results.push(await inspectPage(send,url,width,height,mode,events,requestLog));
    const passed=results.every((item)=>item.status==='PASS');
    console.log(`PUBLIC_ASSET_INTEGRITY = ${passed?'PASS':'FAIL'}`);
    results.forEach((item)=>console.log(`${item.mode.toUpperCase()} ${item.width}: ${item.status}; HEADER_LOGO=${item.headerLogo.naturalWidth>0?'PASS':'FAIL'}; FOOTER_LOGO=${item.footerLogo.naturalWidth>0?'PASS':'FAIL'}; IMAGES=${item.images.allValid?'PASS':'FAIL'}; ICONS=${item.icons.allValid?'PASS':'FAIL'}; 404=${item.server404.length+item.networkErrors.length}`));
    if(!passed){console.log(JSON.stringify(results,null,2));process.exitCode=1;}
    return{status:passed?'PASS':'FAIL',results};
  }finally{
    if(socket)socket.close();browser.kill();await Promise.race([new Promise((resolve)=>browser.once('exit',resolve)),wait(2000)]);await new Promise((resolve)=>server.close(resolve));const tempRoot=path.resolve(os.tmpdir());if(path.dirname(path.resolve(profile)).toLowerCase()===tempRoot.toLowerCase()&&path.basename(profile).startsWith('ct-edge-assets-')){try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:250});}catch(error){console.warn(`Temporary profile cleanup warning: ${error.code}`);}}
  }
}

run().catch((error)=>{console.error(error);process.exitCode=1;});
