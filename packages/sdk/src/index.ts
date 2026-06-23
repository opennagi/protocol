/**
 * @opennagi/sdk — 受け口にエンベロープを投げる薄いクライアント。
 *
 * 送る前に `@opennagi/protocol` で検証する。外部送り手が `/intake` を叩くための公開リファレンス。
 */

export {
  createIntakeClient,
  IntakeError,
  type IntakeClient,
  type IntakeClientOptions,
  type IntakeResult,
} from './client.js';
