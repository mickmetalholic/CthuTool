import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const coveragePath = join(process.cwd(), 'coverage', 'lcov.info');
const packageSourcePrefix = 'SF:src/';

const lcov = readFileSync(coveragePath, 'utf8');
const records = lcov
  .split('end_of_record')
  .map((record) => record.trim())
  .filter(Boolean)
  .map((record) => `${record}\nend_of_record\n`);

const keptRecords = records.filter((record) =>
  record.split(/\r?\n/).some((line) => line.startsWith(packageSourcePrefix)),
);

if (keptRecords.length === 0) {
  throw new Error('No package-owned CLI source coverage records were found.');
}

writeFileSync(coveragePath, keptRecords.join(''), 'utf8');

console.log(
  `[coverage] filtered lcov records: kept ${keptRecords.length}, removed ${
    records.length - keptRecords.length
  }.`,
);
