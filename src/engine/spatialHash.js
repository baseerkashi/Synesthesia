/** Uniform-grid spatial hash for O(n) neighbor queries. */
export class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _key(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  clear() {
    this.cells.clear();
  }

  insert(x, y, data) {
    const key = this._key(x, y);
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    bucket.push({ x, y, data });
  }

  query(x, y, radius, callback) {
    const r = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const r2 = radius * radius;
    for (let ox = -r; ox <= r; ox++) {
      for (let oy = -r; oy <= r; oy++) {
        const bucket = this.cells.get(`${cx + ox},${cy + oy}`);
        if (!bucket) continue;
        for (const item of bucket) {
          const dx = item.x - x;
          const dy = item.y - y;
          if (dx * dx + dy * dy <= r2) callback(item);
        }
      }
    }
  }
}
