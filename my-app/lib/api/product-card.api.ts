export type ProductCardStats = {
  averageRating: number;
  totalReviews: number;
  soldCount: number;
};

const statsCache = new Map<string, ProductCardStats>();
const requestCache = new Map<string, Promise<ProductCardStats>>();

export async function getProductCardStats(productIds: string[]): Promise<Record<string, ProductCardStats>> {
  const ids = Array.from(new Set(productIds.map((id) => id.trim()).filter(Boolean)));

  if (ids.length === 0) {
    return {};
  }

  const response = await fetch(`/api/products/card-stats?ids=${encodeURIComponent(ids.join(','))}`);

  if (!response.ok) {
    throw new Error('Failed to load product card stats');
  }

  const payload = (await response.json()) as { stats?: Record<string, ProductCardStats> };
  return payload.stats || {};
}

export async function getProductCardStat(productId: string): Promise<ProductCardStats> {
  if (statsCache.has(productId)) {
    return statsCache.get(productId)!;
  }

  if (requestCache.has(productId)) {
    return requestCache.get(productId)!;
  }

  const request = getProductCardStats([productId])
    .then((statsMap) => {
      const stats = statsMap[productId] || {
        averageRating: 0,
        totalReviews: 0,
        soldCount: 0,
      };

      statsCache.set(productId, stats);
      return stats;
    })
    .finally(() => {
      requestCache.delete(productId);
    });

  requestCache.set(productId, request);
  return request;
}
