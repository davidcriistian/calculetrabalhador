const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = Object.freeze({
  rulesDir: 'data/rules',
  inssRules: 'data/rules/inss.json',
  aggregate: 'data/tabelas-trabalhistas.json'
});

const METHOD_MAP = Object.freeze({
  progressive: 'progressivo'
});

function readJson(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(raw);
}

function writeJson(relativePath, value) {
  const fullPath = path.join(ROOT, relativePath);
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function loadRuleSets(rulesDir = FILES.rulesDir) {
  return {
    inss: readJson(path.join(rulesDir, 'inss.json'))
  };
}

function assertNumber(value, fieldPath) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${fieldPath} deve ser numerico.`);
  }
}

function assertArray(value, fieldPath) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldPath} deve ser uma lista.`);
  }
}

function getCurrentRuleVersion(ruleSet) {
  if (!ruleSet || typeof ruleSet !== 'object') {
    throw new Error('data/rules/inss.json deve conter um objeto.');
  }

  const currentYear = ruleSet.currentYear;

  if (!currentYear) {
    throw new Error('data/rules/inss.json nao possui currentYear.');
  }

  const version = ruleSet.versions && ruleSet.versions[String(currentYear)];

  if (!version) {
    throw new Error(`data/rules/inss.json nao possui versions["${currentYear}"].`);
  }

  return version;
}

function mapCalculationMode(mode) {
  const mapped = METHOD_MAP[mode];

  if (!mapped) {
    throw new Error(`Modo de calculo INSS sem mapeamento de compatibilidade: ${mode}`);
  }

  return mapped;
}

function validateInssRules(ruleSet) {
  const version = getCurrentRuleVersion(ruleSet);

  assertNumber(version.minimumWage && version.minimumWage.value, 'minimumWage.value');
  assertNumber(version.inssCeiling && version.inssCeiling.value, 'inssCeiling.value');

  if (!version.clt || typeof version.clt !== 'object') {
    throw new Error('clt deve existir em data/rules/inss.json.');
  }

  mapCalculationMode(version.clt.calculationMode);
  assertArray(version.clt.progressiveTable, 'clt.progressiveTable');

  version.clt.progressiveTable.forEach((range, index) => {
    assertNumber(range.max, `clt.progressiveTable[${index}].max`);
    assertNumber(range.rate, `clt.progressiveTable[${index}].rate`);
  });

  return version;
}

function transformInss(ruleSet) {
  const version = validateInssRules(ruleSet);

  return {
    salarioMinimo: {
      valor: version.minimumWage.value
    },
    inss: {
      teto: version.inssCeiling.value,
      metodo: mapCalculationMode(version.clt.calculationMode),
      faixas: version.clt.progressiveTable.map((range) => ({
        ate: range.max,
        aliquota: range.rate,
        deducao: 0
      }))
    }
  };
}

function transformRules(ruleSets) {
  return {
    ...transformInss(ruleSets.inss)
  };
}

function applyInssToAggregate(aggregate, transformed) {
  return {
    ...aggregate,
    salarioMinimo: {
      ...(aggregate.salarioMinimo || {}),
      valor: transformed.salarioMinimo.valor
    },
    inss: {
      ...(aggregate.inss || {}),
      teto: transformed.inss.teto,
      metodo: transformed.inss.metodo,
      faixas: transformed.inss.faixas
    }
  };
}

function sameNumber(left, right) {
  return Object.is(left, right);
}

function compareRangeLimits(transformedRanges, aggregateRanges) {
  if (transformedRanges.length !== aggregateRanges.length) {
    return false;
  }

  return transformedRanges.every((range, index) => (
    sameNumber(range.ate, aggregateRanges[index].ate)
  ));
}

function compareRates(transformedRanges, aggregateRanges) {
  if (transformedRanges.length !== aggregateRanges.length) {
    return false;
  }

  return transformedRanges.every((range, index) => (
    sameNumber(range.aliquota, aggregateRanges[index].aliquota)
  ));
}

