import "dotenv/config";

import mongoose from "mongoose";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        mongoose.connection.close(false).then(() => process.exit(0));
      });
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection failed", { error: err.message });
    process.exit(1);
  });
