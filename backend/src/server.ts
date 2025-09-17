// backend/src/server.ts
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

const PORT = Number(process.env.PORT || env.port || 5000);

function startHttp() {
  // Bind immediately so Render detects an open port
  app.listen(PORT, "0.0.0.0", () => {
    console.log(` Server listening on 0.0.0.0:${PORT}`);
  });
}

async function init() {
  startHttp();

  try {
    await connectDB();
    console.log(" MongoDB connected");
  } catch (err: any) {
    console.error(" MongoDB connection failed:", err?.message || err);
    // Optional: retry in background every 30s
    const retry = async () => {
      try {
        await connectDB();
        console.log(" MongoDB connected (retry)");
        clearInterval(timer);
      } catch (e: any) {
        console.error("Mongo retry failed:", e?.message || e);
      }
    };
    const timer = setInterval(retry, 30000);
  }
}

process.on("unhandledRejection", (e) => console.error("UNHANDLED REJECTION:", e));
process.on("uncaughtException", (e) => console.error("UNCAUGHT EXCEPTION:", e));

init();
