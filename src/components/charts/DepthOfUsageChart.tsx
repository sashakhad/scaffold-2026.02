'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DepthOfUsageData } from '@/types';

interface DepthOfUsageChartProps {
  data: DepthOfUsageData[];
}

const BUCKET_ORDER = ['0-100', '101-200', '201-300', '301-400', '401-499', '500+'];
const MONTH_COLORS = ['#D1D5DB', '#9CA3AF', '#F54E00'];

export function DepthOfUsageChart({ data }: DepthOfUsageChartProps) {
  const { chartData, monthNames } = useMemo(() => {
    const months = new Map<string, string>();
    for (const item of data) {
      if (!months.has(item.month)) {
        months.set(item.month, item.month_name);
      }
    }
    const sortedMonths = Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b));
    const names = sortedMonths.map(([, name]) => name);

    const processed = BUCKET_ORDER.map(bucket => {
      const row: Record<string, string | number> = { bucket };
      for (const [monthKey, monthName] of sortedMonths) {
        const match = data.find(d => d.request_bucket === bucket && d.month === monthKey);
        row[monthName] = match?.user_count ?? 0;
      }
      return row;
    });

    return { chartData: processed, monthNames: names };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className='flex h-full items-center justify-center text-gray-400'>
        No depth of usage data available
      </div>
    );
  }

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis
            dataKey='bucket'
            tick={{ fontSize: 12 }}
            label={{ value: 'Agent Requests', position: 'bottom', offset: -5 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: 'Users', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
          <Legend />
          {monthNames.map((name, idx) => {
            const isLast = idx === monthNames.length - 1;
            return (
              <Bar
                key={name}
                dataKey={name}
                fill={MONTH_COLORS[idx % MONTH_COLORS.length] ?? '#9CA3AF'}
                {...(isLast ? { radius: [4, 4, 0, 0] as [number, number, number, number] } : {})}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
