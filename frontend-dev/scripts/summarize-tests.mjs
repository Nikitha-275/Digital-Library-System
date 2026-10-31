// Builds a Markdown summary from the REAL Vitest JSON report and coverage summary.
// Usage: node scripts/summarize-tests.mjs [output-file]
// With no argument the Markdown is printed to stdout (CI appends it to the job summary).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const RESULTS = 'test-results/results.json';
const COVERAGE = 'coverage/coverage-summary.json';

const lines = [];

if (!existsSync(RESULTS)) {
  lines.push('### Frontend tests', '', '**No test report found.** The test run did not produce `test-results/results.json`.');
} else {
  const r = JSON.parse(readFileSync(RESULTS, 'utf8'));
  const skipped = (r.numPendingTests || 0) + (r.numTodoTests || 0);
  lines.push(
    '### Frontend test results',
    '',
    '| Total | Passed | Failed | Skipped |',
    '|---:|---:|---:|---:|',
    `| ${r.numTotalTests} | ${r.numPassedTests} | ${r.numFailedTests} | ${skipped} |`,
    '',
    `Test files: ${r.testResults.length} ` +
      `(${r.testResults.filter((f) => f.status === 'passed').length} passed, ` +
      `${r.testResults.filter((f) => f.status === 'failed').length} failed)`,
    '',
    '| Test file | Passed | Failed | Skipped |',
    '|---|---:|---:|---:|'
  );
  for (const f of r.testResults) {
    const a = f.assertionResults || [];
    const count = (s) => a.filter((t) => t.status === s).length;
    const name = f.name.split('/src/').pop();
    lines.push(`| src/${name} | ${count('passed')} | ${count('failed')} | ${count('pending') + count('skipped') + count('todo')} |`);
  }

  const failed = r.testResults.flatMap((f) => (f.assertionResults || []).filter((t) => t.status === 'failed'));
  if (failed.length) {
    lines.push('', '#### Failed tests', '');
    for (const t of failed) lines.push(`- ${t.fullName}`);
  }

  const skippedTests = r.testResults.flatMap((f) =>
    (f.assertionResults || []).filter((t) => ['pending', 'skipped', 'todo'].includes(t.status))
  );
  if (skippedTests.length) {
    lines.push(
      '',
      `#### Skipped tests (${skippedTests.length})`,
      '',
      'Skipped tests did NOT run and are not counted as passed. ' +
        'The live-backend contract tests are skipped until `API_TEST_URL` points at a running backend.'
    );
  }
}

if (existsSync(COVERAGE)) {
  const t = JSON.parse(readFileSync(COVERAGE, 'utf8')).total;
  lines.push(
    '',
    '### Code coverage (frontend)',
    '',
    '| Statements | Branches | Functions | Lines |',
    '|---:|---:|---:|---:|',
    `| ${t.statements.pct}% (${t.statements.covered}/${t.statements.total}) | ${t.branches.pct}% (${t.branches.covered}/${t.branches.total}) | ${t.functions.pct}% (${t.functions.covered}/${t.functions.total}) | ${t.lines.pct}% (${t.lines.covered}/${t.lines.total}) |`
  );
}

const md = lines.join('\n') + '\n';
const out = process.argv[2];
if (out) writeFileSync(out, md);
else process.stdout.write(md);
