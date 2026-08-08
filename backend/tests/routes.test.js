import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Health check", () => {
  it("GET /api/v1/health returns 200", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("POST /api/v1/auth/signup", () => {
  it("400 when fields missing", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("400 when email/password missing", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/messages/send/:username", () => {
  it("400 when content empty", async () => {
    const res = await request(app)
      .post("/api/v1/messages/send/someuser")
      .send({ content: "" });
    expect(res.status).toBe(400);
  });

  it("400 when content exceeds max length", async () => {
    const res = await request(app)
      .post("/api/v1/messages/send/someuser")
      .send({ content: "a".repeat(600) });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/messages (protected)", () => {
  it("401 when no auth header", async () => {
    const res = await request(app).get("/api/v1/messages");
    expect(res.status).toBe(401);
  });

  it("401 when malformed auth header", async () => {
    const res = await request(app)
      .get("/api/v1/messages")
      .set("Authorization", "not-bearer-token");
    expect(res.status).toBe(401);
  });
});

describe("404 handler", () => {
  it("unknown route returns 404 via CORS/route fallthrough", async () => {
    const res = await request(app).get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/messages/:messageId (protected)", () => {
  it("401 without auth even for a malformed id (auth checked before DB cast)", async () => {
    const res = await request(app).delete("/api/v1/messages/not-a-valid-object-id");
    expect(res.status).toBe(401);
  });
});

describe("OTP brute-force protections", () => {
  // These endpoints go on to hit the DB (no test DB is wired up here), so we
  // verify the limiter itself in isolation rather than through the full
  // signup/DB-backed route - the important behavior is that a 6th rapid
  // request is rejected by the limiter before it ever reaches the controller.
  it("otpVerifyLimiter rejects the 6th request within the window", async () => {
    const express = (await import("express")).default;
    const { otpVerifyLimiter } = await import("../src/middlewares/rateLimit.middleware.js");

    const testApp = express();
    testApp.post("/probe", otpVerifyLimiter, (req, res) => res.status(200).json({ ok: true }));

    let lastStatus;
    for (let i = 0; i < 6; i++) {
      const res = await request(testApp).post("/probe");
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("verify-otp and reset-password routes have a rate limiter ahead of the controller", async () => {
    const { default: authRouter } = await import("../src/routes/auth.routes.js");
    const routesByPath = authRouter.stack
      .filter((l) => l.route)
      .map((l) => ({ path: l.route.path, handlerCount: l.route.stack.length }));

    const verifyOtpRoute = routesByPath.find((l) => l.path === "/verify-otp");
    const resetPasswordRoute = routesByPath.find((l) => l.path === "/reset-password");

    // Previously these had a single handler (just the controller); now they
    // must have the limiter middleware in front of it too.
    expect(verifyOtpRoute.handlerCount).toBeGreaterThanOrEqual(2);
    expect(resetPasswordRoute.handlerCount).toBeGreaterThanOrEqual(2);
  });
});
