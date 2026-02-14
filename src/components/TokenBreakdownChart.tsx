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

interface TokenBreakdownChartProps {
  data: ModelBreakdown[];
}

function formatModelName(model: string): string {
  return model
    .replace('gpt-', 'GPT-')
    .replace('claude-', 'Claude ')
    .replace('opus', 'Opus')
    .replace('sonnet', 'Sonnet');
}

export function TokenBreakdownChart({ data }: TokenBreakdownChartProps) {
  const chartData = data
    .map((item) => ({
      model: item.model,
      cost: item.totalCostDollars,
      apiCost: item.tokenCostDollars,
      cursorFee: item.cursorFeeDollars,
      displayName: formatModelName(item.model),
    }))
    .sort((a, b) => b.cost - a.cost);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cost Breakdown by Model</CardTitle>
        <CardDescription>API cost and Cursor Token Fee per model</CardDescription>
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
              <YAxis tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
              <Tooltip
                formatter={(value: number | undefined, name: string | undefined) => [
                  `$${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                  name ?? '',
                ]}
              />
              <Bar dataKey="apiCost" stackId="cost" fill="#3b82f6" name="API Cost" />
              <Bar
                dataKey="cursorFee"
                stackId="cost"
                fill="#10b981"
                name="Cursor Token Fee"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
