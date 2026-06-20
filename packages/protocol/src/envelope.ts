import { z } from 'zod';

import { ActionableSchema, SourceKindSchema, UrgencySchema } from './enums.js';

/**
 * 内容。生のエージェント出力でもよく、人間可読への翻訳は OpenNagi 側で行う。
 */
export const WhatSchema = z.strictObject({
  title: z.string().min(1).meta({ description: '一目で分かる短い見出し' }),
  body: z.string().nullish().meta({ description: '詳細(任意)' }),
});
export type What = z.infer<typeof WhatSchema>;

/**
 * どの送り手が出したか。
 */
export const SourceRefSchema = z.strictObject({
  source_id: z.string().min(1).meta({ description: '送り手の識別子' }),
  kind: SourceKindSchema,
});
export type SourceRef = z.infer<typeof SourceRefSchema>;

/**
 * 受け口エンベロープ。
 *
 * 送り手は生の通知ではなく「文脈を添えたエンベロープ」を OpenNagi に投げる。
 * 中身は文脈4点(what / urgency / actionable / expiry)と、経路・同定のメタからなる。
 * RSS フェッチャも外部の送り手も、同じ受け口関数 `POST /intake` を通る。
 *
 * received_at は OpenNagi が受信時に自動付与するため、このエンベロープには含めない。
 * (protocol.md「受け口エンベロープ」)
 *
 * 未知のフィールドは strictObject で弾く。生成される JSON Schema の
 * additionalProperties:false と挙動を揃え、OpenAPI の 422 を本物にするため。
 */
export const IntakeEnvelopeSchema = z
  .strictObject({
    // --- 文脈4点 (concept.md の約束) ---
    what: WhatSchema,
    urgency: UrgencySchema,
    actionable: ActionableSchema,
    expiry: z.iso
      .datetime({ offset: true })
      .nullish()
      .meta({ description: 'いつまで有効か。期限切れは束ねる前に自動で黙殺できる。' }),

    // --- 経路と同定のメタ (システムを回すのに要る) ---
    source: SourceRefSchema,
    dedup_key: z.string().min(1).meta({
      description: '送り手内で一意な識別子。(source_id, dedup_key) で二重取り込みを防ぐ。',
    }),
    link: z.url().nullish().meta({ description: '元情報に掘るための URL' }),
    occurred_at: z.iso
      .datetime({ offset: true })
      .meta({ description: '出来事が起きた時刻(送り手基準)' }),
    recipient: z.string().min(1).meta({ description: 'どの利用者宛か' }),
    correlation_id: z
      .string()
      .min(1)
      .nullish()
      .meta({ description: '同一の事柄に関する複数の更新を束ねるためのキー(任意)' }),
    topic: z.string().min(1).nullish().meta({ description: '送り手が付ける分類ヒント(任意)' }),
  })
  .meta({
    description: 'OpenNagi 受け口エンベロープ',
    examples: [
      {
        source: { source_id: 'src_abc', kind: 'rss' },
        dedup_key: 'https://example.com/posts/123',
        what: { title: '新しい記事が公開されました', body: '...' },
        urgency: 'low',
        actionable: 'fyi',
        expiry: null,
        link: 'https://example.com/posts/123',
        occurred_at: '2026-06-16T08:00:00Z',
        recipient: 'user_xyz',
        correlation_id: null,
        topic: 'blog',
      },
    ],
  });
export type IntakeEnvelope = z.infer<typeof IntakeEnvelopeSchema>;

/**
 * エンベロープを検証して正規化する。受け口の単一の入口。
 * 失敗時は ZodError を投げる。安全に扱いたい場合は `IntakeEnvelopeSchema.safeParse` を使う。
 */
export function parseIntakeEnvelope(input: unknown): IntakeEnvelope {
  return IntakeEnvelopeSchema.parse(input);
}
