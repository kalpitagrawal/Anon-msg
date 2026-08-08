import { describe, it, expect, vi } from "vitest";
import asyncHandler from "../src/utils/asyncHandler.js";
import ApiError from "../src/utils/ApiError.js";
import ApiResponse from "../src/utils/ApiResponse.js";
import generateOtp from "../src/utils/generateOtp.js";
import sanitizeBody from "../src/middlewares/sanitize.middleware.js";
import safeCompare from "../src/utils/safeCompare.js";
import errorMiddleware from "../src/middlewares/error.middleware.js";
import logger from "../src/utils/logger.js";

describe("ApiError", () => {
  it("set statusCode, message, success=false", () => {
    const err = new ApiError(404, "not found");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("not found");
    expect(err.success).toBe(false);
  });
});

describe("ApiResponse", () => {
  it("success=true when statusCode < 400", () => {
    const res = new ApiResponse(200, { ok: true });
    expect(res.success).toBe(true);
  });

  it("success=false when statusCode >= 400", () => {
    const res = new ApiResponse(400, null, "bad");
    expect(res.success).toBe(false);
  });
});

describe("generateOtp", () => {
  it("returns 6 digit string", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("stays in range across many calls", () => {
    for (let i = 0; i < 50; i++) {
      const otp = Number(generateOtp());
      expect(otp).toBeGreaterThanOrEqual(100000);
      expect(otp).toBeLessThanOrEqual(999999);
    }
  });
});

describe("asyncHandler", () => {
  it("calls next(err) when wrapped fn rejects", async () => {
    const next = vi.fn();
    const failingFn = async () => {
      throw new Error("boom");
    };
    const wrapped = asyncHandler(failingFn);
    await wrapped({}, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].message).toBe("boom");
  });

  it("does not call next when fn resolves", async () => {
    const next = vi.fn();
    const okFn = async () => "done";
    const wrapped = asyncHandler(okFn);
    await wrapped({}, {}, next);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("123456", "123456")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(safeCompare("123456", "654321")).toBe(false);
  });

  it("returns false for different length strings without throwing", () => {
    expect(safeCompare("123", "123456")).toBe(false);
  });

  it("returns false for non-string input", () => {
    expect(safeCompare(undefined, "123456")).toBe(false);
    expect(safeCompare("123456", undefined)).toBe(false);
  });
});

describe("errorMiddleware", () => {
  const makeRes = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
  };

  it("converts Mongoose CastError to 400", () => {
    const err = { name: "CastError", path: "messageId", value: "bad-id" };
    const res = makeRes();
    errorMiddleware(err, { path: "/x", method: "GET" }, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });

  it("converts duplicate key error to 409", () => {
    const err = { code: 11000, keyPattern: { username: 1 } };
    const res = makeRes();
    errorMiddleware(err, { path: "/x", method: "POST" }, res, () => {});
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toMatch(/username/);
  });

  it("defaults unknown errors to 500 with generic message in production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const logSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    const err = new Error("leaky internal detail");
    const res = makeRes();
    errorMiddleware(err, { path: "/x", method: "GET" }, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe("Internal server error");
    logSpy.mockRestore();
    process.env.NODE_ENV = original;
  });

  it("passes through known ApiError statusCode/message", () => {
    const err = new ApiError(404, "not found");
    const res = makeRes();
    errorMiddleware(err, { path: "/x", method: "GET" }, res, () => {});
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toBe("not found");
  });
});

describe("sanitizeBody middleware", () => {
  it("strips keys starting with $", () => {
    const req = { body: { email: { $gt: "" }, password: "abc" } };
    const next = vi.fn();
    sanitizeBody(req, {}, next);
    expect(req.body.email).toEqual({});
    expect(req.body.password).toBe("abc");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("strips keys containing dot", () => {
    const req = { body: { "a.b": "malicious", normal: "fine" } };
    sanitizeBody(req, {}, vi.fn());
    expect(req.body["a.b"]).toBeUndefined();
    expect(req.body.normal).toBe("fine");
  });

  it("passes through clean body untouched", () => {
    const req = { body: { username: "kalpit", email: "a@b.com" } };
    sanitizeBody(req, {}, vi.fn());
    expect(req.body).toEqual({ username: "kalpit", email: "a@b.com" });
  });
});
