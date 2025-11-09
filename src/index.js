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
const PORT = process.env.PORT || 4000;
app.set("trust proxy", 1);

// ✅ Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://propertiesinnigeriatvicl.onrender.com",
  "https://tvicl.com.ng",
  "https://www.tvicl.com.ng",
  "https://tvicl-official.onrender.com",
  "https://tviclofficial.com",
  "https://www.tviclofficial.com",
];

// ✅ Configure Helmet with CORS-friendly settings
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// ✅ CORS middleware (must be BEFORE other routes)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from allowed origins
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

// ✅ Global middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ✅ Rate limiting for basic protection
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
  })
);

// ✅ Health and root routes
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

// ✅ Route mounting
app.use("/api/agents", agentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/estates", estateRoutes);
app.use("/api/properties", propertyRoutes);

// ✅ 404 Handler
app.use((req, res, next) => {
  next(createError.NotFound(`Route not found ➜ ${req.originalUrl}`));
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ✅ Graceful shutdown support
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down gracefully...");
  process.exit(0);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});