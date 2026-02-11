# 𝕏 Backend - Powerful Social Media Engine

A robust, scalable backend for the 𝕏 (formerly Twitter) clone, built with Node.js, Express, and MongoDB. Secure, high-performance, and feature-rich.

---

## 🚀 Features

-   **🔐 Advanced Auth**: JWT-based authentication with cookie storage, bcrypt password hashing, and secure route protection.
-   **📝 Post Management**: Create, delete, and fetch posts with image support via Cloudinary.
-   **💬 Interaction System**: Like/Unlike posts and threaded commenting system.
-   **👥 Social Graph**: Follow/Unfollow system with real-time suggestion logic.
-   **🔔 Notifications**: Sophisticated notification system for likes, follows, and interactions.
-   **🛡️ Security First**:
    -   **Zod**: Schema validation for all inputs.
    -   **Helmet**: Secure HTTP headers.
    -   **Rate Limiting**: Protection against Brute Force and DoS attacks.
    -   **CORS**: Secure cross-origin resource sharing.
-   **⚡ Performance**: Gzip compression and optimized database queries.

## 🛠️ Tech Stack

-   **Runtime**: Node.js (v20.x)
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose)
-   **Validation**: Zod & Validator
-   **Storage**: Cloudinary (Image handling)
-   **Security**: JWT, BcryptJS, Helmet, Express-Rate-Limit
-   **Development**: Nodemon, Faker.js (Seeding)

## 📁 Project Structure

```text
├── Controller/    # Business logic for each resource
├── Models/        # Mongoose schemas (User, Post, Notification)
├── Routes/        # API endpoint definitions
├── MiddleWare/    # Auth, Error handling, and Security middlewares
├── Validators/    # Zod validation schemas
├── lib/           # Utility functions and Database config
├── seed.js        # Realistic data generator for development
└── server.js      # Entry point
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Cloudinary Config
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret
```

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Seed the database** (Optional but recommended):
    ```bash
    node seed.js
    ```
3.  **Run development server**:
    ```bash
    npm run dev
    ```

## 🧪 API Documentation

The backend includes several guides for developers:
-   [API Testing Guide](./API_TESTING_GUIDE.md)
-   [Environment Setup](./ENV_SETUP_GUIDE.md)
-   [Deployment Guide](./VERCEL_DEPLOYMENT.md)

---

Built with ❤️ by the **X Project Team**.
