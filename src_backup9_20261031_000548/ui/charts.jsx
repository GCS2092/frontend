import { useId } from 'react'
import {
  Pie, PieChart, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts'

export const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })
export const shortNum = (v) => compact.format(Number(v) || 0)

const tip = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow-md)', padding: '8px 12px',
}
const tipLabel = { color: 'var(--muted)', marginBottom: 4, fontSize: 12 }
const tipItem = { color: 'var(--text)', padding: 0 }
const tick = { fill: 'var(--muted)', fontSize: 12 }
const cut = (s, n = 10) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : s)

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

const Empty = () => <div className="chart-empty muted">Pas de données</div>

export function DonutCard({ title, subtitle, data, format = (v) => String(v), centerLabel, centerValue }) {
  const items = data.filter((d) => Number(d.value) > 0)
  const total = items.reduce((s, d) => s + Number(d.value), 0)
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!items.length ? <Empty /> : (
        <div className="donut">
          <div className="donut-plot">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={items} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%"
                  paddingAngle={items.length > 1 ? 2 : 0} stroke="var(--surface)" strokeWidth={2} cornerRadius={3}>
                  {items.map((d, i) => <Cell key={d.name} fill={d.color || PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tip} itemStyle={tipItem} labelStyle={tipLabel} formatter={(v) => format(v)} />
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
      {!data.length ? <Empty /> : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--border)' }} interval={0} tickFormatter={(s) => cut(s)} />
              <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={shortNum} />
              <Tooltip contentStyle={tip} itemStyle={tipItem} labelStyle={tipLabel} cursor={{ fill: 'var(--surface-2)' }} formatter={(v) => format(v)} />
              {series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color || PALETTE[i]} radius={[4, 4, 0, 0]} maxBarSize={36} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.length > 0 && series.length > 1 && (
        <ul className="legend inline">
          {series.map((s, i) => <li key={s.key}><span className="dot" style={{ background: s.color || PALETTE[i] }} />{s.name}</li>)}
        </ul>
      )}
    </ChartCard>
  )
}

// Barres horizontales : classements (top produits, stock bas...)
export function HBarCard({ title, subtitle, data, series, format = (v) => String(v), rowHeight = 34 }) {
  const height = Math.max(160, data.length * rowHeight + 36)
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!data.length ? <Empty /> : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={8}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis type="number" tick={tick} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={shortNum} />
              <YAxis type="category" dataKey="name" width={112} tick={tick} tickLine={false} axisLine={false} interval={0} tickFormatter={(s) => cut(s, 16)} />
              <Tooltip contentStyle={tip} itemStyle={tipItem} labelStyle={tipLabel} cursor={{ fill: 'var(--surface-2)' }} formatter={(v) => format(v)} />
              {series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color || PALETTE[i]} radius={[0, 4, 4, 0]} maxBarSize={16} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.length > 0 && series.length > 1 && (
        <ul className="legend inline">
          {series.map((s, i) => <li key={s.key}><span className="dot" style={{ background: s.color || PALETTE[i] }} />{s.name}</li>)}
        </ul>
      )}
    </ChartCard>
  )
}

// Courbe d'évolution : data = [{ name: '01/10', ventes: 120 }, ...]
export function AreaCard({ title, subtitle, data, series, format = (v) => String(v), height = 260 }) {
  const uid = useId().replace(/:/g, '')
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!data.length ? <Empty /> : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <defs>
                {series.map((s, i) => (
                  <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color || PALETTE[i]} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={s.color || PALETTE[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--border)' }} minTickGap={24} />
              <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={shortNum} />
              <Tooltip contentStyle={tip} itemStyle={tipItem} labelStyle={tipLabel} formatter={(v) => format(v)} />
              {series.map((s, i) => (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color || PALETTE[i]} strokeWidth={2}
                  fill={`url(#${uid}-${s.key})`} dot={false} activeDot={{ r: 4 }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}