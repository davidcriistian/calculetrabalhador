const fs = require('fs');
const path = require('path');
const {legacyCalculate} = require('./validate-aviso-previo-canonical-rule');

const root = path.resolve(__dirname, '..');
const baselinePath = path.join(root, 'data/operations/reports/end-to-end/pre-migration-calculator-aviso-previo/shadow-baseline-60-scenarios.json');
const rulePath = path.join(root, 'data/rules/aviso-previo.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const baseline = readJson(baselinePath);
  const rule = readJson(rulePath);
  const failures = [];
  const started = process.hrtime.bigint();

  if (baseline.scenarios.length !== 60) failures.push(`expected 60 historical scenarios, received ${baseline.scenarios.length}`);
  for (const scenario of baseline.scenarios) {
    const actual = legacyCalculate(scenario.inputs, rule);
    const expected = {
      resultCurrent: scenario.resultCurrent,
      components: scenario.components,
      rounding: scenario.rounding,
      message: scenario.message,
      outputFinal: scenario.outputFinal
    };
    if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${scenario.scenarioId}: historical expectation changed`);
  }

  const elapsedMs = Number(process.hrtime.bigint() - started) / 1000000;
  if (failures.length) {
    console.error('Shadow comparison Aviso Previo: FAIL');
    console.error(failures.join('\n'));
    process.exit(1);
  }

  console.log('Shadow comparison Aviso Previo: PASS');
  console.log('Classification: LEGACY_BEHAVIOR_BASELINE');
  console.log('Scenarios: 60');
  console.log('Recorded: 60');
  console.log('Historical expectation mutations: 0');
  console.log(`ElapsedMs: ${elapsedMs.toFixed(3)}`);
  console.log('Historical evidence source: frozen legacy runtime');
  console.log('Active user-facing authority: none (shadow is not a runtime consumer)');
  console.log('Normative legal authority: false');
}

main();
