import { connectDatabase } from "./db.js";
import { createApp } from "./app.js";
import { config } from "./config.js";

async function main() {
  await connectDatabase();
  console.log("Connected to Scholarship Database");
  const app = createApp();
  const PORT = config.port;
  app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`),
  );
}

main().catch((err) => {
  console.log("Failed to start server:", err);
  process.exit(1);
});
