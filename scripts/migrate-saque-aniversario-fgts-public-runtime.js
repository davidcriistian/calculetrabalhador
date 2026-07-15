const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'saque-aniversario-fgts', 'index.html');

function run() {
  const html = fs.readFileSync(PAGE, 'utf8');
  const currentTag = '<script src="../assets/js/saque-aniversario-fgts.js"></script>';
  if (html.includes(currentTag) && !html.includes('function getRuleLegacy')) {
    console.log('NO_CHANGE_REQUIRED');
    return;
  }
  const startMarker = '<script src="/assets/js/tabelas-trabalhistas.js"></script>';
  const endMarker = '<script src="/assets/js/editorial-metadata.js" defer></script>';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('Legacy public runtime block not found.');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const replacement = [
    '<script src="../assets/js/tabelas-trabalhistas.js"></script>',
    '<script src="../assets/js/saque-aniversario-fgts.js"></script>',
    '<script src="../assets/js/editorial-metadata.js" defer></script>'
  ].join(eol + '  ');
  const migrated = html.slice(0, start) + replacement + html.slice(end + endMarker.length);
  if (migrated.includes('function getRuleLegacy')) throw new Error('Legacy authority remained in the migrated page.');
  fs.writeFileSync(PAGE, migrated, 'utf8');
  console.log('MIGRATED_PUBLIC_RUNTIME_BLOCK');
}

if (require.main === module) run();

module.exports = {run};
