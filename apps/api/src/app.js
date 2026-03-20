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

  app.use((error, _req, res, _next) => {
    console.error("API error:", error);
    res.status(error?.status || 500).json({
      message: error?.message || "Erro interno"
    });
  });

  return app;
}
