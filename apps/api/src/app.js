import cors from "cors";
import express from "express";
import router from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use("/api", router);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
