import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db-schema";
const globalDb = globalThis as unknown as { cmsPool?: Pool };
export function cmsEnabled() {
  return process.env.CMS_CONTENT_SOURCE === "database";
}
export function getPool() {
  if (!process.env.DATABASE_URL)
    throw new Error("CMS database is not configured");
  return (globalDb.cmsPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  }));
}
export function db() {
  return drizzle(getPool(), { schema });
}
