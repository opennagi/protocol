import type { IntakeEnvelope } from '@opennagi/protocol';
import { describe, expect, it, vi } from 'vitest';

import { createIntakeClient, IntakeError } from './client.js';

const envelope: IntakeEnvelope = {
  source: { source_id: 'src_abc', kind: 'rss' },
  dedup_key: 'k1',
  what: { title: 'こんにちは' },
  urgency: 'low',
  actionable: 'fyi',
  occurred_at: '2026-06-16T08:00:00Z',
  recipient: 'user_xyz',
};

function mockFetch(status: number) {
  return vi.fn(
    async (_url: string | URL | Request, _init?: RequestInit) => new Response(null, { status }),
  );
}

describe('createIntakeClient', () => {
  it('202 を accepted として返し、POST /intake を叩く', async () => {
    const fetch = mockFetch(202);
    const client = createIntakeClient({ baseUrl: 'https://api.example.com', fetch });

    await expect(client.intake(envelope)).resolves.toEqual({ status: 'accepted' });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://api.example.com/intake');
    expect(init?.method).toBe('POST');
  });

  it('409 を duplicate として返す', async () => {
    const client = createIntakeClient({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch(409),
    });
    await expect(client.intake(envelope)).resolves.toEqual({ status: 'duplicate' });
  });

  it('想定外のステータスは IntakeError を投げる', async () => {
    const client = createIntakeClient({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch(422),
    });
    await expect(client.intake(envelope)).rejects.toBeInstanceOf(IntakeError);
  });

  it('壊れたエンベロープは検証で弾き、fetch しない', async () => {
    const fetch = mockFetch(202);
    const client = createIntakeClient({ baseUrl: 'https://api.example.com', fetch });
    const broken = { ...envelope, urgency: 'urgent' } as unknown as IntakeEnvelope;

    await expect(client.intake(broken)).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('token があれば Authorization ヘッダを付ける', async () => {
    const fetch = mockFetch(202);
    const client = createIntakeClient({
      baseUrl: 'https://api.example.com',
      token: 'secret',
      fetch,
    });

    await client.intake(envelope);

    const headers = fetch.mock.calls[0]![1]?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer secret');
  });

  it('baseUrl の末尾スラッシュを正規化する', async () => {
    const fetch = mockFetch(202);
    const client = createIntakeClient({ baseUrl: 'https://api.example.com/', fetch });

    await client.intake(envelope);

    expect(fetch.mock.calls[0]![0]).toBe('https://api.example.com/intake');
  });
});
