import cors from "cors";
import express from "express";
import { getDatabaseHealth } from "./config/database.js";
import router from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use("/api", router);

  app.get("/health", async (_req, res) => {
    const database = await getDatabaseHealth();
    res.json({
      status: database.connected || !database.configured ? "ok" : "degraded",
      database
    });
  });

  return app;
}
