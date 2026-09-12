import express from "express";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/status", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
