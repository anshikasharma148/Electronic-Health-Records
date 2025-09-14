import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error(" Missing MONGO_URI in environment variables");
  }
  return mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
};
