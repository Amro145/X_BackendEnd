# 🚀 Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

Before deploying to Vercel, ensure:

- [x] ✅ `vercel.json` is configured correctly
- [x] ✅ `.vercelignore` excludes unnecessary files
- [ ] ⚠️ Environment variables are set in Vercel dashboard
- [ ] ⚠️ MongoDB connection string is for production (Atlas)
- [ ] ⚠️ CORS origin is updated for production frontend URL

---

## 🔧 Step 1: Fix CORS for Production

Your current `server.js` only allows `http://localhost:5173`. Update it to accept your production frontend URL:

```javascript
// In server.js, update CORS configuration:
app.use(
  cors({
    origin: [
      "http://localhost:5173",           // Development
      "YOUR_FRONTEND_URL_HERE",          // Production (e.g., https://yourapp.vercel.app)
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "x-access-token"
    ],
  })
);
```

---

## 🌍 Step 2: Set Environment Variables in Vercel

You MUST set these environment variables in Vercel:

### **Go to Vercel Dashboard:**
1. Open your project in Vercel
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Example |
|---------------|-------|---------|
| `MONGO_URL` | Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET_KEY` | Your JWT secret (use a strong random string) | `4379d394ecd798c131bd302790cffdae...` |
| `CLOUDINARY_NAME` | Your Cloudinary cloud name | `my-cloud-name` |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | `abcdefghijklmnopqrst` |
| `PORT` | Port number (optional, Vercel assigns this) | `8000` |
| `NODE_ENV` | Environment mode | `production` |

⚠️ **IMPORTANT**: Without these environment variables, your app will NOT work!

---

## 📝 Step 3: Update CORS Origin

After deploying, get your Vercel deployment URL and update `server.js`:

```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://your-frontend.vercel.app',
      'https://your-custom-domain.com'
    ]
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "x-access-token"
    ],
  })
);
```

---

## 🗄️ Step 4: MongoDB Atlas Setup

Since you're deploying to Vercel, you need MongoDB Atlas (cloud database):

### **1. Create MongoDB Atlas Account:**
- Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create a free account
- Create a new cluster (Free tier is sufficient)

### **2. Configure Network Access:**
- Go to **Network Access**
- Click **Add IP Address**
- Click **Allow Access from Anywhere** (0.0.0.0/0)
  - This is needed because Vercel uses dynamic IPs
- Click **Confirm**

### **3. Create Database User:**
- Go to **Database Access**
- Click **Add New Database User**
- Create username and strong password
- Set role to **Read and write to any database**
- Click **Add User**

### **4. Get Connection String:**
- Go to **Database** → **Connect**
- Choose **Connect your application**
- Copy the connection string
- Replace `<password>` with your database user password
- Replace `<database>` with your database name (e.g., `x-backend`)

Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/x-backend?retryWrites=true&w=majority
```

---

## 🚀 Step 5: Deploy to Vercel

### **Method 1: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# ? Set up and deploy? Yes
# ? Which scope? Your account name
# ? Link to existing project? No
# ? What's your project's name? x-backend
# ? In which directory is your code located? ./
```

### **Method 2: Using GitHub Integration**

1. Push your code to GitHub (already done ✅)
2. Go to [vercel.com](https://vercel.com)
3. Click **New Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Other
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`
6. Add environment variables (see Step 2)
7. Click **Deploy**

---

## 🔍 Step 6: Verify Deployment

After deployment, test your API:

```bash
# Replace YOUR_VERCEL_URL with your actual Vercel URL
curl https://YOUR_VERCEL_URL.vercel.app/test

# Expected response: "Hello from server"
```

Test signup:
```bash
curl -X POST https://YOUR_VERCEL_URL.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"userName":"test","email":"test@example.com","password":"password123"}'
```

---

## ⚠️ Common Issues & Solutions

### **1. "Cannot GET /"**
**Problem**: Root route not defined  
**Solution**: Access `/test` endpoint: `https://your-url.vercel.app/test`

