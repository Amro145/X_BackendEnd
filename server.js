import express from "express";
import authRoutes from "./Routes/auth.route.js";
import userRoute from "./Routes/users.route.js";
import postRoutes from "./Routes/post.route.js";
import notificationRoutes from "./Routes/notification.route.js";
import dotenv from "dotenv";
import { ConnectToDb } from "./lib/db.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.set('trust proxy', 1); // Trust first proxy (necessary for Vercel/Heroku rate limiting)

// CORS configuration - supports both development and production
// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://x-client-red.vercel.app',
    'https://www.x-client-red.vercel.app', // Added www variant
    'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, "");
    if (!allowedOrigins.includes(frontendUrl)) {
        allowedOrigins.push(frontendUrl);
    }
}

// 1. CORS - MUST BE FIRST (after trust proxy)
app.use(
    cors({
        origin: function (origin, callback) {
            // Check if origin is allowed
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log(`CORS Error: Origin ${origin} not allowed`);
                callback(null, false); // Deny but don't crash
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "x-access-token"],
        optionsSuccessStatus: 200
    })
);

// 2. Parsers and other middlewares
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}));
app.use(compression());



app.get("/", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
});

app.get("/test", (req, res) => {
    res.send("Hello from server");
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Connect to DB for protected routes
const connectDbMiddleware = async (req, res, next) => {
    try {
        await ConnectToDb();
        next();
    } catch (error) {
        console.error("Database connection error:", error);
        return res.status(503).json({ message: "Database connection failed", error: error.message });
    }
};

app.use("/api", connectDbMiddleware);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: "Too many requests from this IP, please try again later."
});

app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);
app.use("/api/post", postRoutes);
app.use("/api/notification", notificationRoutes);

// Global error-handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err.message); // Log the error to the console
    return res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
    }); // Render the error page with the error object
});

// Export app for Vercel
export default app;

// Only listen if not running on Vercel
if (!process.env.VERCEL) {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
}
