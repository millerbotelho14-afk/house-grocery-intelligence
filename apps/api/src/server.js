import "dotenv/config";
import { createApp } from "./app.js";
import { ensureDatabaseReady } from "./config/database.js";
import { env } from "./config/env.js";

await ensureDatabaseReady().catch((error) => {
  console.error("Database warm-up failed:", error.message);
});

const app = createApp();

app.listen(env.port, () => {
  console.log(`House Grocery API running on http://localhost:${env.port}`);
});
