'use client';

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
import { CHART_COLORS } from '@/lib/chart-colors';
import type { TopUserData } from '@/types';

interface TopUsersTableProps {
  data: TopUserData[];
}

function truncateEmail(email: string): string {
  if (email.length <= 20) {
    return email;
  }
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return email.slice(0, 20);
  }
  return `${local.slice(0, 8)}...@${domain}`;
}

export function TopUsersTable({ data }: TopUsersTableProps) {
  const chartData = data.map(user => ({
    email: truncateEmail(user.email),
    'Agent Requests': user.agent_requests,
    'AI Lines': user.ai_lines,
    'Tab Lines': user.tab_lines,
  }));

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={chartData}
          layout='vertical'
          margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis type='number' tick={{ fontSize: 12 }} />
          <YAxis type='category' dataKey='email' tick={{ fontSize: 11 }} width={110} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
          <Legend />
          <Bar dataKey='Agent Requests' fill={CHART_COLORS.primary} />
          <Bar dataKey='AI Lines' fill={CHART_COLORS.secondary} />
          <Bar dataKey='Tab Lines' fill={CHART_COLORS.tertiary} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
