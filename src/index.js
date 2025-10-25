import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import "express-async-errors";
import connectDB from "#config/db";
import authRoutes from "#routes/auth.routes";

// Load environment variables
dotenv.config();
connectDB();

const app = express();
app.set('trust-proxy', 1)
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://propertiesinnigeriatvicl.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/test-email", async (req, res) => {
  try {
    const result = await sendEmail({
      to: "felixnwode023@gmail.com",
      subject: "Render Test",
      html: "<h2>Hello from Render + Brevo ✅</h2>",
      text: "Test email"
    });
    res.json(result);
  } catch (err) {
    console.error("Email Test Error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.options("*", cors());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

// Rate Limiter
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  })
);

// ===== Example Base Route =====
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to TVICL Real Estate API 🚀",
    status: "OK",
  });
});

// ===== Health Check Route =====
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "Running ✅",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// ==== Endpoints ====
app.use("/api/auth", authRoutes);

// ===== 404 Handler =====
app.use((req, res, next) => {
  next(createError.NotFound(`Route not found ➜ ${req.originalUrl}`));
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
