import { riskBar, capitalize } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

/** Single-series column chart (e.g. cases per week). Hover a column for its exact value. */
export function ColumnChart({ data, label, height = 230 }: {
  data: { key: string; label: string; value: number }[]; label: string; height?: number;
}) {
  // Round the axis up to an even number so the midline tick is an exact integer.
  const peak = Math.max(1, ...data.map((d) => d.value));
  const max = peak <= 1 ? 2 : Math.ceil(peak / 2) * 2;
  const ticks = [max, max / 2, 0];
  return (
    <figure aria-label={label}>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between pb-5 text-right text-[10px] tabular-nums text-subtle" style={{ height }}>
          {ticks.map((t, i) => <span key={i}>{t}</span>)}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 20 }}>
            {ticks.map((_, i) => <div key={i} className="border-t border-dashed border-border" />)}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height: height - 20 }}>
            {data.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 items-end justify-center">
                <div className="w-full max-w-7 rounded-t-[4px] bg-chart transition-opacity group-hover:opacity-75"
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 0 }} />
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-white shadow group-hover:block">
                  {d.label}: <b>{d.value}</b>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-[2px] text-[10px] text-subtle">
            {data.map((d, i) => (
              <span key={d.key} className="flex-1 text-center">{i % 2 === data.length % 2 ? "" : d.label}</span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

const ORDER: RiskLevel[] = ["low", "medium", "high", "critical"];

/** Distribution of farmers across risk bands — status colours, always with labels and counts. */
export function RiskDistribution({ bands }: { bands: { level: string; count: number }[] }) {
  const total = bands.reduce((s, b) => s + b.count, 0) || 1;
  const get = (l: RiskLevel) => bands.find((b) => b.level === l)?.count ?? 0;
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {ORDER.map((l) => get(l) > 0 && (
          <div key={l} className={`${riskBar[l]} h-full`} style={{ width: `${(get(l) / total) * 100}%` }} title={`${capitalize(l)}: ${get(l)}`} />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-4 gap-2">
        {ORDER.map((l) => (
          <div key={l}>
            <dt className="flex items-center gap-1.5 text-[11px] text-muted"><span className={`h-2 w-2 rounded-full ${riskBar[l]}`} />{capitalize(l)}</dt>
            <dd className="text-lg font-semibold tabular-nums">{get(l)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
