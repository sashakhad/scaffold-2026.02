'use client';

interface QueryHeaderProps {
  teamId: string;
  accountName?: string | undefined;
  opportunityName?: string | undefined;
  dateRange: { start: string; end: string } | null;
  isDirectInput: boolean;
}

export function QueryHeader({
  teamId,
  accountName,
  opportunityName,
  dateRange,
  isDirectInput,
}: QueryHeaderProps) {
  function formatDateRange() {
    if (!dateRange) {return 'No date range selected';}
    const start = new Date(`${dateRange.start  }T00:00:00`);
    const end = new Date(`${dateRange.end  }T00:00:00`);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} - ${fmt(end)}`;
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-900">
      <div className="w-full px-4 py-3">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground font-medium">
                  Team{teamId.includes(',') ? 's' : ''}:
                </span>
                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                  {teamId}
                </span>
              </div>

              {!isDirectInput && accountName && (
                <>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-medium">Account:</span>
                    <span>{accountName}</span>
                  </div>
                </>
              )}

              {!isDirectInput && opportunityName && (
                <>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-medium">Opportunity:</span>
                    <span>{opportunityName}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              {formatDateRange()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
