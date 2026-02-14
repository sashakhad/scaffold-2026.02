'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ChartSkeleton() {
  return (
    <div className='space-y-4 rounded-lg border bg-white p-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-8 w-24' />
      </div>
      <Skeleton className='h-[350px] w-full' />
    </div>
  );
}
