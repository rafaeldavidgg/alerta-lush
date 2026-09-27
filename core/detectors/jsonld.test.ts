import { describe, expect, it } from 'vitest';
import { jsonLdStrategy } from '@core/detectors';

async function detect(html: string) {
  return jsonLdStrategy.detect({ type: 'jsonld' }, { url: 'https://example.com/p', html });
}

describe('jsonLdStrategy', () => {
  it('reads the URL form of InStock', async () => {
    const result = await detect(
      `<script type="application/ld+json">{"@type":"Product","offers":{"availability":"https://schema.org/InStock"}}</script>`,
    );
    expect(result.state).toBe('in_stock');
  });

  it('reads the short form of InStock', async () => {
    const result = await detect(
      `<script type="application/ld+json">{"@type":"Product","offers":{"availability":"InStock"}}</script>`,
    );
    expect(result.state).toBe('in_stock');
  });

  it('reads an out-of-stock value', async () => {
    const result = await detect(
      `<script type="application/ld+json">{"@type":"Product","offers":{"availability":"https://schema.org/OutOfStock"}}</script>`,
    );
    expect(result.state).toBe('out_of_stock');
  });

  it('ignores a malformed JSON-LD block', async () => {
    const result = await detect(
      `<script type="application/ld+json">{not valid json</script>
       <script type="application/ld+json">{"@type":"Product","offers":{"availability":"InStock"}}</script>`,
    );
    expect(result.state).toBe('in_stock');
  });

  it('returns unknown when no JSON-LD is present', async () => {
    const result = await detect('<html><body><button>Añadir a la cesta</button></body></html>');
    expect(result.state).toBe('unknown');
  });

  it('descends into @graph and offer arrays', async () => {
    const result = await detect(
      `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Product","offers":[{"@type":"Offer","availability":"OutOfStock"}]}]}</script>`,
    );
    expect(result.state).toBe('out_of_stock');
  });
});
