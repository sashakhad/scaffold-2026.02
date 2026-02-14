import { DBSQLClient } from '@databricks/sql';

type DBSession = Awaited<ReturnType<DBSQLClient['openSession']>>;

interface PooledSession {
  session: DBSession;
  createdAt: number;
  inUse: boolean;
}

let client: DBSQLClient | null = null;
const sessionPool: PooledSession[] = [];

function getPoolMaxSize(): number {
  return parseInt(process.env.DATABRICKS_POOL_SIZE ?? '5', 10);
}

function getQueryTimeoutMs(): number {
  return parseInt(process.env.DATABRICKS_QUERY_TIMEOUT_MS ?? '30000', 10);
}

const SESSION_MAX_AGE_MS = 10 * 60 * 1000;
const POOL_WAIT_TIMEOUT_MS = 15_000;

function resetClient(): void {
  for (const entry of sessionPool) {
    try {
      void entry.session.close();
    } catch {
      // Ignore -- connection is likely dead
    }
  }
  sessionPool.length = 0;
  client = null;
}

async function getConnection(): Promise<DBSQLClient> {
  const serverHostname = process.env.DATABRICKS_SERVER_HOSTNAME;
  const httpPath = process.env.DATABRICKS_HTTP_PATH;
  const token = process.env.DATABRICKS_ACCESS_TOKEN;

  if (!serverHostname || !httpPath || !token) {
    throw new Error(
      `Missing Databricks environment variables. Configure DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH, and DATABRICKS_ACCESS_TOKEN.`
    );
  }

  const trimmedToken = token.trim();

  if (!client) {
    client = new DBSQLClient();
    try {
      await client.connect({
        host: serverHostname,
        path: httpPath,
        token: trimmedToken,
      });
    } catch (error) {
      client = null;
      throw error;
    }
  }

  return client;
}

async function acquireSession(): Promise<PooledSession> {
  const now = Date.now();

  for (let i = 0; i < sessionPool.length; i++) {
    const entry = sessionPool[i];
    if (!entry || entry.inUse) {
      continue;
    }

    if (now - entry.createdAt > SESSION_MAX_AGE_MS) {
      sessionPool.splice(i, 1);
      i--;
      try {
        await entry.session.close();
      } catch {
        // Ignore
      }
      continue;
    }

    entry.inUse = true;
    return entry;
  }

  if (sessionPool.length < getPoolMaxSize()) {
    const connection = await getConnection();
    const session = await connection.openSession();
    const entry: PooledSession = { session, createdAt: Date.now(), inUse: true };
    sessionPool.push(entry);
    return entry;
  }

  const deadline = Date.now() + POOL_WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50));

    for (const entry of sessionPool) {
      if (!entry.inUse) {
        entry.inUse = true;
        return entry;
      }
    }

    if (sessionPool.length < getPoolMaxSize()) {
      const connection = await getConnection();
      const session = await connection.openSession();
      const freshEntry: PooledSession = { session, createdAt: Date.now(), inUse: true };
      sessionPool.push(freshEntry);
      return freshEntry;
    }
  }

  throw new Error(
    `[Databricks] Timed out waiting for an available session (pool size: ${getPoolMaxSize()})`
  );
}

function releaseSession(entry: PooledSession): void {
  entry.inUse = false;
}

function discardSession(entry: PooledSession): void {
  const idx = sessionPool.indexOf(entry);
  if (idx !== -1) {
    sessionPool.splice(idx, 1);
  }
  try {
    void entry.session.close();
  } catch {
    // Ignore
  }
}

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const msg = error.message.toLowerCase();
  return (
    msg.includes('connection') ||
    msg.includes('socket') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout') ||
    msg.includes('thrift') ||
    msg.includes('session')
  );
}

function withTimeout<T>(fn: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[Databricks] Query timed out after ${ms}ms: ${label}`));
    }, ms);

    fn.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function executeWithSession<T>(processedQuery: string): Promise<T[]> {
  const poolEntry = await acquireSession();

  try {
    const queryLabel = processedQuery.trim().slice(0, 60);
    const operationPromise = (async () => {
      const operation = await poolEntry.session.executeStatement(processedQuery);
      const result = await operation.fetchAll();
      await operation.close();
      return result as T[];
    })();

    const result = await withTimeout(operationPromise, getQueryTimeoutMs(), queryLabel);
    releaseSession(poolEntry);
    return result;
  } catch (error) {
    discardSession(poolEntry);
    throw error;
  }
}

export async function executeQuery<T>(
  query: string,
  params?: Record<string, string>
): Promise<T[]> {
  let processedQuery = query;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      const escapedValue = value.replace(/'/g, "''");
      processedQuery = processedQuery.replace(new RegExp(`:${key}\\b`, 'g'), `'${escapedValue}'`);
    }
  }

  try {
    return await executeWithSession<T>(processedQuery);
  } catch (error) {
    if (isTransientError(error)) {
      console.warn('[Databricks:executeQuery] Transient error, retrying once...', {
        error: (error as Error).message,
      });
      resetClient();
      return await executeWithSession<T>(processedQuery);
    }
    throw error;
  }
}
