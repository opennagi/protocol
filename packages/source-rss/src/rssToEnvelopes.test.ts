import { parseIntakeEnvelope } from '@opennagi/protocol';
import { describe, expect, it } from 'vitest';

import { rssToEnvelopes } from './rssToEnvelopes.js';

const RSS2 = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example Blog</title>
    <item>
      <title>新しい記事</title>
      <link>https://example.com/posts/1</link>
      <guid>tag:example.com,2026:1</guid>
      <description>本文の要約</description>
      <pubDate>Mon, 16 Jun 2026 08:00:00 GMT</pubDate>
    </item>
    <item>
      <title>日付の無い記事</title>
      <link>https://example.com/posts/2</link>
    </item>
  </channel>
</rss>`;

const opts = { source_id: 'src_blog', recipient: 'user_xyz' };

describe('rssToEnvelopes', () => {
  it('各項目を protocol に適合するエンベロープへ写す', async () => {
    const envelopes = await rssToEnvelopes(RSS2, opts);
    expect(envelopes).toHaveLength(2);
    // 生成物が契約に通ることを protocol 自身で検証する。
    for (const env of envelopes) {
      expect(() => parseIntakeEnvelope(env)).not.toThrow();
    }
  });

  it('RSS の既定マッピングを当てる(urgency=low / actionable=fyi / kind=rss)', async () => {
    const [first] = await rssToEnvelopes(RSS2, opts);
    expect(first!.urgency).toBe('low');
    expect(first!.actionable).toBe('fyi');
    expect(first!.source).toEqual({ source_id: 'src_blog', kind: 'rss' });
    expect(first!.what).toEqual({ title: '新しい記事', body: '本文の要約' });
    expect(first!.dedup_key).toBe('tag:example.com,2026:1');
    expect(first!.link).toBe('https://example.com/posts/1');
    expect(first!.occurred_at).toBe('2026-06-16T08:00:00.000Z');
    expect(first!.recipient).toBe('user_xyz');
  });

  it('guid が無ければ link を dedup_key にし、発行時刻が無ければ取得時刻で埋める', async () => {
    const [, second] = await rssToEnvelopes(RSS2, opts);
    expect(second!.dedup_key).toBe('https://example.com/posts/2');
    expect(typeof second!.occurred_at).toBe('string');
    // 取得時刻フォールバックも ISO として契約に通る。
    expect(() => parseIntakeEnvelope(second)).not.toThrow();
  });

  it('相対 URL や javascript: の link は落とし、契約に通す', async () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example</title>
    <item>
      <title>相対リンク</title>
      <link>/posts/rel</link>
    </item>
    <item>
      <title>危険リンク</title>
      <guid>g-danger</guid>
      <link>javascript:alert(1)</link>
    </item>
  </channel>
</rss>`;
    const [rel, danger] = await rssToEnvelopes(xml, opts);
    // link フィールドは http/https でないので落ちる。
    expect(rel!.link).toBeUndefined();
    expect(danger!.link).toBeUndefined();
    // dedup_key には生の値(相対 URL / guid)をそのまま使える。
    expect(rel!.dedup_key).toBe('/posts/rel');
    expect(danger!.dedup_key).toBe('g-danger');
    for (const env of [rel, danger]) {
      expect(() => parseIntakeEnvelope(env)).not.toThrow();
    }
  });
});
