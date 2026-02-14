'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/lib/chart-colors';
import type { MonthlySpendData } from '@/types';

interface MonthlySpendChartProps {
  data: MonthlySpendData[];
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

export function MonthlySpendChart({ data }: MonthlySpendChartProps) {
  const chartData = data.map(d => ({
    month: formatMonth(d.month),
    'API Cost': d.api_cost_usd_month,
    'Cursor Token Fee': d.cursor_token_fee_calc_usd_month,
    'Total Spend': d.total_spend_usd_month,
  }));

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='month' tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              `$${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
              name ?? '',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Area
            type='monotone'
            dataKey='API Cost'
            stackId='1'
            stroke={CHART_COLORS.primary}
            fill={CHART_COLORS.primary}
            fillOpacity={0.6}
          />
          <Area
            type='monotone'
            dataKey='Cursor Token Fee'
            stackId='1'
            stroke={CHART_COLORS.secondary}
            fill={CHART_COLORS.secondary}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
