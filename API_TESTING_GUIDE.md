# 🧪 API Testing Guide

## 📁 Test Files Overview

I've created comprehensive test files for you:

1. **`test-data.json`** - Sample data for manual testing
2. **`api-tests.http`** - VS Code REST Client requests
3. **`postman-collection.json`** - Postman collection
4. **This guide** - Complete testing workflow

---

## 🚀 Quick Start Testing

### **Method 1: Using cURL (Terminal)**

#### 1️⃣ **Test Server is Running**
```bash
curl http://localhost:8000/test
# Expected: "Hello from server"
```

#### 2️⃣ **Signup a User**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### 3️⃣ **Login**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### 4️⃣ **Create a Post** (requires authentication)
```bash
curl -X POST http://localhost:8000/api/post/createpost \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "text": "My first post! 🚀"
  }'
```

#### 5️⃣ **Get All Posts**
```bash
curl http://localhost:8000/api/post/all \
  -b cookies.txt
```

---

### **Method 2: Using VS Code REST Client**

1. **Install Extension:**
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search for "REST Client"
   - Install it

2. **Open the test file:**
   ```
   api-tests.http
   ```

3. **Click "Send Request" above any request**
   - Or use shortcut: `Ctrl+Alt+R` (Windows/Linux) or `Cmd+Alt+R` (Mac)

4. **Sequential Testing:**
   - Start with Signup
   - Then Login (this sets cookies automatically)
   - Then test other endpoints

---

### **Method 3: Using Postman**

1. **Import Collection:**
   - Open Postman
   - Click "Import"
   - Select `postman-collection.json`

2. **Test Flow:**
   ```
   Authentication → Signup → Login → Create Post → Get Posts
   ```

3. **Cookies are handled automatically** by Postman

---

## 📝 Complete Testing Workflow

### **Step-by-Step Test Flow:**

```
1. Signup User 1
   ↓
2. Login User 1
   ↓
3. Create Post (User 1)
   ↓
4. Signup User 2
   ↓
5. Login User 2
   ↓
6. Follow User 1 (User 2 follows User 1)
   ↓
7. Like Post (User 2 likes User 1's post)
   ↓
8. Comment on Post
   ↓
9. Get All Posts
   ↓
10. Get Notifications (User 1 should see notifications)
```

---

## 🧪 Testing Each Route Category

### **1. Authentication Routes**

```bash
# Signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"userName":"john","email":"john@example.com","password":"pass123"}'

# Login (save cookies)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"john@example.com","password":"pass123"}'

# Check Auth
curl http://localhost:8000/api/auth/check -b cookies.txt

# Logout
curl http://localhost:8000/api/auth/logout -b cookies.txt
```

---

### **2. Post Routes**

**Before testing posts, you MUST be logged in!**

```bash
# Create text-only post
curl -X POST http://localhost:8000/api/post/createpost \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"text":"Hello World! 🌍"}'

# Get all posts
curl http://localhost:8000/api/post/all -b cookies.txt

# Like a post (replace POST_ID)
curl -X PUT http://localhost:8000/api/post/like/POST_ID -b cookies.txt

# Comment on post (replace POST_ID)
curl -X POST http://localhost:8000/api/post/comment/POST_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"text":"Nice post!"}'

# Delete post (replace POST_ID)
curl -X DELETE http://localhost:8000/api/post/POST_ID -b cookies.txt
```

---

### **3. User Routes**

```bash
# Get user profile (replace USER_ID)
curl http://localhost:8000/api/users/profile/USER_ID -b cookies.txt

# Follow user (replace USER_ID)
curl -X POST http://localhost:8000/api/users/follow/USER_ID -b cookies.txt

# Get suggested users
curl http://localhost:8000/api/users/suggested -b cookies.txt

# Update profile
curl -X PUT http://localhost:8000/api/users/updateProfile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"userName":"newname","bio":"New bio"}'

# Update password
curl -X PUT http://localhost:8000/api/users/updatePassword \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"oldPassword":"pass123","password":"newpass123"}'
```

