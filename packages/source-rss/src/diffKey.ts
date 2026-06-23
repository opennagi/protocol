/**
 * フィード項目を一意に識別する dedup_key を生成する。
 *
 * 優先順位は guid > link > sha256(title|publishedAt)。
 * Web Crypto を使うため async。Node.js 18+ / Cloudflare Workers の双方で動く。
 */

export type DiffKeyInput = {
  guid: string | null;
  link: string | null;
  title: string;
  publishedAt: string | null;
};

export async function diffKey(item: DiffKeyInput): Promise<string> {
  const guid = item.guid?.trim();
  if (guid) return guid;

  const link = item.link?.trim();
  if (link) return link;

  const seed = `${item.title}|${item.publishedAt ?? ''}`;
  return sha256Hex(seed);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}
