'use client';

import { useState, useEffect, useCallback } from 'react';
import { AccountSearch } from '@/components/AccountSearch';
import { OpportunitiesDropdown } from '@/components/OpportunitiesDropdown';
import type { Opportunity } from '@/components/OpportunitiesDropdown';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { QueryHeader } from '@/components/QueryHeader';
import { RequestsByModelChart } from '@/components/RequestsByModelChart';
import { TokenBreakdownChart } from '@/components/TokenBreakdownChart';
import { UserSpendDistributionChart } from '@/components/UserSpendDistributionChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ModelBreakdown {
  model: string;
  requests: number;
  totalTokens: number;
  tokenCostDollars: number;
  cursorFeeDollars: number;
  totalCostDollars: number;
}

interface ConsumptionData {
  success: boolean;
  dateRange: { start: string; end: string };
  account: string;
  modelBreakdown: ModelBreakdown[];
  totalTokens: number;
  costMetrics: { totalApiCost: number; cursorTokenFee: number; totalCost: number };
  medianCostPerUser: number;
  spendDistribution: {
    buckets: Array<{ label: string; userCount: number; percentage: number }>;
    statistics?: { avgSpend: number; medianSpend: number; totalUsers: number };
  };
}

export default function Home() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedOpportunities, setSelectedOpportunities] = useState<Opportunity[]>([]);
  const [useDirectInput, setUseDirectInput] = useState(false);
  const [directTeamId, setDirectTeamId] = useState('');
  const [consumptionData, setConsumptionData] = useState<ConsumptionData | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [scopingUsers, setScopingUsers] = useState(0);
  const [cursorTokenFeeDiscount, setCursorTokenFeeDiscount] = useState(0);
  const [bugbotSeats, setBugbotSeats] = useState(0);

  function handleAccountSelect(account: string) {
    setSelectedAccount(account || null);
    setSelectedOpportunities([]);
  }

  // Parse team IDs from either opportunities or direct input
  const currentTeamIds = useDirectInput
    ? directTeamId
        .split(/[,;]/)
        .map((id) => id.trim())
        .filter((id) => /^\d+$/.test(id))
    : (selectedOpportunities
        .map((opp) => opp.cursor_team_id_c)
        .filter(Boolean) as string[]);

  const teamIdParam = currentTeamIds.join(',');
  const isReady = currentTeamIds.length > 0;

  function handleDateRangeChange(startDate: string, endDate: string) {
    setDateRange({ start: startDate, end: endDate });
  }

  const fetchActiveUsers = useCallback(async () => {
    if (!teamIdParam || !dateRange) {return;}
    setLoadingActiveUsers(true);
    setActiveUsers(null);

    try {
      const response = await fetch(
        `/api/active-users?teamId=${encodeURIComponent(teamIdParam)}&start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      const result: { success: boolean; data: { unique_users: number } } = await response.json();
      if (result.success && result.data) {
        setActiveUsers(result.data.unique_users || 0);
      }
    } catch {
      setActiveUsers(null);
    } finally {
      setLoadingActiveUsers(false);
    }
  }, [teamIdParam, dateRange]);

  const fetchConsumptionData = useCallback(async () => {
    if (!teamIdParam || !dateRange) {return;}
    setLoading(true);
    setError(null);

    try {
      const qs = `teamId=${encodeURIComponent(teamIdParam)}&start_date=${dateRange.start}&end_date=${dateRange.end}`;
      const response = await fetch(`/api/consumption-analytics?${qs}`);
      const result: ConsumptionData = await response.json();

      if (result.success) {
        setConsumptionData(result);
        fetchActiveUsers();
      } else {
        setError('Failed to fetch consumption data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [teamIdParam, dateRange, fetchActiveUsers]);

  useEffect(() => {
    if (isReady && dateRange) {
      fetchConsumptionData();
    }
  }, [isReady, dateRange, fetchConsumptionData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {isReady && dateRange && teamIdParam && (
        <QueryHeader
          teamId={teamIdParam}
          accountName={!useDirectInput ? selectedAccount ?? undefined : undefined}
          opportunityName={
            !useDirectInput
              ? selectedOpportunities.length === 1
                ? selectedOpportunities[0]?.name
                : `${selectedOpportunities.length} opportunities`
              : undefined
          }
          dateRange={dateRange}
          isDirectInput={useDirectInput}
        />
      )}

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Token Usage Calculator
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-xl text-gray-500">
            Calculate and analyze your team&apos;s token usage across different AI models and
            services
          </p>
        </div>

        {/* Input Section */}
        <div className="mx-auto mb-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Team Configuration</CardTitle>
              <CardDescription>
                Configure your team information and date range for token usage analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Method Toggle */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Input Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant={!useDirectInput ? 'default' : 'outline'}
                    onClick={() => {
                      setUseDirectInput(false);
                      setDirectTeamId('');
                    }}
                    className="flex-1"
                  >
                    Search & Select
                  </Button>
                  <Button
                    variant={useDirectInput ? 'default' : 'outline'}
                    onClick={() => {
                      setUseDirectInput(true);
                      setSelectedAccount(null);
                      setSelectedOpportunities([]);
                    }}
                    className="flex-1"
                  >
                    Direct Team ID
                  </Button>
                </div>
              </div>

              {/* Team Selection */}
              <div className="space-y-4">
                {!useDirectInput ? (
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex flex-1 flex-col space-y-2">
                      <Label className="text-sm font-medium">Account</Label>
                      <div className="min-h-[280px] flex-1">
                        <AccountSearch
                          onAccountSelect={handleAccountSelect}
                          selectedAccount={selectedAccount}
                        />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col space-y-2">
                      <Label className="text-sm font-medium">Opportunity</Label>
                      <div className="min-h-[280px] flex-1">
                        {selectedAccount ? (
                          <OpportunitiesDropdown
                            accountName={selectedAccount}
                            onOpportunitiesSelect={setSelectedOpportunities}
                            selectedOpportunities={selectedOpportunities}
                          />
                        ) : (
                          <div className="flex h-full min-h-[280px] items-center justify-center border border-dashed p-4 text-center">
                            <p className="text-muted-foreground text-sm">
                              Select an account first to view available opportunities
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="team-id" className="text-sm font-medium">
                      Team ID
                    </Label>
                    <Input
                      id="team-id"
                      type="text"
                      placeholder="Enter team ID(s), use comma or semicolon to separate..."
                      value={directTeamId}
                      onChange={(e) => setDirectTeamId(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-muted-foreground text-xs">
                      Enter one or more team IDs separated by commas or semicolons (e.g.,
                      12345,67890)
                    </p>
                  </div>
                )}
              </div>

              {/* Date Range */}
              {isReady && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {isReady && (
          <div className="mx-auto mt-8 max-w-6xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                Token Usage Analysis
              </h2>
              <p className="text-gray-500">
                {useDirectInput
                  ? currentTeamIds.length === 1
                    ? `Analysis for Team ID: ${currentTeamIds[0]}`
                    : `Analysis for ${currentTeamIds.length} Team IDs: ${currentTeamIds.join(', ')}`
                  : selectedOpportunities.length === 1
                    ? `Analysis for ${selectedAccount} - ${selectedOpportunities[0]?.name}`
                    : `Analysis for ${selectedAccount} - ${selectedOpportunities.length} opportunities`}
              </p>
              {dateRange && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {dateRange.start} to {dateRange.end}
                </p>
              )}
            </div>

            {loading && (
              <div className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
                <p className="text-muted-foreground mt-2">Loading consumption data...</p>
              </div>
            )}

            {error && (
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <div className="text-destructive text-center">
                    <p className="font-semibold">Error loading data</p>
                    <p className="mt-1 text-sm">{error}</p>
                    <Button onClick={fetchConsumptionData} variant="outline" className="mt-4">
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {consumptionData && !loading && !error && (
              <div className="space-y-8">
                {/* Model Charts */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <RequestsByModelChart data={consumptionData.modelBreakdown} />
                  <TokenBreakdownChart data={consumptionData.modelBreakdown} />
                </div>

                {/* Summary Cards */}
                <div className="flex flex-wrap justify-center gap-6">
                  <SummaryCard
                    title="Current Active Users"
                    value={
                      loadingActiveUsers
                        ? 'Loading...'
                        : activeUsers !== null
                          ? activeUsers.toLocaleString()
                          : '--'
                    }
                  />
                  <SummaryCard
                    title="Total Cost"
                    value={`$${(consumptionData.costMetrics.totalApiCost + consumptionData.costMetrics.cursorTokenFee * (1 - cursorTokenFeeDiscount / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtitle={`$${consumptionData.costMetrics.totalApiCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} API + $${(consumptionData.costMetrics.cursorTokenFee * (1 - cursorTokenFeeDiscount / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CTF`}
                  />
                  <SummaryCard
                    title="API Cost"
                    value={`$${consumptionData.costMetrics.totalApiCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                  <SummaryCard
                    title="Cursor Token Fee"
                    value={`$${(consumptionData.costMetrics.cursorTokenFee * (1 - cursorTokenFeeDiscount / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtitle={
                      cursorTokenFeeDiscount > 0
                        ? `${cursorTokenFeeDiscount}% discount applied`
                        : undefined
                    }
                  />
                  <SummaryCard
                    title="Average Cost Per User"
                    value={
                      activeUsers && activeUsers > 0
                        ? `$${((consumptionData.costMetrics.totalApiCost + consumptionData.costMetrics.cursorTokenFee * (1 - cursorTokenFeeDiscount / 100)) / activeUsers).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '--'
                    }
                  />
                  <SummaryCard
                    title="Median Cost per User"
                    value={`$${consumptionData.medianCostPerUser.toFixed(2)}`}
                  />
                </div>

                {/* Contract Scoping Calculator */}
                <div className="mt-12">
                  <div className="mb-8 text-center">
                    <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Contract Scoping Calculator
                    </h3>
                    <p className="text-gray-500">
                      Calculate annual contract value based on projected user count
                    </p>
                  </div>

                  <div className="mx-auto max-w-6xl">
                    <Card>
                      <CardHeader>
                        <CardTitle>Projected Contract Size</CardTitle>
                        <CardDescription>
                          Enter the number of users to calculate annual contract value
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="scoping-users">Number of Users</Label>
                            <Input
                              id="scoping-users"
                              type="number"
                              placeholder="Enter number of users..."
                              value={scopingUsers || ''}
                              onChange={(e) => setScopingUsers(Number(e.target.value) || 0)}
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cursor-discount">Cursor Token Fee Discount (%)</Label>
                            <Input
                              id="cursor-discount"
                              type="number"
                              placeholder="Enter discount %..."
                              value={cursorTokenFeeDiscount || ''}
                              onChange={(e) =>
                                setCursorTokenFeeDiscount(
                                  Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                )
                              }
                              min="0"
                              max="100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bugbot-seats">Bugbot Seats</Label>
                            <Input
                              id="bugbot-seats"
                              type="number"
                              placeholder="Enter number of seats..."
                              value={bugbotSeats || ''}
                              onChange={(e) => setBugbotSeats(Number(e.target.value) || 0)}
                              min="0"
                            />
                          </div>
                        </div>

                        {((scopingUsers > 0 && activeUsers && activeUsers > 0 && dateRange) ||
                          bugbotSeats > 0) && (
                          <ContractScopingResults
                            scopingUsers={scopingUsers}
                            activeUsers={activeUsers}
                            dateRange={dateRange}
                            consumptionData={consumptionData}
                            cursorTokenFeeDiscount={cursorTokenFeeDiscount}
                            bugbotSeats={bugbotSeats}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* User Spend Distribution */}
                {consumptionData.spendDistribution && (
                  <div className="mt-12">
                    <div className="mb-8 text-center">
                      <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        User Distribution
                      </h3>
                      <p className="text-gray-500">
                        Distribution of users across different usage ranges
                      </p>
                    </div>
                    <div className="mx-auto max-w-4xl">
                      <UserSpendDistributionChart data={consumptionData.spendDistribution} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string | undefined;
}) {
  return (
    <Card className="w-64">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function ContractScopingResults({
  scopingUsers,
  activeUsers,
  dateRange,
  consumptionData,
  cursorTokenFeeDiscount,
  bugbotSeats,
}: {
  scopingUsers: number;
  activeUsers: number | null;
  dateRange: { start: string; end: string } | null;
  consumptionData: ConsumptionData;
  cursorTokenFeeDiscount: number;
  bugbotSeats: number;
}) {
  const annualBugbotCost = bugbotSeats * 32 * 12;

  let totalAnnualApiCost = 0;
  let totalAnnualCursorFee = 0;

  if (scopingUsers > 0 && activeUsers && activeUsers > 0 && dateRange) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const daysInRange =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const dailyApiCostPerUser = consumptionData.costMetrics.totalApiCost / activeUsers / daysInRange;
    const dailyCursorFeePerUser =
      (consumptionData.costMetrics.cursorTokenFee * (1 - cursorTokenFeeDiscount / 100)) /
      activeUsers /
      daysInRange;

    totalAnnualApiCost = scopingUsers * dailyApiCostPerUser * 365;
    totalAnnualCursorFee = scopingUsers * dailyCursorFeePerUser * 365;
  }

  const annualSeatFee = scopingUsers * 480;
  const totalAnnualCost =
    annualSeatFee + totalAnnualApiCost + totalAnnualCursorFee + annualBugbotCost;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {scopingUsers > 0 && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Annual Seat Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold">
                ${annualSeatFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-muted-foreground text-sm">
                {scopingUsers.toLocaleString()} users x $480/year
              </p>
            </CardContent>
          </Card>
        )}

        {scopingUsers > 0 && activeUsers && activeUsers > 0 && dateRange && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Annual Usage Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold">
                $
                {(totalAnnualApiCost + totalAnnualCursorFee).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-muted-foreground text-sm">API Cost + Cursor Token Fee</p>
            </CardContent>
          </Card>
        )}

        {(scopingUsers > 0 || bugbotSeats > 0) && (
          <Card className="bg-muted border-2 border-gray-900 shadow-xl dark:border-gray-100">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-xl font-bold">Total Annual Cost</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-2 text-4xl font-bold">
                $
                {totalAnnualCost.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-muted-foreground text-sm font-medium">All fees combined</p>
            </CardContent>
          </Card>
        )}
      </div>

      {bugbotSeats > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Annual Bugbot Cost
              </h4>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {bugbotSeats.toLocaleString()} seats x $32/month x 12 months
              </p>
            </div>
            <div className="text-xl font-bold text-amber-900 dark:text-amber-100">
              ${annualBugbotCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
