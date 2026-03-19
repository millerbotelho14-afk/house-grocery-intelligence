import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

let pool;

export function isDatabaseConfigured() {
  return Boolean(env.databaseUrl);
}

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl
    });
  }

  return pool;
}

export async function runSchema() {
  const schemaPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../database/schema.sql"
  );
  const sql = fs.readFileSync(schemaPath, "utf8");
  const client = await getPool().connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
}
