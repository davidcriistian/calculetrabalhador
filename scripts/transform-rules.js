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

function runCli() {
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

if (require.main === module) {
  process.exitCode = runCli();
}

module.exports = {
  FILES,
  compareInss,
  loadRuleSets,
  mapCalculationMode,
  transformInss,
  transformRules,
  validateInss,
  validateInssRules
};
