const CONFIG = Object.freeze({
  endpoint: 'https://api.indexnow.org/indexnow',
  host: 'calculetrabalhador.com.br',
  key: 'AD6E1D2A583449C7816E50E1D2B4BD17',
  keyLocation: 'https://calculetrabalhador.com.br/AD6E1D2A583449C7816E50E1D2B4BD17.txt',
  origin: 'https://calculetrabalhador.com.br',
  maxUrlsPerRequest: 10000
});

function normalizeUrl(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('URL vazia ou invalida.');
  }

  const raw = input.trim();
  const parsed = new URL(raw, `${CONFIG.origin}/`);

  if (parsed.hostname !== CONFIG.host) {
    throw new Error(`URL fora do dominio permitido: ${raw}`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`URL deve usar HTTPS: ${raw}`);
  }

  parsed.hash = '';
  return parsed.href;
}

function buildIndexNowPayload(urls) {
  if (!Array.isArray(urls)) {
    throw new Error('Informe uma lista de URLs.');
  }

  const normalizedUrls = [];
  const seen = new Set();

  for (const url of urls) {
    const normalized = normalizeUrl(url);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      normalizedUrls.push(normalized);
    }
  }

  if (normalizedUrls.length === 0) {
    throw new Error('Informe pelo menos uma URL valida.');
  }

  if (normalizedUrls.length > CONFIG.maxUrlsPerRequest) {
    throw new Error(`IndexNow aceita no maximo ${CONFIG.maxUrlsPerRequest} URLs por requisicao.`);
  }

  return {
    host: CONFIG.host,
    key: CONFIG.key,
    keyLocation: CONFIG.keyLocation,
    urlList: normalizedUrls
  };
}

async function submitIndexNowUrls(urls, options = {}) {
  const payload = buildIndexNowPayload(urls);
  const dryRun = options.dryRun !== false;

  if (dryRun) {
    return {
      dryRun: true,
      endpoint: CONFIG.endpoint,
      status: null,
      payload
    };
  }

  const fetchImpl = options.fetchImpl || globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch nao esta disponivel neste ambiente.');
  }

  const response = await fetchImpl(CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  const responseBody = await response.text();

  return {
    dryRun: false,
    endpoint: CONFIG.endpoint,
    status: response.status,
    ok: response.ok,
    responseBody,
    payload
  };
}

function parseCliArgs(argv) {
  const args = [...argv];
  const send = args.includes('--send');
  const help = args.includes('--help') || args.includes('-h');
  const urls = args.filter((arg) => arg !== '--send' && arg !== '--help' && arg !== '-h');

  return { send, help, urls };
}

function printUsage() {
  console.log('Uso: node scripts/indexnow.js [--send] <url-ou-caminho> [...mais-urls]');
  console.log('');
  console.log('Dry-run e o padrao. Use --send somente para notificar o IndexNow de verdade.');
  console.log('');
  console.log('Exemplos:');
  console.log('  node scripts/indexnow.js /blog/novo-artigo/');
  console.log('  node scripts/indexnow.js --send /blog/novo-artigo/ /calculadora-nova/');
}

function printResult(result) {
  console.log(`Mode: ${result.dryRun ? 'dry-run' : 'send'}`);
  console.log(`Endpoint: ${result.endpoint}`);
  console.log(`Host: ${result.payload.host}`);
  console.log(`Key location: ${result.payload.keyLocation}`);
  console.log(`URL count: ${result.payload.urlList.length}`);

  if (result.status !== null) {
    console.log(`HTTP status: ${result.status}`);
  }

  console.log('');
  console.log(JSON.stringify(result.payload, null, 2));
}

async function runCli(argv = process.argv.slice(2)) {
  const { send, help, urls } = parseCliArgs(argv);

  if (help) {
    printUsage();
    return 0;
  }

  try {
    const result = await submitIndexNowUrls(urls, { dryRun: !send });
    printResult(result);

    if (!result.dryRun && !result.ok) {
      return 1;
    }

    return 0;
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    return 1;
  }
}

if (require.main === module) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

module.exports = {
  CONFIG,
  buildIndexNowPayload,
  normalizeUrl,
  submitIndexNowUrls
};
