/**
 * フィード項目を OpenNagi の受け口エンベロープに写す。
 *
 * RSS は「最初の1クライアント」であり、特別な経路ではない。ここはその公開リファレンス。
 * urgency は low、actionable は fyi に固定する(RSS は基本的に急がない)。
 * (protocol.md「RSS を最初のエージェントとして写す」)
 */

import type { IntakeEnvelope } from '@opennagi/protocol';

import { diffKey } from './diffKey.js';
import { parseRss, type ParsedItem } from './parseRss.js';

export type RssToEnvelopesOptions = {
  /** この feed を表す Source の識別子。 */
  source_id: string;
  /** どの利用者宛か。 */
  recipient: string;
};

/** 1つのフィード項目をエンベロープに変換する。 */
export async function itemToEnvelope(
  item: ParsedItem,
  options: RssToEnvelopesOptions,
): Promise<IntakeEnvelope> {
  // link は http/https の絶対 URL だけ採用する。相対 URL は契約(z.url())を通らず、
  // javascript:/data: は下流の描画で危ういため落とす。dedup_key には生の値を使ってよい。
  const link = safeHttpUrl(item.link);
  return {
    what: item.summary ? { title: item.title, body: item.summary } : { title: item.title },
    urgency: 'low',
    actionable: 'fyi',
    source: { source_id: options.source_id, kind: 'rss' },
    dedup_key: await diffKey(item),
    // 発行時刻が無い項目は取得時刻で代替する(送り手が出せる最善)。
    occurred_at: item.publishedAt ?? new Date().toISOString(),
    recipient: options.recipient,
    ...(link ? { link } : {}),
  };
}

/** http/https の絶対 URL だけを返す。相対 URL や javascript:/data: などは null に落とす。 */
function safeHttpUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** フィード XML をパースし、全項目をエンベロープに変換する。 */
export async function rssToEnvelopes(
  xml: string,
  options: RssToEnvelopesOptions,
): Promise<IntakeEnvelope[]> {
  const feed = parseRss(xml);
  return Promise.all(feed.items.map((item) => itemToEnvelope(item, options)));
}
