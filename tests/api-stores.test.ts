import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/stores/route';

describe('GET /api/stores', () => {
  it('returns domain and name per store and excludes demo stores', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      stores: Array<{ domain: string; name: string }>;
    };
    expect(data.stores).toContainEqual({ domain: 'lush.com', name: 'Lush' });
    expect(data.stores.map((store) => store.domain)).not.toContain('example-shop.test');
    for (const store of data.stores) {
      expect(Object.keys(store).sort()).toEqual(['domain', 'name']);
    }
  });
});
