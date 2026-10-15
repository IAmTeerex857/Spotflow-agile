import { useId, useMemo } from "react";
import { cylinder, leftMatrix, slab, topMatrix } from "./geometry";

export type Shade = {
  top: string;
  /** Side facing the viewer's left. */
  left: string;
  /** Side facing the viewer's right. */
  right: string;
  line?: string;
  lineWidth?: number;
};

/**
 * A rounded isometric box. The body silhouette is painted in the right-hand
 * shade, the left half is overpainted (clipped at the front corner) in the
 * left-hand shade, then the top face goes on top. `children` render flat on
 * the top face in local units (0..w, 0..d).
 */
export function IsoSlab({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  r = 8,
  shade,
  children,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  r?: number;
  shade: Shade;
  children?: React.ReactNode;
}) {
  const clipId = useId();
  const g = useMemo(() => slab(x, y, z, w, d, h, r), [x, y, z, w, d, h, r]);
  const stroke = shade.line ?? "none";
  const sw = shade.lineWidth ?? 1.4;
  return (
    <g>
      <clipPath id={clipId}>
        <rect x={g.box.x - 2} y={g.box.y - 2} width={g.frontX - g.box.x + 2} height={g.box.h + 4} />
      </clipPath>
      <path d={g.body} fill={shade.right} />
      <path d={g.body} fill={shade.left} clipPath={`url(#${clipId})`} />
      <path d={g.body} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <path d={g.top} fill={shade.top} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      {children && <g transform={topMatrix(x, y, z + h)}>{children}</g>}
    </g>
  );
}

/** Content lying flat on a horizontal plane. */
export function OnTop({ x, y, z, children }: { x: number; y: number; z: number; children: React.ReactNode }) {
  return <g transform={topMatrix(x, y, z)}>{children}</g>;
}

/** Content standing upright, facing the viewer's left. */
export function OnLeft({ x, y, z, children }: { x: number; y: number; z: number; children: React.ReactNode }) {
  return <g transform={leftMatrix(x, y, z)}>{children}</g>;
}

export function IsoCylinder({
  cx,
  cy,
  z = 0,
  radius,
  h,
  shade,
  children,
}: {
  cx: number;
  cy: number;
  z?: number;
  radius: number;
  h: number;
  shade: Shade;
  children?: React.ReactNode;
}) {
  const c = useMemo(() => cylinder(cx, cy, z, radius, h), [cx, cy, z, radius, h]);
  const stroke = shade.line ?? "none";
  const sw = shade.lineWidth ?? 1.4;
  return (
    <g>
      <path d={c.side} fill={shade.left} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <ellipse cx={c.topCenter[0]} cy={c.topCenter[1]} rx={c.rx} ry={c.ry} fill={shade.top} stroke={stroke} strokeWidth={sw} />
      {children && <g transform={topMatrix(cx, cy, z + h)}>{children}</g>}
    </g>
  );
}
