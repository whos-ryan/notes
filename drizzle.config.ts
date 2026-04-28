import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

const getEnvValueFromFile = (filePath: string, key: string) => {
  if (!existsSync(filePath)) {
    return null;
  }

  const file = readFileSync(filePath, "utf8");
  const line = file
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) {
    return null;
  }

  const value = line.slice(key.length + 1).trim();
  return value || null;
};

const databaseUrl =
  process.env.DATABASE_MIGRATION_URL ??
  process.env.DATABASE_URL ??
  getEnvValueFromFile(".env.local", "DATABASE_MIGRATION_URL") ??
  getEnvValueFromFile(".env", "DATABASE_MIGRATION_URL") ??
  getEnvValueFromFile(".env.local", "DATABASE_URL") ??
  getEnvValueFromFile(".env", "DATABASE_URL");

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL. Add it to .env.local");
}

export default defineConfig({
  out: "./drizzle",
  schema: [
    "./database/auth-schema.ts",
    "./database/notes-schema.ts",
    "./database/calendar-schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
