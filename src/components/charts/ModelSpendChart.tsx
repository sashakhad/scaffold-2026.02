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
import { getModelColor } from '@/lib/chart-colors';
import type { ModelSpendData } from '@/types';

interface ModelSpendChartProps {
  data: ModelSpendData[];
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

export function ModelSpendChart({ data }: ModelSpendChartProps) {
  const { chartData, models } = useMemo(() => {
    const monthMap = new Map<string, Record<string, number>>();
    const modelSet = new Set<string>();

    for (const row of data) {
      const key = row.month;
      const model = row.standardized_model_clean || row.standardized_model || 'Other';
      modelSet.add(model);

      const existing = monthMap.get(key) ?? {};
      existing[model] = (existing[model] ?? 0) + row.api_cost_usd_month;
      monthMap.set(key, existing);
    }

    const sortedMonths = Array.from(monthMap.keys()).sort();
    const processedData = sortedMonths.map(month => ({
      month: formatMonth(month),
      ...monthMap.get(month),
    }));

    const sortedModels = Array.from(modelSet).sort((a, b) => {
      let totalA = 0;
      let totalB = 0;
      for (const row of data) {
        const model = row.standardized_model_clean || row.standardized_model || 'Other';
        if (model === a) {
          totalA += row.api_cost_usd_month;
        }
        if (model === b) {
          totalB += row.api_cost_usd_month;
        }
      }
      return totalB - totalA;
    });

    return { chartData: processedData, models: sortedModels };
  }, [data]);

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
          {models.map(model => (
            <Bar key={model} dataKey={model} stackId='spend' fill={getModelColor(model)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
