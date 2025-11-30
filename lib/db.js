// lib/dbConnect.js
import mongoose from 'mongoose';

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!MONGO_URL) {
  throw new Error(
    'Please define the MONGO_URL or MONGODB_URI environment variable in .env.local or Vercel settings.'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 * This prevents connections from growing exponentially during development.
 * هذا النمط ضروري في بيئات Serverless (مثل Vercel) لتخزين الاتصال وإعادة استخدامه.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function ConnectToDb() {
  // إذا كان الاتصال موجودًا بالفعل، أعده مباشرةً
  if (cached.conn) {
    console.log("✅ MongoDB Connection Re-used successfully.");
    return cached.conn;
  }

  // إذا كان هناك وعد (Promise) جاري للاتصال، انتظر اكتماله
  if (!cached.promise) {
    console.log("🔥 Establishing NEW MongoDB Connection...");
    const opts = {
      bufferCommands: false, // يوقف تخزين الأوامر مؤقتاً إذا لم يكن الاتصال جاهزاً
      serverSelectionTimeoutMS: 5000, // مهلة اختيار الخادم
    };

    cached.promise = mongoose.connect(MONGO_URL, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB Connection Successful.");
  } catch (e) {
    cached.promise = null; // إعادة تعيين الوعد للسماح بالمحاولة مرة أخرى
    console.error("❌ Error connecting to MongoDB:", e);
    throw e;
  }

  return cached.conn;
}

