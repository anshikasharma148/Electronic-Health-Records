import request from "supertest";
import app from "../../app";

describe("Clinical Routes", () => {
  it("GET /api/clinical/overview should require token", async () => {
    const res = await request(app).get("/api/clinical/overview");
    expect(res.status).toBe(401);
  });

  it("POST /api/clinical/vitals should require token", async () => {
    const res = await request(app).post("/api/clinical/vitals").send({ heartRate: 80 });
    expect(res.status).toBe(401);
  });
});
