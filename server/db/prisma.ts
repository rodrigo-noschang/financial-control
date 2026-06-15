import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

type SQLiteDatabase = {
  close(): void;
  exec(sql: string): void;
  pragma(source: string): unknown;
};

type SQLiteConstructor = new (filename: string) => SQLiteDatabase;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function initializeDatabase(connectionString: string) {
  const databasePath = connectionString.replace(/^file:/, "");
  mkdirSync(dirname(databasePath), { recursive: true });

  const require = createRequire(import.meta.url);
  const Database = require("better-sqlite3") as SQLiteConstructor;
  const database = new Database(databasePath);

  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS "categories" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "color" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key"
      ON "categories"("name");

    CREATE TABLE IF NOT EXISTS "expenses" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "description" TEXT NOT NULL,
      "amount" DECIMAL NOT NULL,
      "paidAt" DATETIME NOT NULL,
      "isEssential" BOOLEAN NOT NULL DEFAULT false,
      "isRecurring" BOOLEAN NOT NULL DEFAULT false,
      "categoryId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "expenses_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "expenses_paidAt_idx"
      ON "expenses"("paidAt");

    CREATE INDEX IF NOT EXISTS "expenses_categoryId_idx"
      ON "expenses"("categoryId");
  `);
  database.close();
}

function createPrismaClient() {
  const defaultConnectionString = `file:${process.cwd()}/data/financial-control.db`;
  const configuredConnectionString = process.env.DATABASE_URL;
  const connectionString = configuredConnectionString?.startsWith("file:")
    ? configuredConnectionString
    : defaultConnectionString;

  initializeDatabase(connectionString);
  const adapter = new PrismaBetterSqlite3(
    { url: connectionString },
    { timestampFormat: "iso8601" },
  );

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
