import { Schema, model, Document } from "mongoose";

export interface UserDoc extends Document {
  email: string;
  password: string;
  role: "admin" | "provider" | "billing" | "viewer";
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "provider", "billing", "viewer"], default: "viewer" }
  },
  { timestamps: true }
);

export default model<UserDoc>("User", UserSchema);
