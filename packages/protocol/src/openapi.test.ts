import { describe, expect, it } from 'vitest';

import { intakeEnvelopeJsonSchema, intakeOpenApiFragment } from './openapi.js';

describe('intakeOpenApiFragment', () => {
  it('POST /intake を持つ', () => {
    const fragment = intakeOpenApiFragment();
    const paths = fragment.paths as Record<string, unknown>;
    expect(paths['/intake']).toBeDefined();
  });

  it('IntakeEnvelope スキーマを components に持つ', () => {
    const fragment = intakeOpenApiFragment();
    const components = fragment.components as { schemas: Record<string, unknown> };
    expect(components.schemas.IntakeEnvelope).toBeDefined();
  });
});

describe('intakeEnvelopeJsonSchema', () => {
  it('object 型で、文脈4点を必須に持つ', () => {
    const schema = intakeEnvelopeJsonSchema() as {
      type: string;
      required: string[];
      properties: Record<string, unknown>;
    };
    expect(schema.type).toBe('object');
    expect(schema.required).toEqual(
      expect.arrayContaining(['what', 'urgency', 'actionable', 'source', 'dedup_key']),
    );
    expect(schema.properties.what).toBeDefined();
  });

  it('埋め込み用に $schema を落としている', () => {
    expect('$schema' in intakeEnvelopeJsonSchema()).toBe(false);
  });
});
