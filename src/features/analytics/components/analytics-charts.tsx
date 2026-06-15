'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { Analytics } from '../api/get-analytics';
import { formatXof } from '../utils/format';

// Palette on-brand, théma-aware (tokens sémantiques) — pas de palette Tailwind brute.
const SERIES_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
];

const axisProps = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string; payload?: { name?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const title = label ?? p.payload?.name ?? p.name ?? '';
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-soft">
      {title ? (
        <p className="mb-0.5 font-medium text-foreground">{title}</p>
      ) : null}
      <p className="text-muted-foreground">{formatXof(Number(p.value ?? 0))}</p>
    </div>
  );
}

/** Tendance des dons dans le temps (aire). */
export function TrendChart({ series }: { series: Analytics['series'] }) {
  const data = series.map((s) => ({ name: s.bucket ?? '', value: s.total }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" {...axisProps} />
        <YAxis
          {...axisProps}
          width={48}
          tickFormatter={(v: number) => formatXof(v, true)}
        />
        <Tooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Classement spatial (par église/paroisse/diocèse) — barres horizontales. */
export function RankingChart({ ranking }: { ranking: Analytics['ranking'] }) {
  const data = ranking
    .slice(0, 10)
    .map((r) => ({ name: r.name ?? '—', value: r.total }));
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 34)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          {...axisProps}
          tickFormatter={(v: string) =>
            v.length > 18 ? `${v.slice(0, 17)}…` : v
          }
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Composition par type de don (anneau). */
export function TypeDonut({ byType }: { byType: Analytics['by_type'] }) {
  const data = byType
    .filter((t) => t.total > 0)
    .map((t) => ({ name: t.label, value: t.total }));
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={48}
          outerRadius={80}
          paddingAngle={2}
          stroke="hsl(var(--card))"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

const RANKING_TITLE: Record<Analytics['ranking_level'], string> = {
  church: 'Dons par église',
  parish: 'Dons par paroisse',
  diocese: 'Dons par diocèse',
};

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

/** Grille de graphiques — importée en lazy (ssr:false) car recharts mesure le DOM. */
export default function AnalyticsCharts({ data }: { data: Analytics }) {
  const hasRanking = data.ranking.some((r) => r.total > 0);
  const hasType = data.by_type.some((t) => t.total > 0);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Panel title="Tendance des dons">
          <TrendChart series={data.series} />
        </Panel>
      </div>
      {hasType && (
        <Panel title="Répartition par type">
          <TypeDonut byType={data.by_type} />
        </Panel>
      )}
      {hasRanking && (
        <div className="lg:col-span-3">
          <Panel title={RANKING_TITLE[data.ranking_level]}>
            <RankingChart ranking={data.ranking} />
          </Panel>
        </div>
      )}
    </div>
  );
}
