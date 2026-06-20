import { describe, expect, it } from 'vitest';

import { IntakeEnvelopeSchema, parseIntakeEnvelope } from './envelope.js';

/** protocol.md の例そのもの。最小の妥当なエンベロープの基準点。 */
const validEnvelope = {
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
};

describe('IntakeEnvelope', () => {
  it('protocol.md の例を受理する', () => {
    const parsed = parseIntakeEnvelope(validEnvelope);
    expect(parsed.what.title).toBe('新しい記事が公開されました');
    expect(parsed.urgency).toBe('low');
    expect(parsed.source.kind).toBe('rss');
  });

  it('任意フィールドを省いた最小のエンベロープを受理する', () => {
    const minimal = {
      source: { source_id: 'src_min', kind: 'agent' },
      dedup_key: 'job-42',
      what: { title: 'ビルドが終わりました' },
      urgency: 'normal',
      actionable: 'fyi',
      occurred_at: '2026-06-20T09:00:00Z',
      recipient: 'user_xyz',
    };
    expect(IntakeEnvelopeSchema.safeParse(minimal).success).toBe(true);
  });

  it('title が空なら弾く', () => {
    const bad = { ...validEnvelope, what: { title: '' } };
    expect(IntakeEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('未定義の urgency を弾く', () => {
    const bad = { ...validEnvelope, urgency: 'urgent' };
    expect(IntakeEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('未定義の source.kind を弾く', () => {
    const bad = { ...validEnvelope, source: { source_id: 'x', kind: 'sms' } };
    expect(IntakeEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('ISO でない occurred_at を弾く', () => {
    const bad = { ...validEnvelope, occurred_at: '2026/06/16 08:00' };
    expect(IntakeEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('URL でない link を弾く', () => {
    const bad = { ...validEnvelope, link: 'not-a-url' };
    expect(IntakeEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('タイムゾーンオフセット付きの occurred_at を受理する', () => {
    const ok = { ...validEnvelope, occurred_at: '2026-06-16T17:00:00+09:00' };
    expect(IntakeEnvelopeSchema.safeParse(ok).success).toBe(true);
  });

  it('必須フィールド(recipient)の欠落を弾く', () => {
    const { recipient: _omit, ...bad } = validEnvelope;
    expect(IntakeEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('未知のフィールドを弾く(strictObject。JSON Schema の additionalProperties:false と整合)', () => {
    const bad = { ...validEnvelope, priority: 'high' };
    expect(IntakeEnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('空文字の correlation_id を弾く', () => {
    const bad = { ...validEnvelope, correlation_id: '' };
    expect(IntakeEnvelopeSchema.safeParse(bad).success).toBe(false);
  });
});
