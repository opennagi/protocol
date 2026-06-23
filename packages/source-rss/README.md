# @opennagi/source-rss

RSS / Atom / RDF のフィードを OpenNagi の受け口エンベロープに変換する公開リファレンス。

RSS は OpenNagi にとって「最初の1クライアント」であり、特別な経路ではない。このパッケージは、外部の送り手が自分のフィードを `/intake` に投げるときの手本を示す。OpenNagi の server 自身の取得経路はこれに依存しない。

## インストール

```sh
npm install @opennagi/source-rss
```

## 使い方

フィードの XML 文字列を渡すと、エンベロープの配列が返る。HTTP 取得は呼び出し側で行う。

```ts
import { rssToEnvelopes } from '@opennagi/source-rss';
import { createIntakeClient } from '@opennagi/sdk';

const xml = await fetch('https://example.com/feed').then((r) => r.text());
const envelopes = await rssToEnvelopes(xml, {
  source_id: 'src_blog',
  recipient: 'user_xyz',
});

const client = createIntakeClient({ baseUrl: 'https://api.opennagi.com' });
for (const envelope of envelopes) {
  await client.intake(envelope);
}
```

## マッピング

| エンベロープ  | 由来                                                  |
| ------------- | ----------------------------------------------------- |
| `what.title`  | 項目のタイトル                                        |
| `what.body`   | 項目の本文や要約(description / summary / content)。   |
| `urgency`     | `low` に固定(RSS は基本的に急がない)。                |
| `actionable`  | `fyi` に固定。                                        |
| `source.kind` | `rss` に固定。                                        |
| `dedup_key`   | guid、無ければ link、どちらも無ければ本文のハッシュ。 |
| `link`        | 項目の URL。                                          |
| `occurred_at` | 項目の発行時刻。無ければ取得時刻で代替する。          |

`source_id` と `recipient` は配備ごとに異なるため、呼び出し側が渡す。

guid も link も無い項目は、タイトルと発行時刻のハッシュを `dedup_key` にする。タイトルが同じで発行時刻も無い項目どうしは鍵が衝突し、片方が重複として扱われることがある。

`link` は http/https の絶対 URL だけを採用し、相対 URL や `javascript:` などは落とす。

## API

| 関数                            | 役割                                                  |
| ------------------------------- | ----------------------------------------------------- |
| `rssToEnvelopes(xml, options)`  | フィード XML をパースして全項目をエンベロープにする。 |
| `itemToEnvelope(item, options)` | 1 項目をエンベロープにする。                          |
| `parseRss(xml)`                 | フィードを共通型(`ParsedFeed`)にパースする。          |
| `diffKey(item)`                 | 項目の `dedup_key` を求める。                         |

## ライセンス

Apache-2.0
