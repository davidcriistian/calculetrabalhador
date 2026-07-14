const fs = require('fs');
const path = require('path');

const DEBUG_URL = 'http://127.0.0.1:9222';
const PAGE_URL = 'http://127.0.0.1:4173/calculadora-reserva-financeira-pj/';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'data', 'operations', 'reports', 'end-to-end', 'deliver-calculator-calculadora-reserva-financeira-pj', 'visual');

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function connect() {
  const targets = await fetch(`${DEBUG_URL}/json/list`).then((response) => response.json());
  const target = targets.find((item) => item.type === 'page');
  if (!target) throw new Error('No Chrome page target found.');

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  return { socket, send };
}

async function captureCurrent(send, name, width, height) {
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.png`), Buffer.from(data, 'base64'));
  console.log(`${name}: ${width}x${height} PASS`);
}

async function capture(send, name, width, height, resultState) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
    screenWidth: width,
    screenHeight: height
  });
  await send('Page.navigate', { url: `${PAGE_URL}${resultState ? '?visual-test=result' : ''}` });
  await wait(3000);
  await captureCurrent(send, name, width, height);
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const { socket, send } = await connect();
  await send('Page.enable');
  const viewports = [
    ['small-mobile', 320, 800],
    ['large-mobile', 430, 900],
    ['intermediate', 768, 1024],
    ['desktop', 1440, 1000]
  ];
  for (const [name, width, height] of viewports) {
    await capture(send, `${name}-entry`, width, height, false);
    await send('Runtime.evaluate', { expression: "document.querySelector('#reserva-form').scrollIntoView({block:'start'})" });
    await wait(500);
    await captureCurrent(send, `${name}-form`, width, height);
    await send('Runtime.evaluate', { expression: "document.querySelector('#resultado-vazio').scrollIntoView({block:'center'})" });
    await wait(300);
    await captureCurrent(send, `${name}-empty-state`, width, height);
    await send('Runtime.evaluate', { expression: "['custosEmpresa','despesasPessoais','tributosMensais','outrosEssenciais'].forEach(id=>document.getElementById(id).value='0');document.querySelector('#reserva-form').requestSubmit();document.querySelector('#form-error').scrollIntoView({block:'center'})" });
    await wait(300);
    await captureCurrent(send, `${name}-error-state`, width, height);
    await capture(send, `${name}-result`, width, height, true);
    const actionCheck = await send('Runtime.evaluate', {
      expression: `(async()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{}},configurable:true});const copy=document.querySelector('#btnCopiar');copy.click();await new Promise(resolve=>setTimeout(resolve,100));const copied=/copiado/i.test(copy.textContent);let downloadName='';const originalClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){downloadName=this.download};document.querySelector('#btnBaixar').click();HTMLAnchorElement.prototype.click=originalClick;return{copied,downloadName}})()`,
      awaitPromise: true,
      returnByValue: true
    });
    const actions = actionCheck.result.value;
    if (!actions.copied || actions.downloadName !== 'reserva-financeira-pj.txt') throw new Error(`${name} action check failed: ${JSON.stringify(actions)}`);
    await send('Runtime.evaluate', { expression: "document.querySelector('#btnCopiar').scrollIntoView({block:'end'})" });
    await wait(500);
    await captureCurrent(send, `${name}-result-actions`, width, height);
  }
  socket.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
