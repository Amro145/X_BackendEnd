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
let allowedOrigins = [];

if (process.env.NODE_ENV === 'production') {
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  // Add any other production domains if necessary, e.g., custom domains
  // allowedOrigins.push('https://your-custom-domain.com');
} else {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000'); // Development
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}.`;
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

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
  ConnectToDb();
});

app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json());
app.use(cookieParser());


app.get("/test", (req, res) => {
  res.send("Hello from server");
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
