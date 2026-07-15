const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = Object.freeze({
  rulesDir: 'data/rules',
  inssRules: 'data/rules/inss.json',
  avisoPrevioRules: 'data/rules/aviso-previo.json',
  fgtsRules: 'data/rules/fgts.json',
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
    inss: readJson(path.join(rulesDir, 'inss.json')),
    avisoPrevio: readJson(path.join(rulesDir, 'aviso-previo.json')),
    fgts: readJson(path.join(rulesDir, 'fgts.json'))
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

function validateAvisoPrevioRules(ruleSet) {
  if (!ruleSet || ruleSet.ruleId !== 'aviso-previo' || ruleSet.version !== '1.0.0-rc.2') {
    throw new Error('Regra canonica de aviso previo desconhecida ou sem versao registrada.');
  }
  if (ruleSet.reviewStatus !== 'LEGAL_REVIEW_RESOLVED' || ruleSet.status !== 'candidate') {
    throw new Error('Regra de aviso previo ainda nao esta juridicamente reconciliada.');
  }
  const payload = ruleSet.projectionPayload;
  if (!payload || payload.ruleVersion !== ruleSet.version) {
    throw new Error('projectionPayload de aviso previo ausente ou fora de versao.');
  }
  [
    'baseDays', 'additionalDaysPerFullYear', 'maximumAdditionalDays', 'maximumTotalDays',
    'maximumWorkedDays', 'salaryDivisorDays', 'employeeResignationNoticeDays', 'employeeDiscountLimitDays'
  ].forEach((field) => assertNumber(payload[field], `avisoPrevio.projectionPayload.${field}`));
  if (payload.employeeResignationProportionality !== false || payload.proportionalExcessIsIndemnified !== true) {
    throw new Error('Branches juridicos reconciliados de aviso previo nao estao preservados.');
  }
  return payload;
}

function transformAvisoPrevio(ruleSet) {
  const payload = validateAvisoPrevioRules(ruleSet);
  return {
    ruleId: ruleSet.ruleId,
    ruleVersion: ruleSet.version,
    sourceProjectionFingerprint: 'd64857fa9777f45246637a88e0894ba658b0440e3edcc4708780832ac55eeb2a',
    updatedAt: ruleSet.lastReviewedAt,
    reviewStatus: ruleSet.reviewStatus,
    legalCorrectionPolicy: ruleSet.legalAssessment.principle,
    baseDays: payload.baseDays,
    additionalDaysPerFullYear: payload.additionalDaysPerFullYear,
    maximumAdditionalDays: payload.maximumAdditionalDays,
    maximumTotalDays: payload.maximumTotalDays,
    maximumWorkedDays: payload.maximumWorkedDays,
    salaryDivisorDays: payload.salaryDivisorDays,
    employeeResignationNoticeDays: payload.employeeResignationNoticeDays,
    employeeDiscountLimitDays: payload.employeeDiscountLimitDays,
    employerTerminationProportionality: payload.employerTerminationProportionality,
    employeeResignationProportionality: payload.employeeResignationProportionality,
    proportionalExcessIsIndemnified: payload.proportionalExcessIsIndemnified,
    presentation: ruleSet.presentation,
    diasBase: payload.baseDays,
    diasPorAnoCompleto: payload.additionalDaysPerFullYear,
    diasPorAno: payload.additionalDaysPerFullYear,
    limiteDias: payload.maximumTotalDays,
    diasDescontoPedidoDemissao: payload.employeeDiscountLimitDays,
    observacao: 'Projecao deterministica de aviso-previo@1.0.0-rc.2.'
  };
}

function validateFgtsSaqueAniversarioRules(ruleSet) {
  const rule = ruleSet && ruleSet.rules && ruleSet.rules.saqueAniversario;
  if (!ruleSet || ruleSet.domainId !== 'fgts' || !rule || rule.ruleId !== 'fgts.saque-aniversario') {
    throw new Error('Regra canonica de Saque-Aniversario FGTS ausente ou fora do dominio esperado.');
  }
  if (rule.status !== 'candidate' || rule.version !== '1.0.0-rc.1' || rule.reviewStatus !== 'LEGAL_REVIEW_RESOLVED') {
    throw new Error('Regra canonica de Saque-Aniversario FGTS desconhecida ou nao reconciliada.');
  }
  const payload = rule.projectionPayload;
  if (!payload || payload.ruleId !== rule.ruleId || payload.ruleVersion !== rule.version) {
    throw new Error('projectionPayload de Saque-Aniversario FGTS ausente ou fora de versao.');
  }
  assertArray(payload.bands, 'fgts.saqueAniversario.projectionPayload.bands');
  if (payload.bands.length !== 7) throw new Error('Saque-Aniversario FGTS deve possuir exatamente sete faixas.');
  payload.bands.forEach((band, index) => {
    assertNumber(band.lowerBound, `fgts.saqueAniversario.bands[${index}].lowerBound`);
    if (band.upperBound !== null) assertNumber(band.upperBound, `fgts.saqueAniversario.bands[${index}].upperBound`);
    assertNumber(band.rate, `fgts.saqueAniversario.bands[${index}].rate`);
    assertNumber(band.additionalAmount, `fgts.saqueAniversario.bands[${index}].additionalAmount`);
    if (band.order !== index + 1) throw new Error('Faixas de Saque-Aniversario FGTS fora de ordem.');
    if (index > 0 && band.lowerBound !== payload.bands[index - 1].upperBound) throw new Error('Lacuna ou sobreposicao nas faixas de Saque-Aniversario FGTS.');
  });
  const lastBand = payload.bands[6];
  if (lastBand.lowerBound !== 20000 || lastBand.lowerInclusive !== false || lastBand.upperBound !== null
    || lastBand.displayLabel !== 'Acima de R$ 20.000,00') {
    throw new Error('Ultima faixa de Saque-Aniversario FGTS representada incorretamente.');
  }
  return {rule, payload};
}

function transformFgtsSaqueAniversario(ruleSet) {
  const {rule, payload} = validateFgtsSaqueAniversarioRules(ruleSet);
  return {
    ruleId: rule.ruleId,
    ruleVersion: rule.version,
    sourceProjectionFingerprint: rule.fingerprint,
    updatedAt: rule.lastReviewedAt,
    reviewStatus: rule.reviewStatus,
    formula: payload.formula,
    rounding: payload.rounding,
    invalidBehavior: payload.invalidBehavior,
    faixas: payload.bands.map((band, index) => ({
      de: index === 0 ? 0 : Math.round((band.lowerBound + 0.01) * 100) / 100,
      ate: band.upperBound,
      aliquota: band.rate,
      percentual: band.rate * 100,
      parcelaAdicional: band.additionalAmount,
      rotulo: band.displayLabel
    }))
  };
}

function transformRules(ruleSets) {
  return {
    ...transformInss(ruleSets.inss),
    avisoPrevio: transformAvisoPrevio(ruleSets.avisoPrevio),
    saqueAniversario: transformFgtsSaqueAniversario(ruleSets.fgts)
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

function applyAvisoPrevioToAggregate(aggregate, transformed) {
  return {
    ...aggregate,
    avisoPrevio: transformed.avisoPrevio
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

function validateAvisoPrevio(transformed, aggregate) {
  const expected = transformed.avisoPrevio;
  const actual = aggregate.avisoPrevio;
  const fields = [
    'ruleId', 'ruleVersion', 'sourceProjectionFingerprint', 'updatedAt', 'reviewStatus',
    'legalCorrectionPolicy', 'baseDays', 'additionalDaysPerFullYear', 'maximumAdditionalDays',
    'maximumTotalDays', 'maximumWorkedDays', 'salaryDivisorDays',
    'employeeResignationNoticeDays', 'employeeDiscountLimitDays',
    'employerTerminationProportionality', 'employeeResignationProportionality',
    'proportionalExcessIsIndemnified'
  ];
  const checks = fields.map((field) => ({
    label: field,
    pass: actual && JSON.stringify(actual[field]) === JSON.stringify(expected[field])
  }));
  checks.push({ label: 'presentation', pass: actual && JSON.stringify(actual.presentation) === JSON.stringify(expected.presentation) });
  return { domain: 'AVISO PREVIO', checks, equivalent: checks.every((check) => check.pass) };
}

function validateFgtsSaqueAniversario(transformed, aggregate) {
  const expected = transformed.saqueAniversario;
  const actual = aggregate.saqueAniversario;
  const expectedBands = Array.isArray(expected && expected.faixas) ? expected.faixas : [];
  const actualBands = Array.isArray(actual && actual.faixas) ? actual.faixas : [];
  const sameBandField = (field) => expectedBands.length === actualBands.length
    && expectedBands.every((band, index) => JSON.stringify(band[field]) === JSON.stringify(actualBands[index][field]));
  const lastActualLabel = actualBands[6] && actualBands[6].rotulo;
  const checks = [
    {label:'Regra e versao canonicas internas', pass:expected.ruleId === 'fgts.saque-aniversario' && expected.ruleVersion === '1.0.0-rc.1'},
    {label:'Sete faixas', pass:expectedBands.length === 7 && actualBands.length === 7},
    {label:'Limites inferiores compativeis', pass:sameBandField('de')},
    {label:'Limites superiores', pass:sameBandField('ate')},
    {label:'Aliquotas', pass:sameBandField('aliquota')},
    {label:'Percentuais', pass:sameBandField('percentual')},
    {label:'Parcelas adicionais', pass:sameBandField('parcelaAdicional')},
    {label:'Rotulos 1 a 6', pass:expectedBands.slice(0, 6).every((band, index) => band.rotulo === actualBands[index].rotulo)},
    {label:'Ultima faixa canonica acima de R$ 20.000,00', pass:expectedBands[6] && expectedBands[6].rotulo === 'Acima de R$ 20.000,00'},
    {label:'Diferenca publica conhecida e restrita ao rotulo', pass:lastActualLabel === 'Acima de R$ 20.000,01' || lastActualLabel === 'Acima de R$ 20.000,00'}
  ];
  return {
    domain:'FGTS SAQUE-ANIVERSARIO',
    checks,
    equivalent:checks.every((check) => check.pass),
    publicConnectionStatus:'LEGACY_DECLARED_PENDING_MIGRATION',
    publicLabelCorrectionStatus:lastActualLabel === 'Acima de R$ 20.000,00'
      ? 'ALREADY_CORRECT'
      : 'APPROVED_REPRESENTATIONAL_CORRECTION_PENDING_PUBLIC_MIGRATION'
  };
}

function buildGenerationPlan(ruleSets, aggregate) {
  const transformed = transformRules(ruleSets);
  const nextAggregate = applyAvisoPrevioToAggregate(applyInssToAggregate(aggregate, transformed), transformed);
  const beforeReport = validateInss(transformed, aggregate);
  const afterReport = validateInss(transformed, nextAggregate);
  const avisoBeforeReport = validateAvisoPrevio(transformed, aggregate);
  const avisoAfterReport = validateAvisoPrevio(transformed, nextAggregate);
  const fgtsBeforeReport = validateFgtsSaqueAniversario(transformed, aggregate);
  const fgtsAfterReport = validateFgtsSaqueAniversario(transformed, nextAggregate);

  return {
    transformed,
    nextAggregate,
    beforeReport,
    afterReport,
    avisoBeforeReport,
    avisoAfterReport,
    fgtsBeforeReport,
    fgtsAfterReport,
    fgtsPublicProjectionWriteAuthorized: false,
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
  console.log('Sem argumentos ou --check: valida INSS, aviso previo e a equivalencia matematica interna do Saque-Aniversario FGTS.');
  console.log('--dry-run: calcula a geracao derivada sem escrever arquivos.');
  console.log('--generate: atualiza somente INSS/salarioMinimo e aviso previo; FGTS permanece bloqueado ate a migracao publica controlada.');
}

function runCheck() {
  try {
    const ruleSets = loadRuleSets();
    const aggregate = readJson(FILES.aggregate);
    const transformed = transformRules(ruleSets);
    const report = validateInss(transformed, aggregate);
    const avisoReport = validateAvisoPrevio(transformed, aggregate);
    const fgtsReport = validateFgtsSaqueAniversario(transformed, aggregate);

    printDomainReport(report);
    console.log('');
    printDomainReport(avisoReport);
    console.log('');
    printDomainReport(fgtsReport);
    console.log(`Conexao publica FGTS: ${fgtsReport.publicConnectionStatus}`);
    console.log(`Correcao de rotulo: ${fgtsReport.publicLabelCorrectionStatus}`);
    return report.equivalent && avisoReport.equivalent && fgtsReport.equivalent ? 0 : 1;
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

    if (!plan.afterReport.equivalent || !plan.avisoAfterReport.equivalent || !plan.fgtsAfterReport.equivalent) {
      console.error('Erro: a geracao derivada nao produziu equivalencia governada.');
      return 1;
    }

    printDomainReport(plan.beforeReport);
    console.log('');
    printDomainReport(plan.avisoBeforeReport);
    console.log('');
    printDomainReport(plan.fgtsBeforeReport);
    console.log(`Conexao publica FGTS: ${plan.fgtsBeforeReport.publicConnectionStatus}`);
    console.log(`Correcao de rotulo: ${plan.fgtsBeforeReport.publicLabelCorrectionStatus}`);
    console.log('');
    console.log('Geracao derivada INSS + Aviso Previo:');

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
  applyAvisoPrevioToAggregate,
  buildGenerationPlan,
  compareInss,
  loadRuleSets,
  mapCalculationMode,
  runCheck,
  runGenerate,
  transformInss,
  transformAvisoPrevio,
  transformFgtsSaqueAniversario,
  transformRules,
  validateInss,
  validateInssRules,
  validateAvisoPrevio,
  validateAvisoPrevioRules,
  validateFgtsSaqueAniversario,
  validateFgtsSaqueAniversarioRules
};
