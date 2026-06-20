# CLAUDE.md

Please respond in Japanese.

## このリポジトリについて

OpenNagi の**契約層**。受け口エンベロープ(送り手が投げる単一の入力)とその公開 SDK を置く。何にも依存しない根であり、サーバやアプリはこの契約に**一方向で**依存する。契約層は閉じる層(server / app)を import してはならない。

## Documentation Guidelines

ドキュメントを作成または更新する際は、以下の方針に従ってください。

1. 必要最低限のみ記載: 本当に必要な情報だけを記載し、冗長な説明は避ける
2. シンプルに記述: 複雑な説明や詳細な背景情報は省略し、要点だけを記載する
3. 事実のみを記載: 実装の状態や使用方法など、客観的な事実だけを記載する
4. 時系列的記述の禁止: 変更履歴や「〜を変更しました」といった記述は避ける
5. `/lint-ja` をかける: ドキュメント(`.md`)を作成または更新したら `/lint-ja` で日本語を整える

## Implementation Guidelines

機能を実装する前に、必ず次の手順を踏んでください。

1. 最新ドキュメントの確認: WebFetch または Context7 で関連技術の最新ドキュメントを確認する
2. タスクの計画: TodoWrite で作業を分解し、実装手順を明確にする
3. 既存コードの調査: 既存の実装パターン(zod スキーマの書き方、テストの並べ方、export の流儀)を理解してから手を入れる

## Simple Implementation Principles

YAGNI(You Aren't Gonna Need It)と KISS(Keep It Simple, Stupid)の原則を徹底する。

### 設計と実装での心構え

1. 最初にシンプルな解決策を検討する
   - 複雑な設計パターンやヘルパーの追加前に、既存の API や zod の標準機能で解決できないか検討する

2. オーバーエンジニアリングを避ける
   - 将来の拡張性を考慮しすぎない(現在の要件に集中する)
   - 抽象化レイヤーは本当に必要になってから追加する
   - 「もしかしたら使うかも」の機能は実装しない

3. コードの読みやすさを重視する
   - 短く直接的なコードを書く
   - 複雑な処理を隠すよりも、明示的に書く
   - ネストを深くするより、フラットな構造を選ぶ

4. 実装前の確認事項
   - 既存の関数やスキーマで解決できないか？
   - 新しい関数や型が本当に必要か？
   - 契約(公開 API)を増やす必要が本当にあるか？

## 契約層としての規律

- 依存方向は一方向: protocol は何にも依存しない。`zod` 以外のランタイム依存を増やさない。
- 公開 API は最小に: 外に出すのは `src/index.ts` の export のみ。型、スキーマ、関数の追加は契約の追加であり、慎重に行う。
- 未知フィールドは弾く(strict): エンベロープは `strictObject` で定義し、生成される JSON Schema の `additionalProperties: false` と挙動を揃える。
- スキーマと型は zod から導出する: 型は `z.infer` で導く。スキーマと別に型を手書きしない。
- 設計の出典を参照する: コード中のコメントは設計ノート(`concept.md` / `protocol.md` / `build-plan.md`)を出典として参照する。これらはパッケージに同梱しない。

## アーキテクチャ

### モノレポ構成

- パッケージマネージャ: pnpm(workspace は `packages/*`)
- タスクランナー: Turborepo(`turbo.json`、`^build` で依存パッケージを先にビルド)
- 言語: TypeScript(`tsconfig.base.json` を各パッケージが extends、`strict` 系を全有効)

### パッケージ

| パッケージ                   | 公開 | 中身                                                           |
| ---------------------------- | ---- | -------------------------------------------------------------- |
| `@opennagi/protocol`         | ○    | 受け口エンベロープの zod スキーマと型、`/intake` の OpenAPI 片 |
| `@opennagi/sdk`(予定)        | ○    | エンベロープを `/intake` に投げる薄いクライアント              |
| `@opennagi/source-rss`(予定) | ○    | RSS 項目をエンベロープに変換する parser                        |

### `@opennagi/protocol` の構成

- `src/enums.ts`: 語彙(緊急度、行動要否、送り手種別、通知ライフサイクル)の zod enum と定数
- `src/envelope.ts`: 受け口エンベロープの zod スキーマと `parseIntakeEnvelope`
- `src/openapi.ts`: `/intake` の OpenAPI 3.1 片(`intakeOpenApiFragment` / `intakeEnvelopeJsonSchema`)
- `src/index.ts`: 公開 API(ここに export したものだけが契約になる)
- `src/*.test.ts`: 各モジュール隣接のテスト

### 主要技術

- スキーマとバリデーション: zod v4(`z.infer` で型を導出、`strictObject`、`.meta()` で OpenAPI 用の説明を付与)
- テスト: vitest
- lint と整形: ESLint(typescript-eslint)と Prettier
- 公開: npm パッケージ(Apache-2.0、`dist` のみ同梱、ESM)

## テスト指針

**実装の正しさを保証し、実際のバグを見つける**ことが目的。カバレッジ率向上が目的ではない。

## MCP 活用

実装前に最新ドキュメントを確認する。

- `mcp__context7__resolve-library-id` でライブラリ検索(例: zod)
- `mcp__context7__get-library-docs` でドキュメント取得

ドキュメント確認や技術調査の際は Context7 で横断的に調べ、最新のベストプラクティスや推奨パターンを確認する。

## 重要な作業規則

- lint と型エラーは即座に修正する: `pnpm lint` は `--max-warnings=0`。コミット前にエラーと警告をゼロに保つ。
- 整形は Prettier に任せる: 手で整形せず `pnpm format` を使う。設定は `.prettierrc`。
- 公開 API を変えたら契約変更として扱う: `src/index.ts` の export、スキーマ、OpenAPI 片を変えた場合は README の項目表と整合を取る。README の項目表がこのパッケージが公開する契約の要約として正となる。
- type import を使う: 型のみの import は `import type` / inline `type` を用いる(ESLint の `consistent-type-imports` で強制)。