function compareInss(transformed, aggregate) {
  const transformedRanges = transformed.inss && Array.isArray(transformed.inss.faixas)
    ? transformed.inss.faixas
    : [];
  const aggregateRanges = aggregate.inss && Array.isArray(aggregate.inss.faixas)
    ? aggregate.inss.faixas
    : [];

  return [
    {
      label: 'Salario minimo',
      pass: sameNumber(
        transformed.salarioMinimo && transformed.salarioMinimo.valor,
        aggregate.salarioMinimo && aggregate.salarioMinimo.valor
      )
    },
    {
      label: 'Teto',
      pass: sameNumber(
        transformed.inss && transformed.inss.teto,
        aggregate.inss && aggregate.inss.teto
      )
    },
    {
      label: 'Faixas',
      pass: compareRangeLimits(transformedRanges, aggregateRanges)
    },
    {
      label: 'Aliquotas',
      pass: compareRates(transformedRanges, aggregateRanges)
    }
  ];
}

function validateInss(transformed, aggregate) {
  const checks = compareInss(transformed, aggregate);

  return {
    domain: 'INSS',
    checks,
    equivalent: checks.every((check) => check.pass)
  };
}

function buildGenerationPlan(ruleSets, aggregate) {
  const transformed = transformRules(ruleSets);
  const nextAggregate = applyInssToAggregate(aggregate, transformed);
  const beforeReport = validateInss(transformed, aggregate);
  const afterReport = validateInss(transformed, nextAggregate);

  return {
    transformed,
    nextAggregate,
    beforeReport,
    afterReport,
    changed: JSON.stringify(aggregate) !== JSON.stringify(nextAggregate)
  };
}

function printDomainReport(report) {
  console.log(report.domain);
  console.log('');

  for (const check of report.checks) {
    console.log(`${check.label}: ${check.pass ? 'PASS' : 'FAIL'}`);
  }

  console.log('');
  console.log('Resultado:');
  console.log(report.equivalent ? 'Equivalente ao agregador.' : 'Diferente do agregador.');
}

function printUsage() {
  console.log('Uso: node scripts/transform-rules.js [--check|--generate|--dry-run]');
  console.log('');
  console.log('Sem argumentos ou --check: valida se a regra INSS canonica esta sincronizada com o agregador.');
  console.log('--dry-run: calcula a geracao derivada sem escrever arquivos.');
  console.log('--generate: atualiza somente os campos derivados de INSS/salarioMinimo no agregador quando necessario.');
}

function runCheck() {
  try {
    const ruleSets = loadRuleSets();
    const aggregate = readJson(FILES.aggregate);
    const transformed = transformRules(ruleSets);
    const report = validateInss(transformed, aggregate);

    printDomainReport(report);
    return report.equivalent ? 0 : 1;
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    return 1;
  }
}

function runGenerate({ dryRun = false } = {}) {
  try {
    const ruleSets = loadRuleSets();
    const aggregate = readJson(FILES.aggregate);
    const plan = buildGenerationPlan(ruleSets, aggregate);

    if (!plan.afterReport.equivalent) {
      console.error('Erro: a geracao derivada nao produziu equivalencia INSS.');
      return 1;
    }

    printDomainReport(plan.beforeReport);
    console.log('');
    console.log('Geracao derivada INSS:');

    if (!plan.changed) {
      console.log('NO_CHANGE_REQUIRED');
      return 0;
    }

    if (dryRun) {
      console.log('CHANGE_REQUIRED');
      console.log('Dry run: nenhum arquivo foi alterado.');
      return 0;
    }

    writeJson(FILES.aggregate, plan.nextAggregate);
    console.log('UPDATED');
    return 0;
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    return 1;
  }
}

function runCli(args = process.argv.slice(2)) {
  if (args.length > 1) {
    printUsage();
    return 1;
  }

  const mode = args[0] || '--check';

  if (mode === '--help' || mode === '-h') {
    printUsage();
    return 0;
  }

  if (mode === '--check') {
    return runCheck();
  }

  if (mode === '--dry-run') {
    return runGenerate({ dryRun: true });
  }

  if (mode === '--generate') {
    return runGenerate();
  }

  console.error(`Erro: modo desconhecido: ${mode}`);
  printUsage();
  return 1;
}

if (require.main === module) {
  process.exitCode = runCli();
}

module.exports = {
  FILES,
  applyInssToAggregate,
  buildGenerationPlan,
  compareInss,
  loadRuleSets,
  mapCalculationMode,
  runCheck,
  runGenerate,
  transformInss,
  transformRules,
  validateInss,
  validateInssRules
};
