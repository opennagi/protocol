# OpenNagi protocol

> 嵐を静める。AI から人間への通知を、受け手主権で束ねて届ける。

OpenNagi の**契約層**。受け口エンベロープ(送り手が投げる単一の入力)と、その公開 SDK を置く。何にも依存しない根であり、サーバやアプリはこの契約に一方向で依存する。

## パッケージ

| パッケージ                                | 公開 | 中身                                                           |
| ----------------------------------------- | ---- | -------------------------------------------------------------- |
| [`@opennagi/protocol`](packages/protocol) | ○    | 受け口エンベロープの Zod スキーマと型、`/intake` の OpenAPI 片 |
| `@opennagi/sdk`(予定)                     | ○    | エンベロープを `/intake` に投げる薄いクライアント              |
| `@opennagi/source-rss`(予定)              | ○    | RSS 項目をエンベロープに変換する parser                        |

`sdk` と `source-rss` は、RSS を「最初の1クライアント」として通す段(Phase 2)で追加する。

## 開発

```sh
pnpm install
pnpm build      # 全パッケージをビルド
pnpm test       # テスト
pnpm typecheck  # 型チェック
pnpm lint       # lint
```

- パッケージマネージャ: pnpm (Turbo でタスク実行)
- スキーマ: zod v4
- テスト: vitest

## ライセンス

公開パッケージは Apache-2.0。
