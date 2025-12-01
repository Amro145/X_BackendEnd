import express from "express";
import authRoutes from "./Routes/auth.route.js";
import userRoute from "./Routes/users.route.js";
import postRoutes from "./Routes/post.route.js";
import notifictionRoutes from "./Routes/notifiction.route.js";
import dotenv from "dotenv";
import { ConnectToDb } from "./lib/db.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// CORS configuration - supports both development and production
// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://x-client-red.vercel.app',
    'http://localhost:3000' // Keeping this as it's a common dev port
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, Postman)
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}.`;
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true, // Allow cookies to be sent
        methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept",
            "X-Requested-With",
            "x-access-token"
        ],
    })
);

app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Parse form data
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());


app.get("/test", (req, res) => {
    res.send("Hello from server");
});

// Debug endpoint to check environment variables
app.get("/debug-env", (req, res) => {
    res.json({
        hasMongoUrl: !!process.env.MONGO_URL,
        mongoUrlLength: process.env.MONGO_URL ? process.env.MONGO_URL.length : 0,
        hasJwtSecret: !!process.env.JWT_SECRET_KEY,
        hasCloudinary: !!process.env.CLOUDINARY_NAME,
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        allowedCORS: allowedOrigins // Added for debugging allowed origins
    });
});

// Connect to DB for every request (Serverless optimization)
app.use(async (req, res, next) => {
    try {
        await ConnectToDb();

        next();
    } catch (error) {
        console.error("Database connection error:", error);
        next(error);
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);
app.use("/api/post", postRoutes);
app.use("/api/notifiction", notifictionRoutes);

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
