import "dotenv/config";
import next from "next";
import { createApp } from "./apps/api/src/app.js";
import { ensureDatabaseReady } from "./apps/api/src/config/database.js";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const nextApp = next({
  dev,
  dir: "./apps/web"
});

await ensureDatabaseReady().catch((error) => {
  console.error("Database warm-up failed:", error.message);
});

await nextApp.prepare();

const handle = nextApp.getRequestHandler();
const server = createApp();

server.all("*", (req, res) => handle(req, res));

server.listen(port, () => {
  console.log(`House Grocery unified app running on http://localhost:${port}`);
});
