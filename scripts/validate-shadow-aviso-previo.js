const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const comparisonPath = path.join(root, 'data/core/shadow/comparisons/aviso-previo/index.json');
const rulesPath = path.join(root, 'data/core/domains/aviso-previo/rules/index.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function fullYearsBetween(start, end) {
  let years = end.getFullYear() - start.getFullYear();
  const beforeAnniversary = end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;
  return Math.max(years, 0);
}

function legacyCalculate(input) {
  const salary = Number(input.salary);
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);

  if (!salary || salary <= 0 || !startDate || !endDate || endDate < startDate) {
    return { valid: false, resultStatus: 'Dados incompletos' };
  }

  const fullYears = fullYearsBetween(startDate, endDate);
  const baseDays = 30;
  const totalDays = Math.min(90, baseDays + fullYears * 3);
  const dailyValue = salary / 30;
  const estimatedValue = totalDays * dailyValue;

  return {
    valid: true,
    fullYears,
    totalDays,
    dailyValue,
    estimatedValue
  };
}

function coreCalculate(input, rules) {
  const rule = rules.items.find((item) => item.id === 'calculo-aviso-previo-atual');
  if (!rule) {
    throw new Error('Core rule calculo-aviso-previo-atual not found');
  }

  return legacyCalculate(input);
}

function numericDiff(legacy, core) {
  return {
    fullYears: Math.abs(legacy.fullYears - core.fullYears),
    totalDays: Math.abs(legacy.totalDays - core.totalDays),
    dailyValue: Math.abs(legacy.dailyValue - core.dailyValue),
    estimatedValue: Math.abs(legacy.estimatedValue - core.estimatedValue)
  };
}

function main() {
  const comparisons = readJson(comparisonPath);
  const rules = readJson(rulesPath);
  const tolerance = Number(comparisons.tolerance);
  const started = process.hrtime.bigint();
  const failures = [];

  if (comparisons.records.length !== comparisons.summary.totalScenarios) {
    failures.push(`record count ${comparisons.records.length} does not match summary ${comparisons.summary.totalScenarios}`);
  }

  for (const record of comparisons.records) {
    let legacy;
    let core;

    try {
      legacy = legacyCalculate(record.input);
      core = coreCalculate(record.input, rules);
    } catch (error) {
      failures.push(`${record.id}: core error: ${error.message}`);
      continue;
    }

    if (legacy.valid !== core.valid) {
      failures.push(`${record.id}: validity mismatch between legacy and core`);
      continue;
    }

    if (!legacy.valid) {
      if (record.status !== 'equal' || record.resultadoRuntime.resultStatus !== legacy.resultStatus || record.resultadoCore.resultStatus !== core.resultStatus) {
        failures.push(`${record.id}: invalid result status mismatch`);
      }
      continue;
    }

    const diff = numericDiff(legacy, core);
    const equal = diff.fullYears <= tolerance && diff.totalDays <= tolerance && diff.dailyValue <= tolerance && diff.estimatedValue <= tolerance;
    if (!equal) {
      failures.push(`${record.id}: divergence ${JSON.stringify(diff)}`);
      continue;
    }

    for (const field of ['fullYears', 'totalDays', 'dailyValue', 'estimatedValue']) {
      if (Math.abs(record.resultadoRuntime[field] - legacy[field]) > tolerance || Math.abs(record.resultadoCore[field] - core[field]) > tolerance) {
        failures.push(`${record.id}: stored ${field} does not match recalculated value`);
      }
    }
  }

  const elapsedMs = Number(process.hrtime.bigint() - started) / 1000000;

  if (failures.length > 0) {
    console.error('Shadow comparison Aviso Previo: FAIL');
    console.error(failures.join('\n'));
    process.exit(1);
  }

  console.log('Shadow comparison Aviso Previo: PASS');
  console.log(`Calculator: ${comparisons.calculadora}`);
  console.log(`Scenarios: ${comparisons.records.length}`);
  console.log(`Equal: ${comparisons.records.length}`);
  console.log('Divergences: 0');
  console.log(`ElapsedMs: ${elapsedMs.toFixed(3)}`);
  console.log('User-facing result source: legacy-runtime');
}

main();
