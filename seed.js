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

const USERS_COUNT = 10;
const POSTS_COUNT = 30;

const seed = async () => {
    try {
        console.log("Connecting to Database...");
        const connection = await ConnectToDb();
        if (!connection) {
            console.error("Failed to connect to DB");
            process.exit(1);
        }

        console.log("Clearing existing data...");
        await User.deleteMany({});
        await Post.deleteMany({});
        await Notification.deleteMany({});

        console.log("Creating Users...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        const usersData = [];
        for (let i = 0; i < USERS_COUNT; i++) {
            usersData.push({
                userName: faker.internet.username(),
                email: faker.internet.email(),
                password: hashedPassword,
                bio: faker.lorem.sentence(),
                link: faker.internet.url(),
                profilePic: faker.image.avatar(),
                coverPic: faker.image.urlLoremFlickr({ category: 'nature' }),
            });
        }

        const createdUsers = await User.insertMany(usersData);
        console.log(`Created ${createdUsers.length} users.`);

        // Create Follows interactions
        console.log("Creating Follows...");
        for (const user of createdUsers) {
            // Determine random number of users to follow (0 to 5)
            const followCount = faker.number.int({ min: 0, max: 5 });
            const potentialFollowees = createdUsers.filter(u => u._id.toString() !== user._id.toString());
            const toFollow = faker.helpers.arrayElements(potentialFollowees, followCount);

            for (const targetUser of toFollow) {
                // Update following/followers lists
                await User.findByIdAndUpdate(user._id, { $push: { following: targetUser._id } });
                await User.findByIdAndUpdate(targetUser._id, { $push: { followers: user._id } });

                // Create Notification
                await Notification.create({
                    from: user._id,
                    to: targetUser._id,
                    type: "follow",
                });
            }
        }

        // Create Posts
        console.log("Creating Posts...");
        const createdPosts = [];
        for (let i = 0; i < POSTS_COUNT; i++) {
            const randomUser = faker.helpers.arrayElement(createdUsers);
            const hasImage = faker.datatype.boolean();

            const postData = {
                user: randomUser._id,
                text: faker.lorem.paragraph(),
                image: hasImage ? faker.image.urlLoremFlickr({ category: 'city' }) : "",
            };

            // Using save() to trigger the post('save') middleware for notifications
            const newPost = new Post(postData);
            await newPost.save();
            createdPosts.push(newPost);
        }
        console.log(`Created ${createdPosts.length} posts.`);

        // Create Likes and Comments
        console.log("Creating Likes and Comments...");
        for (const post of createdPosts) {
            // Determine random number of likes (0 to 8)
            const likeCount = faker.number.int({ min: 0, max: 8 });
            const potentialLikers = createdUsers;
            const likers = faker.helpers.arrayElements(potentialLikers, likeCount);

            for (const liker of likers) {
                // Add like to Post
                await Post.findByIdAndUpdate(post._id, { $push: { likes: liker._id } });
                // Add post to User's likedPosts
                await User.findByIdAndUpdate(liker._id, { $push: { likedPosts: post._id } });

                // Create Notification if not self-like
                if (liker._id.toString() !== post.user.toString()) {
                    await Notification.create({
                        from: liker._id,
                        to: post.user, // Post owner
                        type: "like",
                        post: post._id,
                    });
                }
            }

            // Determine random number of comments (0 to 5)
            const commentCount = faker.number.int({ min: 0, max: 5 });
            const commenters = faker.helpers.arrayElements(createdUsers, commentCount);

            for (const commenter of commenters) {
                const commentText = faker.lorem.sentence();

                // Add comment to Post
                await Post.findByIdAndUpdate(post._id, {
                    $push: {
                        comment: {
                            user: commenter._id,
                            text: commentText
                        }
                    }
                });

                // Create Notification if not self-comment
                if (commenter._id.toString() !== post.user.toString()) {
                    await Notification.create({
                        from: commenter._id,
                        to: post.user, // Post owner
                        type: "comment",
                        text: commentText,
                        post: post._id,
                    });
                }
            }
        }

        console.log("Database seeded successfully!");
        mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        mongoose.disconnect();
        process.exit(1);
    }
};

seed();
