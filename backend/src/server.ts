import { connectDB } from "./config/db";
import app from "./app";
import { env } from "./config/env";

const PORT = env.port || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
