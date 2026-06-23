# @opennagi/sdk

OpenNagi の受け口にエンベロープを投げる薄いクライアント。

送る前に `@opennagi/protocol` でエンベロープを検証するので、壊れたものを口に投げない。外部の送り手が `/intake` を叩くための公開リファレンス。

## インストール

```sh
npm install @opennagi/sdk
```

## 使い方

```ts
import { createIntakeClient } from '@opennagi/sdk';

const client = createIntakeClient({
  baseUrl: 'https://api.opennagi.com',
  token: process.env.OPENNAGI_TOKEN, // 任意
});

const result = await client.intake({
  source: { source_id: 'src_abc', kind: 'webhook' },
  dedup_key: 'event-42',
  what: { title: 'デプロイが完了しました' },
  urgency: 'normal',
  actionable: 'fyi',
  occurred_at: '2026-06-16T08:00:00Z',
  recipient: 'user_xyz',
});

// result.status は 'accepted'(202) か 'duplicate'(409)。
```

## 戻り値とエラー

| 結果                      | 意味                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| `{ status: 'accepted' }`  | 受理(202)。`pending` で保存された。                              |
| `{ status: 'duplicate' }` | 重複(409)。`(source_id, dedup_key)` で無視。                     |
| `IntakeError` を throw    | 想定外のステータス(422 など)。`statusCode` を持つ。              |
| `ZodError` を throw       | 送信前の検証に失敗した(fetch しない)。                           |
| ネットワーク例外を throw  | 接続失敗やタイムアウトなど。fetch が投げた例外をそのまま伝える。 |

## オプション

| オプション | 役割                                                   |
| ---------- | ------------------------------------------------------ |
| `baseUrl`  | 受け口のベース URL。末尾に `/intake` を付けて呼ぶ。    |
| `token`    | 送り手トークン(任意)。`Authorization: Bearer` で送る。 |
| `fetch`    | 差し替え用の fetch(任意)。省略時はグローバルの fetch。 |

## ライセンス

Apache-2.0
