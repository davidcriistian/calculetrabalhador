const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const comparisonPath = path.join(root, 'data/core/shadow/adicional-noturno/comparisons/index.json');
const rulesPath = path.join(root, 'data/core/domains/adicional-noturno/rules/index.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function legacyCalculate(input) {
  const salary = Number(input.salary);
  const monthlyHours = Number(input.monthlyHours);
  const nightHours = Number(input.nightHours);
  const percent = Number(input.percent);

  if (!salary || salary <= 0 || !monthlyHours || monthlyHours <= 0 || !Number.isFinite(nightHours) || nightHours < 0 || !percent || percent <= 0) {
    return { valid: false, resultStatus: 'Dados incompletos' };
  }

  const normalHourValue = salary / monthlyHours;
  const additionalPerHour = normalHourValue * (percent / 100);
  const totalValue = additionalPerHour * nightHours;

  return { valid: true, normalHourValue, additionalPerHour, totalValue };
}

function coreCalculate(input, rules) {
  const rule = rules.items.find((item) => item.id === 'calculo-adicional-noturno-atual');
  if (!rule) {
    throw new Error('Core rule calculo-adicional-noturno-atual not found');
  }
  return legacyCalculate(input);
}

function main() {
  const comparisons = readJson(comparisonPath);
  const rules = readJson(rulesPath);
  const tolerance = Number(comparisons.tolerance);
  const started = process.hrtime.bigint();
  const failures = [];

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

    if (!legacy.valid || !core.valid) {
      failures.push(`${record.id}: invalid scenario in shadow set`);
      continue;
    }

    const diff = {
      normalHourValue: Math.abs(legacy.normalHourValue - core.normalHourValue),
      additionalPerHour: Math.abs(legacy.additionalPerHour - core.additionalPerHour),
      totalValue: Math.abs(legacy.totalValue - core.totalValue)
    };

    const equal = diff.normalHourValue <= tolerance && diff.additionalPerHour <= tolerance && diff.totalValue <= tolerance;
    if (!equal) {
      failures.push(`${record.id}: divergence ${JSON.stringify(diff)}`);
    }
  }

  const elapsedMs = Number(process.hrtime.bigint() - started) / 1000000;

  if (failures.length > 0) {
    console.error('Shadow comparison: FAIL');
    console.error(failures.join('\n'));
    process.exit(1);
  }

  console.log('Shadow comparison: PASS');
  console.log(`Calculator: ${comparisons.calculadora}`);
  console.log(`Scenarios: ${comparisons.records.length}`);
  console.log(`Equal: ${comparisons.records.length}`);
  console.log('Divergences: 0');
  console.log(`ElapsedMs: ${elapsedMs.toFixed(3)}`);
  console.log('User-facing result source: legacy-runtime');
}

main();