---

### **4. Notification Routes**

```bash
# Get all notifications
curl http://localhost:8000/api/notification/ -b cookies.txt

# Delete all notifications
curl -X DELETE http://localhost:8000/api/notification/ -b cookies.txt

# Delete single notification (replace NOTIF_ID)
curl -X DELETE http://localhost:8000/api/notification/NOTIF_ID -b cookies.txt
```

---

## 🎯 Expected Responses

### **Success Responses:**

- **Signup**: Returns user object with 201 status
- **Login**: Returns user object with 200 status (sets JWT cookie)
- **Create Post**: Returns all posts array with 201 status
- **Get Posts**: Returns array of posts with 200 status
- **Like Post**: Returns updated posts array with 200 status

### **Error Responses:**

- **400**: Bad request (missing fields, validation errors)
- **401**: Unauthorized (not logged in)
- **404**: Not found (user/post doesn't exist)
- **500**: Internal server error

---

## 🔍 Debugging Tips

### **1. Check if server is running:**
```bash
curl http://localhost:8000/test
```

### **2. Check cookies are being saved:**
```bash
cat cookies.txt
# Should show JWT token
```

### **3. View detailed request/response:**
```bash
curl -v http://localhost:8000/api/auth/check -b cookies.txt
```

### **4. Pretty print JSON response:**
```bash
curl http://localhost:8000/api/post/all -b cookies.txt | jq
```

---

## 📊 Sample Test Script

Create a file `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"
COOKIES="cookies.txt"

echo "🧪 Testing X Backend API..."

# Test 1: Server health
echo "1️⃣ Testing server..."
curl -s $BASE_URL/test
echo ""

# Test 2: Signup
echo "2️⃣ Creating user..."
curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"userName":"testuser","email":"test@example.com","password":"password123"}' | jq
echo ""

# Test 3: Login
echo "3️⃣ Logging in..."
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -c $COOKIES \
  -d '{"email":"test@example.com","password":"password123"}' | jq
echo ""

# Test 4: Create post
echo "4️⃣ Creating post..."
curl -s -X POST $BASE_URL/api/post/createpost \
  -H "Content-Type: application/json" \
  -b $COOKIES \
  -d '{"text":"Test post from script! 🚀"}' | jq
echo ""

# Test 5: Get posts
echo "5️⃣ Getting all posts..."
curl -s $BASE_URL/api/post/all -b $COOKIES | jq
echo ""

echo "✅ Tests complete!"
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🎨 Pretty Print with jq

Install jq for better JSON formatting:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Then use it:
curl http://localhost:8000/api/post/all -b cookies.txt | jq
```

---

## 📝 Testing Checklist

- [ ] Server starts without errors
- [ ] Can signup new user
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong credentials
- [ ] Can create post when logged in
- [ ] Cannot create post when not logged in
- [ ] Can see all posts
- [ ] Can like/unlike posts
- [ ] Can comment on posts
- [ ] Can delete own posts
- [ ] Cannot delete other users' posts
- [ ] Can follow/unfollow users
- [ ] Notifications are created correctly
- [ ] Can update profile
- [ ] Can update password

---

## 🛠️ Troubleshooting

### **"Please Login" error:**
- Make sure you're sending cookies with the request
- Use `-b cookies.txt` with curl
- Or manually set cookie header

### **"User not found" error:**
- User might not exist
- Check if signup was successful
- Verify email is correct

### **"Post not found" error:**
- Replace POST_ID with actual MongoDB ObjectId
- Get IDs from "Get All Posts" response

### **CORS errors:**
- Server is configured for `http://localhost:5173`
- Update `server.js` if using different frontend URL

---

## 📚 Additional Resources

- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI for MongoDB
- [Postman](https://www.postman.com/) - API testing tool
- [REST Client VS Code](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) - Test APIs in VS Code
- [jq](https://stedolan.github.io/jq/) - JSON processor

---

**Happy Testing! 🎉**
