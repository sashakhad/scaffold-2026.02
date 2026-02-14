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
import { CHART_COLORS } from '@/lib/chart-colors';
import type { TrueUpData } from '@/types';

interface TrueUpsChartProps {
  data: TrueUpData[];
}

interface ProcessedTrueUp {
  name: string;
  closeDate: string;
  existingSeats: number;
  newSeats: number;
  totalSeats: number;
}

export function TrueUpsChart({ data }: TrueUpsChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const sorted = [...data].sort(
      (a, b) => new Date(a.CloseDate).getTime() - new Date(b.CloseDate).getTime()
    );

    let runningSeats = 0;
    const processed: ProcessedTrueUp[] = [];

    for (const item of sorted) {
      const seats = item.License_Count__c ?? 0;
      const existingSeats = runningSeats;
      runningSeats += seats;

      const date = new Date(item.CloseDate);
      const label = `${date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`;

      processed.push({
        name: label,
        closeDate: item.CloseDate,
        existingSeats,
        newSeats: seats,
        totalSeats: runningSeats,
      });
    }

    return processed;
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className='flex h-full items-center justify-center text-gray-400'>
        No true-up data available
      </div>
    );
  }

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='name' tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              (value ?? 0).toLocaleString(),
              name ?? '',
            ]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Bar
            dataKey='existingSeats'
            stackId='seats'
            fill={CHART_COLORS.bar2}
            name='Existing Seats'
          />
          <Bar
            dataKey='newSeats'
            stackId='seats'
            fill={CHART_COLORS.primary}
            name='New Seats'
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
