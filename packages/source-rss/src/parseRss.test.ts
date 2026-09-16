import { describe, expect, it } from 'vitest';

import { parseRss } from './parseRss.js';

const RSS2 = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example Blog</title>
    <description>記事の更新</description>
    <item>
      <title>新しい記事</title>
      <link>https://example.com/posts/1</link>
      <guid>tag:example.com,2026:1</guid>
      <description>本文の要約 &amp; 続き</description>
      <pubDate>Mon, 16 Jun 2026 08:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example</title>
  <entry>
    <title>Atom の記事</title>
    <id>urn:uuid:abc</id>
    <link rel="alternate" href="https://example.com/a/1"/>
    <summary>あらまし</summary>
    <updated>2026-06-16T09:00:00Z</updated>
  </entry>
</feed>`;

describe('parseRss', () => {
  it('RSS 2.0 を共通型にパースし、エンティティを展開する', () => {
    const feed = parseRss(RSS2);
    expect(feed.title).toBe('Example Blog');
    expect(feed.items).toHaveLength(1);
    const item = feed.items[0]!;
    expect(item.title).toBe('新しい記事');
    expect(item.guid).toBe('tag:example.com,2026:1');
    expect(item.link).toBe('https://example.com/posts/1');
    expect(item.summary).toBe('本文の要約 & 続き');
    expect(item.publishedAt).toBe('2026-06-16T08:00:00.000Z');
  });

  it('Atom を共通型にパースし、alternate リンクと summary を取る', () => {
    const feed = parseRss(ATOM);
    const item = feed.items[0]!;
    expect(item.title).toBe('Atom の記事');
    expect(item.guid).toBe('urn:uuid:abc');
    expect(item.link).toBe('https://example.com/a/1');
    expect(item.summary).toBe('あらまし');
    expect(item.publishedAt).toBe('2026-06-16T09:00:00.000Z');
  });

  it('画像 URL は media:thumbnail → media:content(画像) → enclosure(画像) の順で採る', () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>T</title>
    <item>
      <title>thumbnail 優先</title>
      <enclosure url="https://example.com/enc.jpg" type="image/jpeg" length="1"/>
      <media:content url="https://example.com/content.jpg" medium="image"/>
      <media:thumbnail url="https://example.com/thumb.jpg"/>
    </item>
    <item>
      <title>media:content は動画を飛ばして画像を採る</title>
      <media:content url="https://example.com/movie.mp4" medium="video"/>
      <media:content url="https://example.com/still.png" type="image/png"/>
    </item>
    <item>
      <title>enclosure は画像だけ</title>
      <enclosure url="https://example.com/audio.mp3" type="audio/mpeg" length="1"/>
      <enclosure url="https://example.com/cover.jpg" type="image/jpeg" length="1"/>
    </item>
    <item>
      <title>本文の img は見ない</title>
      <description>&lt;img src="https://example.com/inline.jpg"&gt;</description>
    </item>
  </channel>
</rss>`;
    const urls = parseRss(xml).items.map((i) => i.imageUrl);
    expect(urls).toEqual([
      'https://example.com/thumb.jpg',
      'https://example.com/still.png',
      'https://example.com/cover.jpg',
      null,
    ]);
  });

  it('未知の形式は投げる', () => {
    expect(() => parseRss('<html></html>')).toThrow();
  });

  it('範囲外の数値文字参照を含んでもクラッシュせず原文を保つ', () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>T</title>
    <item><title>bad &#x110000; ok &#65;</title></item>
  </channel>
</rss>`;
    const title = parseRss(xml).items[0]!.title;
    // 範囲外(> U+10FFFF)は展開せず原文のまま、正常な参照は展開する。
    expect(title).toContain('&#x110000;');
    expect(title).toContain('A');
  });
});
