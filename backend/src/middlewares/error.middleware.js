import logger from "../utils/logger.js";

// Normalizes well-known Mongoose/Mongo error shapes into an ApiError-like
// {statusCode, message} so callers get a proper 4xx instead of a generic 500.
const normalizeError = (err) => {
  // Invalid ObjectId passed to findById/findOne (e.g. bad :messageId param)
  if (err.name === "CastError") {
    return { statusCode: 400, message: `Invalid ${err.path}: ${err.value}` };
  }

  // Duplicate key (e.g. two concurrent signups racing for the same username)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    return { statusCode: 409, message: `${field} already in use` };
  }

  // Mongoose schema validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    return { statusCode: 400, message: errors[0] || "Validation failed", errors };
  }

  return null;
};

const errorMiddleware = (err, req, res, next) => {
  const normalized = normalizeError(err);
  const statusCode = err.statusCode || normalized?.statusCode || 500;
  const isKnownError = !!err.statusCode || !!normalized;

  if (!isKnownError) {
    logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });
  }

  const message =
    isKnownError || process.env.NODE_ENV !== "production"
      ? normalized?.message || err.message || "Something went wrong"
      : "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
    errors: normalized?.errors || err.errors || [],
  });
};

export default errorMiddleware;
