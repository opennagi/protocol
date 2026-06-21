import { z } from 'zod';

import { IntakeEnvelopeSchema } from './envelope.js';

/**
 * 受け口エンベロープの JSON Schema(OpenAPI 3.1 が前提とする 2020-12)。
 * server 側はこれを `@hono/zod-openapi` の出力に合流させる。
 */
export function intakeEnvelopeJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(IntakeEnvelopeSchema, { target: 'draft-2020-12' }) as Record<
    string,
    unknown
  >;
  // components.schemas に埋めるので、トップの $schema は落としておく。
  delete schema.$schema;
  // 取り込み先（server の contract/intake.schema.json 等）で手編集されないよう、
  // 生成物である旨を $comment として冒頭に残す（JSON Schema の注釈キーで検証には影響しない）。
  return {
    $comment:
      'GENERATED from @opennagi/protocol (Zod IntakeEnvelopeSchema). Do not edit by hand; edit the protocol source and regenerate.',
    ...schema,
  };
}

/**
 * 受け口エンベロープの「自己完結した」JSON Schema ドキュメント。
 *
 * `intakeEnvelopeJsonSchema` は埋め込み用に `$schema` を落とすが、こちらは
 * `$schema` と安定した `$id` を付けた単体配布用。server(Go) は TS を実行できないため、
 * これを `scripts/gen-schema.mjs` でファイルに吐き、`contract/intake.schema.json` として
 * 取り込んで適合テストに使う。(build-plan.md Phase 1)
 */
export function intakeJsonSchemaDocument(): Record<string, unknown> {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://opennagi.com/schema/intake.schema.json',
    title: 'IntakeEnvelope',
    ...intakeEnvelopeJsonSchema(),
  };
}

/**
 * `POST /intake` の OpenAPI 3.1 片。
 *
 * これは契約の根であって完全な spec ではない。server の api がこの片を取り込み、
 * Source の CRUD や読み取り API と合流させて、最終的な OpenAPI を吐く。
 * (build-plan.md Phase 1)
 */
export function intakeOpenApiFragment(): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    paths: {
      '/intake': {
        post: {
          operationId: 'intake',
          summary: '受け口にエンベロープを投げる',
          description:
            '文脈を添えたエンベロープを受け、Notification を pending で保存する。' +
            'RSS フェッチャも外部の送り手も同じこの口を通る。',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IntakeEnvelope' },
              },
            },
          },
          responses: {
            '202': { description: '受理。Notification を pending で保存した。' },
            '409': {
              description: '(source_id, dedup_key) が重複。二重取り込みを無視した。',
            },
            '422': { description: 'エンベロープがスキーマに合わない。' },
          },
        },
      },
    },
    components: {
      schemas: {
        IntakeEnvelope: intakeEnvelopeJsonSchema(),
      },
    },
  };
}
