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
import type { FeatureAdoptionPercentageData } from '@/types';

interface FeatureAdoptionChartProps {
  data: FeatureAdoptionPercentageData[];
}

function formatWeek(date: string): string {
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

export function FeatureAdoptionChart({ data }: FeatureAdoptionChartProps) {
  const chartData = data.map(d => ({
    week: formatWeek(d.week_start),
    Rules: d.rules_pct_of_wau ?? 0,
    MCP: d.mcp_pct_of_wau ?? 0,
    Agent: d.agent_pct_of_wau ?? 0,
    'Plan Mode': d.plan_mode_pct_of_wau ?? 0,
    Commands: d.commands_pct_of_wau ?? 0,
  }));

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='week' tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              `${(value ?? 0).toFixed(1)}%`,
              name ?? '',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Line
            type='monotone'
            dataKey='Rules'
            stroke={CHART_COLORS.line1}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='Commands'
            stroke={CHART_COLORS.line2}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='MCP'
            stroke={CHART_COLORS.line3}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='Agent'
            stroke={CHART_COLORS.line4}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type='monotone'
            dataKey='Plan Mode'
            stroke={CHART_COLORS.line5}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
