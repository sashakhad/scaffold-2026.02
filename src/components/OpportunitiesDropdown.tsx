'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface Opportunity {
  id: string;
  name: string;
  cursor_team_id_c: string | null;
}

interface OpportunitiesDropdownProps {
  accountName: string;
  onOpportunitiesSelect: (opportunities: Opportunity[]) => void;
  selectedOpportunities: Opportunity[];
}

function hasValidTeamId(opportunity: Opportunity): boolean {
  return Boolean(opportunity.cursor_team_id_c && opportunity.cursor_team_id_c.trim() !== '');
}

export function OpportunitiesDropdown({
  accountName,
  onOpportunitiesSelect,
  selectedOpportunities = [],
}: OpportunitiesDropdownProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountName) {
      fetchOpportunities(accountName);
    } else {
      setOpportunities([]);
    }
     
  }, [accountName]);

  async function fetchOpportunities(account: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/opportunities?accountName=${encodeURIComponent(account)}`
      );
      if (!response.ok) {throw new Error(`HTTP ${response.status}`);}

      const data: { opportunities: Opportunity[] } = await response.json();
      if (Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
      } else {
        setOpportunities([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleToggle(opportunity: Opportunity) {
    const isSelected = selectedOpportunities.some((opp) => opp.id === opportunity.id);
    if (isSelected) {
      onOpportunitiesSelect(selectedOpportunities.filter((opp) => opp.id !== opportunity.id));
    } else {
      onOpportunitiesSelect([...selectedOpportunities, opportunity]);
    }
  }

  function handleSelectAll() {
    onOpportunitiesSelect(opportunities.filter(hasValidTeamId));
  }

  function handleClearAll() {
    onOpportunitiesSelect([]);
  }

  return (
    <Card className="flex h-full w-full max-w-md flex-col">
      <CardHeader className="pb-4">
        <CardTitle>Select Opportunities</CardTitle>
        <CardDescription>Choose one or more opportunities for {accountName}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <Label>Opportunities</Label>

          {isLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              Loading opportunities...
            </div>
          )}

          {!isLoading && opportunities.length > 0 && (
            <>
              <div className="flex gap-2 border-b pb-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
              <div className="max-h-60 space-y-1 overflow-auto">
                {opportunities.map((opp) => {
                  const valid = hasValidTeamId(opp);
                  const selected = selectedOpportunities.some((s) => s.id === opp.id);
                  return (
                    <button
                      key={opp.id}
                      onClick={valid ? () => handleToggle(opp) : undefined}
                      disabled={!valid}
                      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${
                        valid
                          ? 'hover:bg-accent cursor-pointer'
                          : 'cursor-not-allowed border-l-4 border-red-400 bg-red-50 opacity-60 dark:bg-red-900/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!valid}
                        readOnly
                        className="h-4 w-4"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">{opp.name}</span>
                        <span className={`text-xs ${valid ? 'text-gray-500' : 'font-medium text-red-600'}`}>
                          {valid ? `Team ID: ${opp.cursor_team_id_c}` : 'No team ID - Cannot select'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!isLoading && opportunities.length === 0 && !error && (
            <p className="py-4 text-center text-sm text-gray-500">No opportunities found</p>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          {selectedOpportunities.length > 0 && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">
                Selected: {selectedOpportunities.length}{' '}
                {selectedOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
              </p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {selectedOpportunities.map((opp) => (
                  <p key={opp.id} className="text-sm text-green-800 dark:text-green-200">
                    {opp.name} (Team ID: {opp.cursor_team_id_c})
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
