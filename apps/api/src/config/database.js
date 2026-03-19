import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

let pool;
let databaseReadyPromise;

export function isDatabaseConfigured() {
  return Boolean(env.databaseUrl);
}

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: getSslConfig(env.databaseUrl),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      keepAlive: true,
      allowExitOnIdle: true
    });
  }

  return pool;
}

export async function runSchema() {
  const schemaPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../database/schema.sql"
  );
  const sql = fs.readFileSync(schemaPath, "utf8");
  const client = await getPool().connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
}

export async function ensureDatabaseReady(options = {}) {
  if (!isDatabaseConfigured()) {
    return false;
  }

  if (!databaseReadyPromise) {
    databaseReadyPromise = warmDatabase(options).catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }

  return databaseReadyPromise;
}

export async function getDatabaseHealth() {
  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      schemaReady: false
    };
  }

  try {
    await getPool().query("SELECT 1");
    return {
      configured: true,
      connected: true,
      schemaReady: true
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      schemaReady: false,
      error: error.message
    };
  }
}

async function warmDatabase({ attempts = 4, delayMs = 4000 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await getPool().query("SELECT 1");
      await runSchema();
      return true;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(delayMs * attempt);
      }
    }
  }

  throw lastError;
}

function getSslConfig(connectionString) {
  if (!connectionString) {
    return undefined;
  }

  try {
    const url = new URL(connectionString);
    const isLocalhost = ["localhost", "127.0.0.1"].includes(url.hostname);
    const wantsSsl = url.searchParams.get("sslmode") !== "disable" && !isLocalhost;

    return wantsSsl
      ? {
          rejectUnauthorized: false
        }
      : undefined;
  } catch (_error) {
    return undefined;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
