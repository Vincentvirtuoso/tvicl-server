import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import "express-async-errors";
import connectDB from "#config/db";
import authRoutes from "#routes/auth.routes";
import agentRoutes from "#routes/agent.routes";
import estateRoutes from "#routes/estate.routes";
import propertyRoutes from "#routes/property.routes";

dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

// ✅ Simplified CORS config (robust for Render)
const allowedOrigins = [
  "http://localhost:5173",
  "https://propertiesinnigeriatvicl.onrender.com",
  "https://www.tvicl.com.ng",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // ✅ handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to TVICL Real Estate API 🚀", status: "OK" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "Running ✅",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.use("/api/agents", agentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/estate", estateRoutes);
app.use("/api/properties", propertyRoutes);

app.use((req, res, next) => {
  next(createError.NotFound(`Route not found ➜ ${req.originalUrl}`));
});

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
