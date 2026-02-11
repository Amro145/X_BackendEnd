import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { ConnectToDb } from "./lib/db.js";

// Import Models
import User from "./Models/auth.model.js";
import Post from "./Models/post.model.js";
import Notification from "./Models/notification.model.js";

dotenv.config();

// الإعدادات المطلوبة
const USERS_COUNT = 50;
const POSTS_COUNT = 200;
const SPECIFIC_NAMES = ["john", "ali", "mohamed", "amro"];

const seed = async () => {
    try {
        console.log("🚀 البدء في عملية Seed لقاعدة البيانات...");
        const connection = await ConnectToDb();
        if (!connection) {
            console.error("❌ فشل الاتصال بقاعدة البيانات");
            process.exit(1);
        }

        console.log("🧹 تنظيف البيانات القديمة...");
        await User.deleteMany({});
        await Post.deleteMany({});
        await Notification.deleteMany({});

        console.log("👥 إنشاء المستخدمين...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        const usersData = [];
        for (let i = 0; i < USERS_COUNT; i++) {
            // استخدام الأسماء المحددة أولاً ثم استخدام faker للبقية
            const userName = i < SPECIFIC_NAMES.length 
                ? SPECIFIC_NAMES[i] 
                : faker.internet.username();

            usersData.push({
                userName: userName,
                email: i < SPECIFIC_NAMES.length ? `${userName}@example.com` : faker.internet.email(),
                password: hashedPassword,
                bio: faker.lorem.sentence(),
                link: faker.internet.url(),
                profilePic: faker.image.avatar(),
                coverPic: faker.image.urlLoremFlickr({ category: 'nature' }),
            });
        }

        const createdUsers = await User.insertMany(usersData);
        console.log(`✅ تم إنشاء ${createdUsers.length} مستخدم بنجاح.`);

        // إنشاء المتابعات (Follows) بشكل جماعي لتحسين الأداء
        console.log("🔗 إنشاء علاقات المتابعة...");
        const followNotifications = [];
        for (const user of createdUsers) {
            const followCount = faker.number.int({ min: 5, max: 15 });
            const potentialFollowees = createdUsers.filter(u => u._id.toString() !== user._id.toString());
            const toFollow = faker.helpers.arrayElements(potentialFollowees, followCount);

            for (const targetUser of toFollow) {
                await User.findByIdAndUpdate(user._id, { $push: { following: targetUser._id } });
                await User.findByIdAndUpdate(targetUser._id, { $push: { followers: user._id } });
                
                followNotifications.push({
                    from: user._id,
                    to: targetUser._id,
                    type: "follow",
                });
            }
        }
        await Notification.insertMany(followNotifications);

        // إنشاء المنشورات
        console.log("📝 إنشاء المنشورات...");
        const postDataArray = [];
        for (let i = 0; i < POSTS_COUNT; i++) {
            const randomUser = faker.helpers.arrayElement(createdUsers);
            postDataArray.push({
                user: randomUser._id,
                text: faker.lorem.paragraph(),
                image: faker.datatype.boolean() ? faker.image.urlLoremFlickr({ category: 'tech' }) : "",
            });
        }
        const createdPosts = await Post.insertMany(postDataArray);
        console.log(`✅ تم إنشاء ${createdPosts.length} منشور.`);

        // إنشاء الإعجابات والتعليقات
        console.log("💬 إضافة التفاعلات (إعجابات وتعليقات)...");
        const interactionNotifications = [];
        
        for (const post of createdPosts) {
            // الإعجابات
            const likers = faker.helpers.arrayElements(createdUsers, faker.number.int({ min: 2, max: 20 }));
            for (const liker of likers) {
                await Post.findByIdAndUpdate(post._id, { $push: { likes: liker._id } });
                await User.findByIdAndUpdate(liker._id, { $push: { likedPosts: post._id } });

                if (liker._id.toString() !== post.user.toString()) {
                    interactionNotifications.push({
                        from: liker._id,
                        to: post.user,
                        type: "like",
                        post: post._id,
                    });
                }
            }

            // التعليقات
            const commentCount = faker.number.int({ min: 1, max: 10 });
            for (let j = 0; j < commentCount; j++) {
                const commenter = faker.helpers.arrayElement(createdUsers);
                const commentText = faker.lorem.sentence();

                await Post.findByIdAndUpdate(post._id, {
                    $push: { comment: { user: commenter._id, text: commentText } }
                });

                if (commenter._id.toString() !== post.user.toString()) {
                    interactionNotifications.push({
                        from: commenter._id,
                        to: post.user,
                        type: "comment",
                        text: commentText,
                        post: post._id,
                    });
                }
            }
        }

        // إدخال جميع إشعارات التفاعل دفعة واحدة
        if (interactionNotifications.length > 0) {
            await Notification.insertMany(interactionNotifications);
        }

        console.log("🎯 تمت عملية Seed بنجاح تام!");
        mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ خطأ أثناء عملية Seed:", error);
        mongoose.disconnect();
        process.exit(1);
    }
};

seed();