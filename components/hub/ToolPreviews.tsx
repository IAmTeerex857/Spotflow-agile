/* Mini product previews shown at the top of each hub tool card.
   Pure CSS/SVG recreations of the prototype's faux "browser" frames. */

function BrowserDots({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="h-2 w-2 rounded-full bg-border-strong" />
      ))}
    </>
  );
}

export function PokerPreview() {
  const cards = [
    { v: "2", rot: -9, w: 34, h: 48, sel: false },
    { v: "3", rot: -4, w: 34, h: 48, sel: false },
    { v: "5", rot: 0, w: 38, h: 54, sel: true },
    { v: "8", rot: 4, w: 34, h: 48, sel: false },
    { v: "13", rot: 9, w: 34, h: 48, sel: false },
  ];
  return (
    <div
      className="relative h-[236px] overflow-hidden border-b border-border px-6 pt-6"
      style={{
        background:
          "radial-gradient(120% 85% at 50% 0%, color-mix(in srgb, var(--poker-soft) 55%, var(--bg-subtle)), var(--bg-subtle) 58%)",
      }}
    >
      <div className="mx-auto max-w-[340px] overflow-hidden rounded-t-xl border border-border bg-surface shadow-md-t">
        <div className="flex items-center gap-[6px] border-b border-border px-3 py-[9px]">
          <BrowserDots />
          <span className="mono ml-auto text-[9.5px] text-text-3">fe-sprint-45</span>
        </div>
        <div className="px-4 pb-[22px] pt-4">
          <div className="mb-4 text-center text-[11px] font-medium text-text-2">
            Reconciliation report: balance drilldown
          </div>
          <div className="flex items-end justify-center gap-[7px]">
            {cards.map((c) => (
              <div
                key={c.v}
                className={`flex items-center justify-center rounded-[7px] border-[1.5px] ${
                  c.sel ? "border-poker bg-poker-soft" : "border-border-strong bg-surface"
                }`}
                style={{
                  width: c.w,
                  height: c.h,
                  transform: c.sel ? "translateY(-4px)" : `rotate(${c.rot}deg)`,
                  transformOrigin: "bottom",
                }}
              >
                <span
                  className={`mono font-semibold ${c.sel ? "text-poker" : "text-text-2"}`}
                  style={{ fontSize: c.sel ? 16 : 14 }}
                >
                  {c.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-poker-border bg-surface px-3 py-[5px] text-[10.5px] font-medium text-poker shadow-sm-t">
        Everyone flips at once
      </div>
    </div>
  );
}

function RetroSkeletonCol({
  label,
  labelClass,
  cards,
}: {
  label: string;
  labelClass: string;
  cards: { h: number; lines: { w: string; accent?: boolean }[]; accent?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <div className={`mono text-[8.5px] tracking-[0.03em] ${labelClass}`}>{label}</div>
      {cards.map((card, i) => (
        <div
          key={i}
          className={`rounded-[6px] border p-[5px_6px] ${
            card.accent ? "border-retro-border bg-retro-soft" : "border-border bg-bg-subtle"
          }`}
          style={{ height: card.h }}
        >
          {card.lines.map((ln, j) => (
            <div
              key={j}
              className={`h-1 rounded-[2px] ${card.accent ? "bg-retro" : "bg-border-strong"}`}
              style={{ width: ln.w, opacity: card.accent ? 0.7 : 1, marginTop: j ? 4 : 0 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function RetroPreview() {
  return (
    <div
      className="relative h-[236px] overflow-hidden border-b border-border px-[22px] pt-[22px]"
      style={{
        background:
          "radial-gradient(120% 85% at 50% 0%, color-mix(in srgb, var(--retro-soft) 55%, var(--bg-subtle)), var(--bg-subtle) 58%)",
      }}
    >
      <div className="mx-auto max-w-[360px] overflow-hidden rounded-t-xl border border-border bg-surface shadow-md-t">
        <div className="flex items-center gap-2 border-b border-border px-3 py-[9px]">
          <BrowserDots count={2} />
          <div className="ml-auto flex items-center gap-[5px]">
            <span className="h-[5px] w-[14px] rounded-full bg-retro" />
            <span className="h-[5px] w-[14px] rounded-full bg-retro" />
            <span className="h-[5px] w-[14px] rounded-full bg-border-strong" />
            <span className="h-[5px] w-[14px] rounded-full bg-border-strong" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-[9px] px-[13px] pb-5 pt-[14px]">
          <RetroSkeletonCol
            label="WENT WELL"
            labelClass="text-text-3"
            cards={[
              { h: 30, lines: [{ w: "80%" }, { w: "55%" }] },
              { h: 26, lines: [{ w: "65%" }] },
            ]}
          />
          <RetroSkeletonCol
            label="TO IMPROVE"
            labelClass="text-text-3"
            cards={[
              { h: 30, lines: [{ w: "70%" }, { w: "50%" }] },
              { h: 26, lines: [{ w: "60%" }] },
            ]}
          />
          <RetroSkeletonCol
            label="ACTIONS"
            labelClass="text-retro"
            cards={[
              { h: 30, accent: true, lines: [{ w: "78%" }, { w: "52%" }] },
              { h: 26, lines: [{ w: "58%" }] },
            ]}
          />
        </div>
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-retro-border bg-surface px-3 py-[5px] text-[10.5px] font-medium text-retro shadow-sm-t">
        Anonymous · start from a link
      </div>
    </div>
  );
}
