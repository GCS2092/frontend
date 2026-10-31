import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

const tip = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow-md)',
}
const tick = { fill: '#8b94a3', fontSize: 12 }

export function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card chart-card">
      <div className="chart-head">
        <div className="chart-title">{title}</div>
        {subtitle && <div className="small muted">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

export function DonutCard({ title, subtitle, data, format = (v) => String(v), centerLabel, centerValue }) {
  const items = data.filter((d) => Number(d.value) > 0)
  const total = items.reduce((s, d) => s + Number(d.value), 0)
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!items.length ? <div className="chart-empty muted">Pas de données</div> : (
        <div className="donut">
          <div className="donut-plot">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={items} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%"
                  paddingAngle={items.length > 1 ? 2 : 0} stroke="var(--surface)" strokeWidth={2}>
                  {items.map((d, i) => <Cell key={d.name} fill={d.color || PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tip} formatter={(v) => format(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <div className="small muted">{centerLabel || 'Total'}</div>
              <div className="donut-total">{centerValue ?? format(total)}</div>
            </div>
          </div>
          <ul className="legend">
            {items.map((d, i) => (
              <li key={d.name}>
                <span className="dot" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
                <span className="legend-name">{d.name}</span>
                <span className="legend-val">{format(d.value)}</span>
                <span className="legend-pct muted">{Math.round((d.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  )
}

export function BarCard({ title, subtitle, data, series, format = (v) => String(v), height = 260 }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!data.length ? <div className="chart-empty muted">Pas de données</div> : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--border)' }} interval={0}
                tickFormatter={(s) => (String(s).length > 10 ? String(s).slice(0, 9) + '…' : s)} />
              <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tip} cursor={{ fill: 'var(--surface-2)' }} formatter={(v) => format(v)} />
              {series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color || PALETTE[i]} radius={[4, 4, 0, 0]} maxBarSize={36} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.length > 0 && series.length > 1 && (
        <ul className="legend inline">
          {series.map((s, i) => (
            <li key={s.key}><span className="dot" style={{ background: s.color || PALETTE[i] }} />{s.name}</li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}