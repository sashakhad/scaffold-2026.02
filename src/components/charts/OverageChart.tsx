'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/lib/chart-colors';
import type { OverageSpendData } from '@/types';

interface OverageChartProps {
  data: OverageSpendData[];
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthName = months[parseInt(m ?? '0', 10) - 1] ?? m;
  return `${monthName} ${year?.slice(2)}`;
}

export function OverageChart({ data }: OverageChartProps) {
  if (data.length === 0) {
    return (
      <div className='flex h-full items-center justify-center text-gray-400'>
        No overage data available
      </div>
    );
  }

  const chartData = data.map(d => ({
    month: formatMonth(d.month),
    amount: d.amount,
  }));

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='month' tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
          <Tooltip
            formatter={(value: number | undefined) => [
              `$${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
              'Overage',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey='amount' fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
