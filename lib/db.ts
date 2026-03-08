import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  const sql = neon(databaseUrl);
  dbInstance = drizzle({ client: sql });

  return dbInstance;
}
