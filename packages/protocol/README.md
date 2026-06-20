# @opennagi/protocol

OpenNagi の受け口エンベロープ。AI から人間への通知を、文脈を添えて束ねるためのオープンな契約。

送り手は生の通知ではなく「文脈を添えたエンベロープ」を投げる。文脈があるほど、受け手側の丸め込み(ダイジェスト化)の精度が上がる。RSS もエージェントも webhook も、種別が違うだけで同じ受け口を通る。

## インストール

```sh
npm install @opennagi/protocol zod
```

`zod` は peer ではなく依存として入るが、型を共有するアプリ側でも同じ zod を使うとよい。

## 使い方

```ts
import { parseIntakeEnvelope, type IntakeEnvelope } from '@opennagi/protocol';

const envelope: IntakeEnvelope = {
  source: { source_id: 'src_abc', kind: 'rss' },
  dedup_key: 'https://example.com/posts/123',
  what: { title: '新しい記事が公開されました' },
  urgency: 'low',
  actionable: 'fyi',
  occurred_at: '2026-06-16T08:00:00Z',
  recipient: 'user_xyz',
};

// 検証して正規化(失敗時は ZodError)
const ok = parseIntakeEnvelope(envelope);
```

## エンベロープの形

### 文脈の4点

| フィールド   | 意味                                                             |
| ------------ | ---------------------------------------------------------------- |
| `what`       | 内容。`title`(必須)と `body`(任意)。                             |
| `urgency`    | 送り手が主張する緊急度。`critical` / `high` / `normal` / `low`。 |
| `actionable` | 行動が要る(`action_required`)か報告(`fyi`)か。                   |
| `expiry`     | いつまで有効か(任意)。期限切れは束ねる前に黙殺できる。           |

### 経路と同定のメタ

| フィールド       | 意味                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| `source`         | 送り手。`source_id` と `kind`(`rss`/`webhook`/`email`/`calendar`/`agent`)。 |
| `dedup_key`      | 送り手内で一意な識別子。`(source_id, dedup_key)` で二重取り込みを防ぐ。     |
| `link`           | 元情報に掘るための URL(任意)。                                              |
| `occurred_at`    | 出来事が起きた時刻(送り手基準)。                                            |
| `recipient`      | どの利用者宛か。                                                            |
| `correlation_id` | 同一の事柄に関する複数の更新を束ねるキー(任意)。                            |
| `topic`          | 送り手が付ける分類ヒント(任意)。                                            |

`received_at`(OpenNagi が受けた時刻)は受信時に自動付与されるため、エンベロープには含めない。

未知のフィールドは弾く(strict)。生成される JSON Schema の `additionalProperties: false` と挙動が揃っており、未知キーを含むエンベロープは `/intake` で 422 になる。

## OpenAPI

`POST /intake` の OpenAPI 3.1 片を `intakeOpenApiFragment()` で得られる。サーバ実装はこれを自分の OpenAPI に合流させる。

```ts
import { intakeOpenApiFragment } from '@opennagi/protocol';

const fragment = intakeOpenApiFragment();
```

## 設計の出典

コード中のコメントは設計ノート(`concept.md` / `protocol.md` / `build-plan.md`)を出典として参照する。これらはこのパッケージには同梱しない。最新の設計は [OpenNagi リポジトリ](https://github.com/opennagi/protocol) を参照。本 README の項目表が、このパッケージが公開する契約の要約として正となる。

## ライセンス

Apache-2.0
