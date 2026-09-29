import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, getPool } from "../../lib/cms/db";
await migrate(db(), { migrationsFolder: "./drizzle" });
console.log("CMS database migrations applied");
await getPool().end();
