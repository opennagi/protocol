// 受け口エンベロープの正規 JSON Schema を schema/intake.schema.json に書き出す。
// server(Go) はこのファイルを contract/intake.schema.json として取り込む。
// 使い方: pnpm --filter @opennagi/protocol gen:schema
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { intakeJsonSchemaDocument } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../schema');
const outFile = resolve(outDir, 'intake.schema.json');

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, `${JSON.stringify(intakeJsonSchemaDocument(), null, 2)}\n`);

console.log(`wrote ${outFile}`);
