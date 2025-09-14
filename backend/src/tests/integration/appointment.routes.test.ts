import request from "supertest";
import app from "../../app";

describe("Appointment Routes", () => {
  it("GET /api/appointments returns 401 without token", async () => {
    const res = await request(app).get("/api/appointments");
    expect(res.status).toBe(401);
  });

  it("GET /api/appointments/availability returns 401 without token", async () => {
    const res = await request(app).get("/api/appointments/availability");
    expect(res.status).toBe(401);
  });
});
