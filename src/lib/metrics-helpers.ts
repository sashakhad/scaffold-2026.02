import { NextRequest } from 'next/server';

const SUBSCRIPTION_ID_PATTERN = /^[a-zA-Z0-9]{15,18}$/;

function isValidSubscriptionId(id: string): boolean {
  return SUBSCRIPTION_ID_PATTERN.test(id.trim());
}

export function parseSubscriptionIds(request: NextRequest): { ids: string[]; error?: string } {
  const subscriptionId = request.nextUrl.searchParams.get('subscriptionId') ?? undefined;
  const subscriptionIds = request.nextUrl.searchParams.get('subscriptionIds') ?? undefined;

  const ids = subscriptionIds
    ? subscriptionIds.split(',').filter(id => id.trim())
    : subscriptionId
      ? [subscriptionId]
      : [];

  if (ids.length === 0) {
    return { ids: [], error: 'subscriptionId or subscriptionIds is required' };
  }

  if (ids.length > 50) {
    return { ids: [], error: 'Maximum 50 subscription IDs allowed' };
  }

  const invalidIds = ids.filter(id => !isValidSubscriptionId(id));
  if (invalidIds.length > 0) {
    return {
      ids: [],
      error: `Invalid subscription ID format: ${invalidIds.slice(0, 3).join(', ')}${invalidIds.length > 3 ? '...' : ''}`,
    };
  }

  return { ids };
}

export function parseBooleanParam(value: string | null, defaultValue: boolean): boolean {
  if (value === null) {
    return defaultValue;
  }
  return value !== 'false' && value !== '0';
}
