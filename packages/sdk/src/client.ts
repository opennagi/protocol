import { IntakeEnvelopeSchema, type IntakeEnvelope } from '@opennagi/protocol';

export type IntakeClientOptions = {
  /** 受け口のベース URL。末尾に `/intake` を付けて呼ぶ。 */
  baseUrl: string;
  /** 送り手トークン。あれば `Authorization: Bearer` で送る。 */
  token?: string;
  /** 差し替え用の fetch。省略時はグローバルの fetch を使う(テストや非ブラウザ環境向け)。 */
  fetch?: typeof fetch;
};

export type IntakeResult = { status: 'accepted' } | { status: 'duplicate' };

/** 受け口が想定外のステータスを返したときに投げる。 */
export class IntakeError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'IntakeError';
    this.statusCode = statusCode;
  }
}

export type IntakeClient = {
  /** エンベロープを検証して `/intake` に送る。 */
  intake(envelope: IntakeEnvelope): Promise<IntakeResult>;
};

export function createIntakeClient(options: IntakeClientOptions): IntakeClient {
  const doFetch = options.fetch ?? globalThis.fetch;
  const endpoint = `${options.baseUrl.replace(/\/+$/, '')}/intake`;

  return {
    async intake(envelope) {
      // 送る前に契約で検証する。壊れたものを口に投げない(失敗時は ZodError)。
      const valid = IntakeEnvelopeSchema.parse(envelope);

      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (options.token) headers.authorization = `Bearer ${options.token}`;

      const res = await doFetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(valid),
      });

      if (res.status === 202) return { status: 'accepted' };
      if (res.status === 409) return { status: 'duplicate' };
      throw new IntakeError(`intake failed with status ${res.status}`, res.status);
    },
  };
}
