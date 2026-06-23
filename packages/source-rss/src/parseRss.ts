/**
 * RSS 2.0 / Atom 1.0 / RDF (RSS 1.0) を共通のフィード型にパースする。
 *
 * publishedAt は ISO 8601 (UTC) に正規化する。タイトルが取れない要素は fallback で埋める。
 * dedup_key の計算は呼び出し側(`diffKey.ts`)で行う。
 */

import { XMLParser } from 'fast-xml-parser';

export type ParsedItem = {
  guid: string | null;
  link: string | null;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  raw: unknown;
};

export type ParsedFeed = {
  title: string | null;
  description: string | null;
  items: ParsedItem[];
};

const FALLBACK_TITLE = '(無題)';

// processEntities=false で fast-xml-parser のエンティティ展開を無効化する。
// (1) 本文に &amp; が多数含まれる feed で expansion limit を超えるのを避ける
// (2) XXE 攻撃の入口を塞ぐ(外部エンティティを展開しない)
// 必要な HTML エンティティは getText() 側で限定的に手動展開する。
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  processEntities: false,
});

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeXmlEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const cp = parseInt(body.slice(2), 16);
      return isValidCodePoint(cp) ? String.fromCodePoint(cp) : match;
    }
    if (body.startsWith('#')) {
      const cp = parseInt(body.slice(1), 10);
      return isValidCodePoint(cp) ? String.fromCodePoint(cp) : match;
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

// Unicode のコードポイント範囲(0..U+10FFFF)に収まるかを確かめる。
// String.fromCodePoint は範囲外や NaN で RangeError を投げるため、ここで弾く。
// (Number.isFinite だけでは &#x110000; のような巨大値を通してしまいクラッシュする)
function isValidCodePoint(cp: number): boolean {
  return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff;
}

export function parseRss(xml: string): ParsedFeed {
  let parsed: unknown;
  try {
    parsed = xmlParser.parse(xml);
  } catch (err) {
    throw new Error(`failed to parse XML: ${err instanceof Error ? err.message : String(err)}`);
  }
  const root = asObject(parsed);
  if (!root) throw new Error('empty feed');

  const channel = asObject(asObject(root.rss)?.channel);
  if (channel) return parseRss2(channel);

  const feed = asObject(root.feed);
  if (feed) return parseAtom(feed);

  const rdf = asObject(root['rdf:RDF']);
  if (rdf) return parseRdf(rdf);

  throw new Error('unknown feed format (expected rss / feed / rdf:RDF root)');
}

function parseRss2(channel: Record<string, unknown>): ParsedFeed {
  const items = ensureArray(channel.item);
  return {
    title: getText(channel.title),
    description: getText(channel.description),
    items: items.map((node) => {
      const item = asObject(node) ?? {};
      const pub = getText(item.pubDate) ?? getText(item['dc:date']);
      return {
        guid: getText(item.guid),
        link: getText(item.link),
        title: getText(item.title) ?? FALLBACK_TITLE,
        summary: getText(item.description) ?? getText(item['content:encoded']),
        publishedAt: parseDate(pub),
        raw: node,
      };
    }),
  };
}

function parseAtom(feed: Record<string, unknown>): ParsedFeed {
  const entries = ensureArray(feed.entry);
  return {
    title: getText(feed.title),
    description: getText(feed.subtitle),
    items: entries.map((node) => {
      const entry = asObject(node) ?? {};
      const published = getText(entry.published) ?? getText(entry.updated);
      return {
        guid: getText(entry.id),
        link: extractAtomLink(entry.link),
        title: getText(entry.title) ?? FALLBACK_TITLE,
        summary: getText(entry.summary) ?? getText(entry.content),
        publishedAt: parseDate(published),
        raw: node,
      };
    }),
  };
}

function parseRdf(rdf: Record<string, unknown>): ParsedFeed {
  const channel = asObject(rdf.channel);
  const items = ensureArray(rdf.item);
  return {
    title: channel ? getText(channel.title) : null,
    description: channel ? getText(channel.description) : null,
    items: items.map((node) => {
      const item = asObject(node) ?? {};
      const link = getText(item.link);
      const about = getAttribute(item, '@_rdf:about');
      const date = getText(item['dc:date']) ?? getText(item.pubDate);
      return {
        guid: about ?? link,
        link,
        title: getText(item.title) ?? FALLBACK_TITLE,
        summary: getText(item.description),
        publishedAt: parseDate(date),
        raw: node,
      };
    }),
  };
}

function extractAtomLink(link: unknown): string | null {
  const links = ensureArray(link);
  let fallback: string | null = null;
  for (const l of links) {
    if (typeof l === 'string') {
      fallback ??= l;
      continue;
    }
    const obj = asObject(l);
    if (!obj) continue;
    const href = typeof obj['@_href'] === 'string' ? obj['@_href'] : null;
    if (!href) continue;
    const rel = typeof obj['@_rel'] === 'string' ? obj['@_rel'] : null;
    if (rel == null || rel === 'alternate') return href;
    fallback ??= href;
  }
  return fallback;
}

function getText(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    const t = decodeXmlEntities(v).trim();
    return t === '' ? null : t;
  }
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    for (const e of v) {
      const t = getText(e);
      if (t) return t;
    }
    return null;
  }
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj['#text'] === 'string') {
      return decodeXmlEntities(obj['#text']).trim() || null;
    }
    return null;
  }
  return null;
}

function getAttribute(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function ensureArray(v: unknown): unknown[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function asObject(v: unknown): Record<string, unknown> | null {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function parseDate(v: string | null): string | null {
  if (!v) return null;
  const ms = Date.parse(v);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}
