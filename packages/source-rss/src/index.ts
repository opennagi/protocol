/**
 * @opennagi/source-rss — RSS / Atom / RDF を受け口エンベロープに変換する公開リファレンス。
 *
 * HTTP 取得は持たない(呼び出し側の責任)。フィード XML を渡すとエンベロープ配列を返す。
 * server の取得経路はこれに依存せず、外部送り手が `/intake` を叩く際の手本として使う。
 */

export { parseRss, type ParsedFeed, type ParsedItem } from './parseRss.js';
export { diffKey, type DiffKeyInput } from './diffKey.js';
export { itemToEnvelope, rssToEnvelopes, type RssToEnvelopesOptions } from './rssToEnvelopes.js';
