'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<30 | 60 | 90>(30);
  const hasInitialized = useRef(false);

  const formatDate = useCallback((date: Date) => date.toISOString().split('T')[0] ?? '', []);

  const calculateDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start, end };
  }, []);

  const handlePeriodSelect = useCallback(
    (days: 30 | 60 | 90) => {
      setSelectedPeriod(days);
      const { start, end } = calculateDateRange(days);
      onDateRangeChange(formatDate(start), formatDate(end));
    },
    [calculateDateRange, formatDate, onDateRangeChange]
  );

  useEffect(() => {
    if (!hasInitialized.current) {
      const { start, end } = calculateDateRange(30);
      onDateRangeChange(formatDate(start), formatDate(end));
      hasInitialized.current = true;
    }
  }, [calculateDateRange, formatDate, onDateRangeChange]);

  const { start, end } = calculateDateRange(selectedPeriod);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Date Range</CardTitle>
        <CardDescription>Select the time period for token usage analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 30 ? 'default' : 'outline'}
            onClick={() => handlePeriodSelect(30)}
            className="flex-1"
          >
            Last 30 Days
          </Button>
          <Button
            variant={selectedPeriod === 60 ? 'default' : 'outline'}
            onClick={() => handlePeriodSelect(60)}
            className="flex-1"
          >
            Last 60 Days
          </Button>
          <Button
            variant={selectedPeriod === 90 ? 'default' : 'outline'}
            onClick={() => handlePeriodSelect(90)}
            className="flex-1"
          >
            Last 90 Days
          </Button>
        </div>

        <div className="text-muted-foreground border-t pt-2 text-center text-sm">
          <span className="font-medium">{formatDate(start)}</span>
          {' to '}
          <span className="font-medium">{formatDate(end)}</span>
          <span className="mt-1 block text-xs">({selectedPeriod} days of data)</span>
        </div>
      </CardContent>
    </Card>
  );
}
