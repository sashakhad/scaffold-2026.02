'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SpendBucket {
  label: string;
  userCount: number;
  percentage: number;
}

interface SpendDistribution {
  buckets: SpendBucket[];
  statistics?: {
    avgSpend: number;
    medianSpend: number;
    totalUsers: number;
  };
}

interface UserSpendDistributionChartProps {
  data: SpendDistribution;
}

export function UserSpendDistributionChart({ data }: UserSpendDistributionChartProps) {
  if (!data || !data.buckets || !Array.isArray(data.buckets) || data.buckets.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>User Distribution</CardTitle>
          <CardDescription>Distribution of users by usage level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">No distribution data available</div>
        </CardContent>
      </Card>
    );
  }

  const maxUserCount = Math.max(...data.buckets.map((bucket) => bucket.userCount));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Distribution</CardTitle>
        <CardDescription>Distribution of users by usage level</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            {data.buckets.map((bucket) => (
              <div key={bucket.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{bucket.label}</span>
                  <span className="text-muted-foreground">
                    {bucket.userCount} users ({bucket.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="relative h-6 w-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="absolute left-0 top-0 h-6 bg-blue-600 transition-all duration-300 dark:bg-blue-500"
                    style={{
                      width: `${maxUserCount > 0 ? (bucket.userCount / maxUserCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {data.statistics && (
            <div className="border-t pt-3 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Total Users: {data.statistics.totalUsers}</span>
                <span>
                  Avg Cost: ${data.statistics.avgSpend.toFixed(2)} / Median: $
                  {data.statistics.medianSpend.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
