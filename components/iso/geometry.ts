/**
 * Isometric geometry for the hero illustrations.
 *
 * World axes: +x runs down-right on screen, +y runs down-left, +z is up.
 * Every visible face of a box is an affine image of a flat 2D shape, so a face
 * can be drawn as an ordinary SVG element inside one `matrix(...)` transform.
 * That keeps rounded corners, text and strokes perfectly crisp.
 */

export type P2 = [number, number];
export type P3 = [number, number, number];

const ISO_C = Math.cos(Math.PI / 6);

export function project([x, y, z]: P3): P2 {
  return [(x - y) * ISO_C, (x + y) * 0.5 - z];
}

const fmt = (n: number) => Math.round(n * 100) / 100;

/** Lie flat on a horizontal plane at height z. Local (u, v) map to world (x+u, y+v). */
export function topMatrix(x: number, y: number, z: number) {
  const [tx, ty] = project([x, y, z]);
  return `matrix(${fmt(ISO_C)} 0.5 ${fmt(-ISO_C)} 0.5 ${fmt(tx)} ${fmt(ty)})`;
}

/** Stand upright facing the viewer's left (the +y face). Local u runs along +x, v runs down. */
export function leftMatrix(x: number, y: number, z: number) {
  const [tx, ty] = project([x, y, z]);
  return `matrix(${fmt(ISO_C)} 0.5 0 1 ${fmt(tx)} ${fmt(ty)})`;
}

/** Outline of a w x d rounded rectangle in local plane coordinates. */
function roundedRectPoints(w: number, d: number, r: number, steps = 6): P2[] {
  const rr = Math.max(0, Math.min(r, w / 2, d / 2));
  const corners: [number, number, number][] = [
    [w - rr, rr, -90],
    [w - rr, d - rr, 0],
    [rr, d - rr, 90],
    [rr, rr, 180],
  ];
  const pts: P2[] = [];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = ((start + (90 * i) / steps) * Math.PI) / 180;
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  }
  return pts;
}

function convexHull(points: P2[]): P2[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: P2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

function pathOf(points: P2[]) {
  return `M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}Z`;
}

export type SlabGeometry = {
  /** Top face outline. */
  top: string;
  /** Full silhouette of the extruded body (sides + top). */
  body: string;
  /** Screen x of the front corner, where the left and right sides meet. */
  frontX: number;
  /** Screen bounding box of the body. */
  box: { x: number; y: number; w: number; h: number };
};

/** A rounded box: footprint w x d at (x, y), from height z up to z + h. */
export function slab(x: number, y: number, z: number, w: number, d: number, h: number, r: number): SlabGeometry {
  const local = roundedRectPoints(w, d, r);
  const topPts = local.map(([u, v]) => project([x + u, y + v, z + h]));
  const basePts = local.map(([u, v]) => project([x + u, y + v, z]));
  const hull = convexHull([...topPts, ...basePts]);
  const xs = hull.map((p) => p[0]);
  const ys = hull.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    top: pathOf(topPts),
    body: pathOf(hull),
    frontX: project([x + w, y + d, z])[0],
    box: { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY },
  };
}

/** Upright cylinder: ellipse rim + side band. Returns screen-space parts. */
export function cylinder(cx: number, cy: number, z: number, radius: number, h: number) {
  const [sx, sy] = project([cx, cy, z]);
  const rx = radius * ISO_C * Math.SQRT2;
  const ry = rx / Math.sqrt(3);
  return {
    rx,
    ry,
    topCenter: [sx, sy - h] as P2,
    side: `M${fmt(sx - rx)} ${fmt(sy - h)}L${fmt(sx - rx)} ${fmt(sy)}A${fmt(rx)} ${fmt(ry)} 0 0 0 ${fmt(sx + rx)} ${fmt(sy)}L${fmt(sx + rx)} ${fmt(sy - h)}Z`,
  };
}
