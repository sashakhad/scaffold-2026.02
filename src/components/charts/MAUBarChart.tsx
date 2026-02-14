'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/lib/chart-colors';
import type { MAUGrowthData } from '@/types';

interface MAUBarChartProps {
  data: MAUGrowthData[];
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

export function MAUBarChart({ data }: MAUBarChartProps) {
  const chartData = data.map(d => ({
    month: formatMonth(d.month),
    MAUs: d.MAUs,
  }));

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='month' tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number | undefined) => [value?.toLocaleString() ?? '0', 'MAU']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey='MAUs' fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
