import { Schema, model, Document } from "mongoose";

export interface AuditLogDoc extends Document {
  actorId: string | null;
  actorRole: string | null;
  method: string;
  path: string;
  ip: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    actorId: String,
    actorRole: String,
    method: String,
    path: String,
    ip: String,
    timestamp: { type: Date, required: true }
  },
  { timestamps: false }
);

export default model<AuditLogDoc>("AuditLog", AuditLogSchema);
