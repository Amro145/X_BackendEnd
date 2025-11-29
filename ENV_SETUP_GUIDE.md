# 🔐 Environment Variables Setup Guide

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values** in the `.env` file

---

## 📋 Required Environment Variables

### **Server Configuration**

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `8000` | ✅ |
| `NODE_ENV` | Environment mode | `development` or `production` | ✅ |

### **Database Configuration**

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/x-backend` | ✅ |

**MongoDB Connection String Examples:**
- **Local:** `mongodb://localhost:27017/your-database-name`
- **MongoDB Atlas:** `mongodb+srv://username:password@cluster.mongodb.net/database-name`

### **JWT Configuration**

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET_KEY` | Secret key for JWT tokens | Complex random string | ✅ |

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Cloudinary Configuration**

| Variable | Description | Where to get it | Required |
|----------|-------------|-----------------|----------|
| `CLOUDINARY_NAME` | Your Cloudinary cloud name | [Cloudinary Console](https://cloudinary.com/console) | ✅ |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | [Cloudinary Console](https://cloudinary.com/console) | ✅ |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | [Cloudinary Console](https://cloudinary.com/console) | ✅ |

---

## 🚀 Getting Your Credentials

### **1️⃣ MongoDB Setup**

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use: `mongodb://localhost:27017/x-backend`

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<database>` with your database name

### **2️⃣ Cloudinary Setup**

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Go to your [Dashboard/Console](https://cloudinary.com/console)
4. Find your credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
5. Copy these values to your `.env` file

---

## ⚙️ Example `.env` File

```bash
# Server
PORT=8000
NODE_ENV=development

# Database
MONGO_URL=mongodb+srv://myuser:mypassword@cluster0.mongodb.net/x-backend

# JWT
JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Cloudinary
CLOUDINARY_NAME=my-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` to version control**
   - ✅ `.env` is already in `.gitignore`
   - ✅ Only commit `.env.example`

2. **Use strong secrets**
   - Generate random strings for JWT_SECRET_KEY
   - Never use simple passwords

3. **Different environments**
   - Use different values for development and production
   - Never use production credentials in development

4. **Rotate secrets regularly**
   - Change JWT_SECRET_KEY periodically
   - Update API keys if they're compromised

---

## 🧪 Testing Your Configuration

Test if your environment variables are loaded correctly:

```bash
# Start the server
npm run dev

# You should see:
# "Connect To DB Successfully"
# "Server is running on port 8000"
```

If you see errors:
- ✅ Check if `.env` file exists
- ✅ Verify all required variables are set
- ✅ Check MongoDB connection string is correct
- ✅ Ensure Cloudinary credentials are valid

---

## 🆘 Troubleshooting

### "MONGO_URL is undefined"
- Make sure `.env` file exists
- Check `MONGO_URL` is set in `.env`
- Restart your server after changing `.env`

### "Connect To DB Failed"
- Verify MongoDB is running (if local)
- Check MongoDB Atlas IP whitelist (if cloud)
- Verify username/password in connection string

### JWT/Auth errors
- Ensure `JWT_SECRET_KEY` is set
- Make sure it's a sufficiently long random string

### Cloudinary upload errors
- Verify all three Cloudinary variables are set
- Check credentials in Cloudinary dashboard
- Ensure API permissions are correct

---

## 📝 Notes

- The `.env` file is automatically loaded by `dotenv` package
- Changes to `.env` require server restart
- Never share your `.env` file with anyone
- Keep backup of your credentials in a secure password manager

---

**Created**: 2025-11-29  
**Last Updated**: 2025-11-29
