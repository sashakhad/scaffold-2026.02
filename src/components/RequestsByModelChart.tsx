'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ModelBreakdown {
  model: string;
  requests: number;
  totalTokens: number;
  tokenCostDollars: number;
  cursorFeeDollars: number;
  totalCostDollars: number;
}

interface RequestsByModelChartProps {
  data: ModelBreakdown[];
}

function formatModelName(model: string): string {
  return model
    .replace('gpt-', 'GPT-')
    .replace('claude-', 'Claude ')
    .replace('opus', 'Opus')
    .replace('sonnet', 'Sonnet');
}

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {return `${(value / 1_000_000_000).toFixed(1)}B`;}
  if (value >= 1_000_000) {return `${(value / 1_000_000).toFixed(1)}M`;}
  if (value >= 1_000) {return `${(value / 1_000).toFixed(1)}K`;}
  return value.toString();
}

export function RequestsByModelChart({ data }: RequestsByModelChartProps) {
  const chartData = data
    .map((item) => ({
      model: item.model,
      requests: item.requests,
      displayName: formatModelName(item.model),
    }))
    .sort((a, b) => b.requests - a.requests);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Requests by Model</CardTitle>
        <CardDescription>Number of API requests made for each AI model</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="displayName"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip
                formatter={(value: number | undefined) => [
                  `${(value ?? 0).toLocaleString()} requests`,
                  '',
                ]}
              />
              <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
