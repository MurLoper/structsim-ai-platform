import { readFileSync } from 'node:fs';
import { extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(projectRoot, 'src');
const strict = process.argv.includes('--strict');
const runtimeExtensions = new Set(['.ts', '.tsx']);
const excludedSegments = new Set(['locales', '__tests__', 'mocks', 'performance-test']);
const allowedFiles = new Set([
  'types/config.ts',
  'types/configGroups.ts',
  'types/order.ts',
  'types/user.ts',
  'types/platform.ts',
  'api/config/groups.ts',
  'api/results.ts',
]);

const stringWithChinesePattern =
  /(['"`])(?:(?!\1).)*[\u4e00-\u9fff](?:(?!\1).)*\1|>[^<]*[\u4e00-\u9fff][^<]*<|(label|placeholder|title|aria-label)=["{][^\n]*[\u4e00-\u9fff]/g;
const nativeDialogPattern = /window\.confirm|alert\(/g;

const stripComments = content =>
  content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const walk = dir => {
  const entries = [];
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      entries.push(...walk(path));
    } else {
      entries.push(path);
    }
  }
  return entries;
};

const shouldSkip = file => {
  const rel = relative(sourceRoot, file).replaceAll('\\', '/');
  return rel.split('/').some(segment => excludedSegments.has(segment));
};

const findings = walk(sourceRoot)
  .filter(file => runtimeExtensions.has(extname(file)))
  .filter(file => !shouldSkip(file))
  .map(file => {
    const rel = relative(sourceRoot, file).replaceAll('\\', '/');
    const content = stripComments(readFileSync(file, 'utf8'));
    return {
      rel,
      hardcodedText: content.match(stringWithChinesePattern)?.length ?? 0,
      nativeDialog: content.match(nativeDialogPattern)?.length ?? 0,
    };
  })
  .filter(item => item.hardcodedText > 0 || item.nativeDialog > 0)
  .sort((left, right) => {
    const leftTotal = left.hardcodedText + left.nativeDialog;
    const rightTotal = right.hardcodedText + right.nativeDialog;
    return rightTotal - leftTotal;
  });

const blockingFindings = findings.filter(item => !allowedFiles.has(item.rel));

if (findings.length === 0) {
  console.log('i18n scan passed: no hardcoded Chinese runtime text or native dialogs found.');
  process.exit(0);
}

console.log('i18n scan report:');
console.log(`- findings: ${findings.length}`);
console.log(`- allowlisted files: ${findings.length - blockingFindings.length}`);
console.log(`- candidate files in strict mode: ${blockingFindings.length}`);
console.log('');

for (const item of findings.slice(0, 30)) {
  const suffix = allowedFiles.has(item.rel) ? ' allowlisted' : '';
  console.log(
    `- ${item.rel}: text=${item.hardcodedText}, nativeDialog=${item.nativeDialog}${suffix}`
  );
}

if (strict && blockingFindings.length > 0) {
  process.exitCode = 1;
}
