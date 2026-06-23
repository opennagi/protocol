import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { intakeJsonSchemaDocument } from './openapi.js';

const here = dirname(fileURLToPath(import.meta.url));
const committed = JSON.parse(readFileSync(resolve(here, '../schema/intake.schema.json'), 'utf8'));

describe('schema/intake.schema.json (配布する成果物)', () => {
  it('生成物と一致する（ズレたら pnpm gen:schema で更新する）', () => {
    expect(committed).toEqual(intakeJsonSchemaDocument());
  });
});