### **2. "MONGO_URL is undefined"**
**Problem**: Environment variables not set in Vercel  
**Solution**: Add all environment variables in Vercel dashboard (Settings → Environment Variables)

### **3. "MongoNetworkError: failed to connect"**
**Problem**: MongoDB Atlas not allowing Vercel IPs  
**Solution**: 
- Go to MongoDB Atlas → Network Access
- Add IP: `0.0.0.0/0` (Allow from anywhere)

### **4. "CORS error" from frontend**
**Problem**: CORS not configured for production URL  
**Solution**: Update `server.js` CORS origin with your frontend URL

### **5. "Cannot set headers after they are sent"**
**Problem**: Multiple responses in one handler  
**Solution**: Already fixed in your code ✅

### **6. Build fails with "command not found"**
**Problem**: Vercel is looking for build script  
**Solution**: Remove any build commands, Vercel auto-detects Node.js

---

## 📊 Vercel Dashboard Overview

After deployment, you can see:
- **Deployments**: All deployment history
- **Analytics**: Response times, requests
- **Logs**: Runtime logs (check for errors here)
- **Settings**: Environment variables, domains

---

## 🔐 Security Best Practices

### **1. Rotate Secrets:**
- Use different JWT_SECRET_KEY for production
- Never use development credentials in production

### **2. MongoDB Security:**
- Create separate database user for production
- Use strong passwords
- Regularly update passwords

### **3. Environment Variables:**
- Never commit `.env` to Git ✅
- Set different values for dev/prod
- Use Vercel's environment variables feature

### **4. CORS:**
- Only allow your actual frontend domains
- Don't use `*` (allow all) in production

---

## 📝 Deployment Checklist

Before deploying:
- [ ] All environment variables set in Vercel
- [ ] MongoDB Atlas cluster created and configured
- [ ] Network access set to allow Vercel IPs (0.0.0.0/0)
- [ ] Database user created with strong password
- [ ] Connection string tested locally
- [ ] CORS configured for production URL
- [ ] JWT_SECRET_KEY is production-ready (strong & unique)
- [ ] Cloudinary credentials are set
- [ ] `.env` file is NOT committed (check .gitignore)
- [ ] Code pushed to GitHub

After deploying:
- [ ] Test `/test` endpoint
- [ ] Test signup/login
- [ ] Test creating a post
- [ ] Check Vercel logs for errors
- [ ] Update frontend to use production API URL
- [ ] Test CORS from frontend

---

## 🛠️ Useful Commands

```bash
# Deploy to production
vercel --prod

# Check deployment logs
vercel logs

# List all deployments
vercel ls

# Environment variables
vercel env ls
vercel env add MONGO_URL
vercel env rm MONGO_URL

# Promote a deployment to production
vercel promote <deployment-url>
```

---

## 📚 Additional Resources

- [Vercel Node.js Deployment](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [MongoDB Atlas Getting Started](https://docs.atlas.mongodb.com/getting-started/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

---

## 🎯 Quick Deploy Summary

1. **Set Environment Variables** in Vercel Dashboard
2. **Setup MongoDB Atlas** and whitelist all IPs
3. **Update CORS** in `server.js` with production frontend URL
4. **Push to GitHub** (already done ✅)
5. **Deploy via Vercel** (GitHub integration or CLI)
6. **Test the deployment** with curl or Postman
7. **Update frontend** to use production API URL

---

## 🔄 Redeploying After Changes

```bash
# 1. Make your changes
# 2. Commit and push
git add .
git commit -m "update: description"
git push

# 3. Vercel auto-deploys on push (if GitHub integration is set up)
# Or manually deploy:
vercel --prod
```

---

**Your backend is ready for deployment! Follow the steps above and you'll be live in minutes!** 🚀

**Important Next Step**: Set your environment variables in Vercel Dashboard before the next deployment.
