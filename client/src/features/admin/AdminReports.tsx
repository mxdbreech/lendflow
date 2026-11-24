import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCents, useCurrencySymbol } from '@/lib/utils'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts'
import { Download } from 'lucide-react'

interface OriginationRow { month: string; volume: number; count: number; funded: number }
interface NplRow { grade: string; total: number; defaulted: number; npl_rate: number }
interface RevenueRow { month: string; fees: number; cumulative: number }
interface CohortRow { month: string; originated: number; completed: number; defaulted: number; active: number; volume: number }

const GRADE_COLORS: Record<string, string> = {
  A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', E: '#ef4444',
}

export function AdminReports() {
  const symbol = useCurrencySymbol()
  const { data: origination, isLoading: origLoading } = useQuery({
    queryKey: ['admin-origination'],
    queryFn: async () => {
      const { data } = await api.get<{ origination: OriginationRow[] }>('/api/admin/reports/origination')
      return data.origination
    },
  })

  const { data: npl } = useQuery({
    queryKey: ['admin-npl'],
    queryFn: async () => {
      const { data } = await api.get<{ npl: NplRow[] }>('/api/admin/reports/npl')
      return data.npl
    },
  })

  const { data: revenue } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const { data } = await api.get<{ revenue: RevenueRow[] }>('/api/admin/reports/revenue')
      return data.revenue
    },
  })

  const { data: cohort } = useQuery({
    queryKey: ['admin-cohort'],
    queryFn: async () => {
      const { data } = await api.get<{ cohort: CohortRow[] }>('/api/admin/reports/cohort')
      return data.cohort
    },
  })

  function downloadCSV(data: object[], filename: string) {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify((row as Record<string, unknown>)[h] ?? '')).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (origLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      </div>
    )
  }

  const totalVolume = origination?.reduce((s, r) => s + r.volume, 0) ?? 0
  const totalOriginated = origination?.reduce((s, r) => s + r.count, 0) ?? 0
  const totalRevenue = revenue?.slice(-1)[0]?.cumulative ?? 0
  const overallNPL = npl
    ? (npl.reduce((s, r) => s + r.defaulted, 0) / Math.max(1, npl.reduce((s, r) => s + r.total, 0))) * 100
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform Reports</h1>
        <p className="text-muted-foreground mt-1">Origination trends, NPL analysis, and revenue (last 12 months)</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Loans Originated (12mo)', value: String(totalOriginated) },
          { label: 'Total Volume (12mo)', value: formatCents(totalVolume) },
          { label: 'Origination Fee Revenue', value: formatCents(totalRevenue), accent: true },
          { label: 'Overall NPL Rate', value: `${overallNPL.toFixed(2)}%`, warn: overallNPL > 5 },
        ].map(({ label, value, accent, warn }) => (
          <div key={label} className="card-base p-4 sm:p-5 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg sm:text-2xl font-bold mt-1 break-words ${accent ? 'text-emerald-700' : warn ? 'text-red-600' : ''}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Origination trends */}
      {origination && origination.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold">Monthly Origination Volume</h2>
            <button
              onClick={() => downloadCSV(origination, 'origination-trends.csv')}
              className="flex min-h-11 shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
          <div className="card-base p-3 sm:p-5 min-w-0">
            <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={origination} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={12} />
                <YAxis yAxisId="left" width={36} tickFormatter={v => `${symbol}${(v / 100000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" width={28} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => name === 'Volume' ? formatCents(v as number) : (v as number)} />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" name="Volume" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="right" dataKey="count" name="Count" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* NPL by grade */}
      {npl && npl.some(r => r.total > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">NPL Rate by Credit Grade</h2>
            <button
              onClick={() => downloadCSV(npl, 'npl-by-grade.csv')}
              className="flex min-h-11 shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
          <div className="card-base p-3 sm:p-5 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {npl.map(row => (
                <div key={row.grade} className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: GRADE_COLORS[row.grade] }}>
                    {row.grade}
                  </div>
                  <div className="text-sm font-semibold mt-1">{row.npl_rate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">{row.defaulted}/{row.total} loans</div>
                </div>
              ))}
            </div>
            <div className="h-[200px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={npl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                <YAxis width={36} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => `${v}%`} />
                <Bar dataKey="npl_rate" name="NPL Rate (%)" radius={[2, 2, 0, 0]}>
                  {npl.map(row => (
                    <Cell key={row.grade} fill={GRADE_COLORS[row.grade] ?? '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Platform revenue */}
      {revenue && revenue.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Origination Fee Revenue</h2>
            <button
              onClick={() => downloadCSV(revenue, 'platform-revenue.csv')}
              className="flex min-h-11 shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
          <div className="card-base p-3 sm:p-5 min-w-0">
            <div className="h-[200px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={12} />
                <YAxis width={40} tickFormatter={v => `${symbol}${(v / 100).toFixed(0)}`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => formatCents(v as number)} />
                <Legend />
                <Line type="monotone" dataKey="fees" name="Monthly Fees" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Cohort performance */}
      {cohort && cohort.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Cohort Performance</h2>
            <button
              onClick={() => downloadCSV(cohort, 'cohort-performance.csv')}
              className="flex min-h-11 shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <div className="md:hidden divide-y">
              {cohort.map(row => {
                const defaultRate = row.originated > 0 ? ((row.defaulted / row.originated) * 100).toFixed(1) : '0.0'
                return (
                  <div key={row.month} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{row.month}</p>
                      <p className="font-mono text-sm">{formatCents(row.volume)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Originated <span className="text-foreground">{row.originated}</span></span>
                      <span className="text-muted-foreground">Active <span className="text-blue-600">{row.active}</span></span>
                      <span className="text-muted-foreground">Completed <span className="text-emerald-600">{row.completed}</span></span>
                      <span className="text-muted-foreground">Defaulted <span className="text-red-600">{row.defaulted}</span></span>
                    </div>
                    <p className={`text-sm ${parseFloat(defaultRate) > 5 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      Default rate {defaultRate}%
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Cohort</th>
                  <th className="text-right p-3 font-medium">Originated</th>
                  <th className="text-right p-3 font-medium">Active</th>
                  <th className="text-right p-3 font-medium">Completed</th>
                  <th className="text-right p-3 font-medium">Defaulted</th>
                  <th className="text-right p-3 font-medium">Default Rate</th>
                  <th className="text-right p-3 font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {cohort.map(row => {
                  const defaultRate = row.originated > 0 ? ((row.defaulted / row.originated) * 100).toFixed(1) : '0.0'
                  return (
                    <tr key={row.month} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{row.month}</td>
                      <td className="p-3 text-right">{row.originated}</td>
                      <td className="p-3 text-right text-blue-600">{row.active}</td>
                      <td className="p-3 text-right text-emerald-600">{row.completed}</td>
                      <td className="p-3 text-right text-red-600">{row.defaulted}</td>
                      <td className="p-3 text-right">
                        <span className={parseFloat(defaultRate) > 5 ? 'text-red-600 font-medium' : ''}>
                          {defaultRate}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">{formatCents(row.volume)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
