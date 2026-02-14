const SUBSCRIPTION_ID_REGEX = /^[a-zA-Z0-9]{15,18}$/;

export const NUMERIC_ID_REGEX = /^\d+$/;

export function validateSubscriptionId(id: string): string {
  const trimmed = id.trim();
  if (!SUBSCRIPTION_ID_REGEX.test(trimmed)) {
    throw new Error(
      `Invalid subscription ID format: "${trimmed}" (expected 15-18 alphanumeric characters)`
    );
  }
  return trimmed;
}

export function validateTeamId(id: string): string {
  const trimmed = id.trim();
  if (!NUMERIC_ID_REGEX.test(trimmed)) {
    throw new Error(`Invalid team ID format: "${trimmed}" (expected numeric)`);
  }
  return trimmed;
}

export function buildSafeInClause(
  ids: string[],
  validate: (id: string) => string,
  quote = true
): string {
  const validated = ids.map(validate);
  if (validated.length === 0) {
    throw new Error('No valid IDs provided');
  }
  return quote ? validated.map(id => `'${id}'`).join(',') : validated.join(',');
}

export function normalizeIds(ids: string | string[]): string[] {
  return Array.isArray(ids) ? ids : [ids];
}

export function buildSubscriptionFilter(
  ids: string | string[],
  column: string
): { clause: string; params?: Record<string, string> } {
  const arr = normalizeIds(ids);
  if (arr.length === 1) {
    return {
      clause: `${column} = :subscription_id`,
      params: { subscription_id: validateSubscriptionId(arr[0]!) },
    };
  }
  const inClause = buildSafeInClause(arr, validateSubscriptionId);
  return { clause: `${column} IN (${inClause})` };
}

export function buildTeamIdFilter(ids: string | string[], column: string): string {
  const arr = normalizeIds(ids);
  const inClause = buildSafeInClause(arr, validateTeamId, false);
  return `${column} IN (${inClause})`;
}
