'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/lib/chart-colors';
import type { ActiveUsersTrendData } from '@/types';

interface ActiveUsersChartProps {
  data: ActiveUsersTrendData[];
}

function formatDate(date: string): string {
  const d = new Date(date);
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
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function ActiveUsersChart({ data }: ActiveUsersChartProps) {
  const chartData = data.map(d => ({
    date: formatDate(d.date),
    WAU: d.weekly_active_users,
    DAU: d.daily_active_users,
    'Power Users': d.power_users,
  }));

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='date' tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
          <Legend />
          <Line
            type='monotone'
            dataKey='WAU'
            stroke={CHART_COLORS.line1}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='DAU'
            stroke={CHART_COLORS.line2}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='Power Users'
            stroke={CHART_COLORS.line3}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
