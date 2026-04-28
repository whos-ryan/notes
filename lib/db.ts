import { neonConfig, Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

let dbInstance: ReturnType<typeof drizzle> | null = null;

neonConfig.webSocketConstructor = ws;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  dbInstance = drizzle({ client: pool });

  return dbInstance;
}

export type AppDb = ReturnType<typeof getDb>;
export type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export async function withUserDb<T>(
  userId: string,
  callback: (db: AppTransaction) => Promise<T>,
) {
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_user_id', ${userId}, true)`,
    );
    return callback(tx);
  });
}
