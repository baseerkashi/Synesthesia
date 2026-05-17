const atlasCache = new WeakMap();

/** Pre-rendered radial glow sprite — avoids per-star shadowBlur state churn. */
export function getStarGlowSprite(ctx) {
  let atlas = atlasCache.get(ctx);
  if (atlas) return atlas;

  const size = 64;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');
  const g = octx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  octx.fillStyle = g;
  octx.fillRect(0, 0, size, size);
  atlasCache.set(ctx, off);
  return off;
}

export function disposeGlowAtlas(ctx) {
  atlasCache.delete(ctx);
}
