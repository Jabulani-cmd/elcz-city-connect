import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const COLORS = ["#2f7d4a", "#d98e04", "#2b7bb9", "#b5483a", "#7a5ea8", "#3d9a99", "#8a6d3b"];
const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };
const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))", fontSize: 12 };

export function LineCard({ data, x, lines, height = 220, unit }: { data: Record<string, unknown>[]; x: string; lines: { key: string; name?: string; color?: string }[]; height?: number; unit?: string }) {
  return (
    <div role="img" aria-label={`Line chart of ${lines.map((l) => l.name ?? l.key).join(", ")}`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={x} tick={tick} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={tick} tickLine={false} axisLine={false} unit={unit} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {lines.map((l, i) => <Line isAnimationActive={false} key={l.key} type="monotone" dataKey={l.key} name={l.name ?? l.key} stroke={l.color ?? COLORS[i % COLORS.length]} strokeWidth={2.5} dot={data.length <= 14} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarCard({ data, x, bars, height = 220, stacked, unit }: { data: Record<string, unknown>[]; x: string; bars: { key: string; name?: string; color?: string }[]; height?: number; stacked?: boolean; unit?: string }) {
  return (
    <div role="img" aria-label={`Bar chart of ${bars.map((b) => b.name ?? b.key).join(", ")}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={x} tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={tick} tickLine={false} axisLine={false} unit={unit} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
          {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {bars.map((b, i) => <Bar isAnimationActive={false} key={b.key} dataKey={b.key} name={b.name ?? b.key} fill={b.color ?? COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} stackId={stacked ? "s" : undefined} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieCard({ data, height = 220 }: { data: { name: string; value: number }[]; height?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (!total) return <div className="py-10 text-center text-sm text-muted-foreground">No data yet</div>;
  return (
    <div role="img" aria-label="Pie chart">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="80%" paddingAngle={2}>
            {data.map((d, i) => <Cell key={d.name} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
