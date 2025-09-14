import request from "supertest";
import app from "../../app";

describe("Patient Routes", () => {
  it("GET /api/patients should require auth", async () => {
    const res = await request(app).get("/api/patients");
    expect(res.status).toBe(401);
  });

  it("POST /api/patients should fail without token", async () => {
    const res = await request(app).post("/api/patients").send({ firstName: "John" });
    expect(res.status).toBe(401);
  });
});
