import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "devsecret",
  ehrUrl: process.env.EHR_API_URL || "",
  ehrClientId: process.env.EHR_CLIENT_ID || "",
  ehrClientSecret: process.env.EHR_CLIENT_SECRET || "",
};
