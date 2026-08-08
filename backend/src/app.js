import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import sanitizeBody from "./middlewares/sanitize.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.set("trust proxy", 1);//

app.use(helmet());//
app.use(compression());//

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(sanitizeBody);//

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server alive" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/users", userRoutes);

app.use(errorMiddleware);

export default app;
