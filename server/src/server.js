import http from "http";
import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { initSocket } from "./socket/index.js";

const server = http.createServer(app);

initSocket(server, app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${env.port} is already in use. Another QuickBasket server is probably already running from a different terminal. Stop the existing process or run only one backend instance.`,
    );
    process.exit(1);
  }

  console.error("Server failed to start", error);
  process.exit(1);
});

connectDb()
  .then(() => {
    server.listen(env.port, () => {
      console.log(`QuickBasket API running on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
