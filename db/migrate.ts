import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db, sqlite } from "./index";
import path from "path";

function runMigration() {
  const migrationsFolder = path.join(process.cwd(), "db", "migrations");
  migrate(db, { migrationsFolder });
  sqlite.close();
  console.log("Database migration completed.");
}

runMigration();
