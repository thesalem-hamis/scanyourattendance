import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHURCHES, CHURCH_GROUPS } from '@/config/churches';
import { formatServiceDate } from '@/lib/dates';
import type { TrendPoint } from '../services/statsService';

/** Sunday by Sunday, each church side by side. Oldest on the left. */
export function AttendanceTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
        No check-ins yet. The chart appears after your first Sunday.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-background p-4">
      <div
        role="img"
        aria-label={`Bar chart of attendance for the last ${data.length} service dates, for each church`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Legend />
            {CHURCH_GROUPS.map((group) => (
              <Bar
                key={group}
                dataKey={group}
                name={CHURCHES[group].label}
                fill={CHURCHES[group].chart}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* The same numbers as text: for screen readers, and for reading exact values */}
      <details className="text-sm">
        <summary className="cursor-pointer font-medium">Show the numbers</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 pr-4 font-medium">Date</th>
                {CHURCH_GROUPS.map((group) => (
                  <th key={group} className="py-1 pr-4 font-medium">
                    {group}
                  </th>
                ))}
                <th className="py-1 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((point) => (
                <tr key={point.serviceDate} className="border-t">
                  <td className="py-1 pr-4">{formatServiceDate(point.serviceDate)}</td>
                  {CHURCH_GROUPS.map((group) => (
                    <td key={group} className="py-1 pr-4 tabular-nums">
                      {point[group]}
                    </td>
                  ))}
                  <td className="py-1 font-medium tabular-nums">{point.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
