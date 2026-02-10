import User from "../Models/auth.model.js"
import Notification from "../Models/notification.model.js"
import Post from "../Models/post.model.js"
import { v2 as cloudinary } from "cloudinary"
import { asyncHandler } from "../MiddleWare/asyncHandler.js"
import mongoose from "mongoose"


export const createPost = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { text } = req.body
        let { image } = req.body
        const myId = req.user._id
        const me = await User.findById(myId).session(session)
        if (!me) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "User Not Found" })
        }
        if (!text && !image) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Post should be have text or image" })
        }
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            image = uploadResponse.secure_url
        }
        const newPost = new Post({
            user: myId,
            text,
            image,
        })

        await newPost.save({ session })

        await session.commitTransaction();

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comment.user", select: "-password" });
        return res.status(201).json(posts);

    } catch (error) {
        await session.abortTransaction();
        console.log("error in create post", error);
        throw error;
    } finally {
        session.endSession();
    }
})

export const deletePost = asyncHandler(async (req, res) => {
    const postId = req.params.id
    const post = await Post.findById(postId)
    if (!post) {
        return res.status(404).json({ message: " post not found   " })
    }
    if (post.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "You are not authorized" })
    }
    if (post.image) {
        const imageId = post.image.split("/").pop().split(".")[0]
        await cloudinary.uploader.destroy(imageId)
    }
    await Post.findByIdAndDelete(post._id)
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" });
    return res.status(201).json(posts);
})

export const commentOnPost = asyncHandler(async (req, res) => {
    const me = req.user;
    const postId = req.params.id;
    const { text } = req.body;

    // Search for the post
    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Check if the comment text exists
    if (!text) {
        return res.status(400).json({ message: "Comment text is required" });
    }

    // Add the comment to the post
    const comment = { user: me._id, text };
    post.comment.push(comment);
    await post.save();

    // Return the specified post with comments
    const updatedPost = await Post.findById(postId)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" });

    // Create a notification for the post owner
    if (me._id.toString() !== post.user.toString()) {
        const newNotification = new Notification({
            from: me._id,
            to: post.user,
            type: "comment",
            text: text,
            post: post._id,
        });
        await newNotification.save();
    }

    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" });
    return res.status(200).json(posts);
})

export const likeUnlike = asyncHandler(async (req, res) => {
    console.log("User in likeUnlike:", req.user); // Debug log
    const me = req.user;
    const postId = req.params.id;

    // Search for the post
    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has already liked the post
    const isLike = post.likes.some(id => id.toString() === me._id.toString());

    // If not liked, add the like
    if (!isLike) {
        await Post.findByIdAndUpdate(postId, {
            $push: { likes: me._id }
        });

        await User.findByIdAndUpdate(me._id, {
            $push: { likedPosts: postId }
        });

        // Create a notification for the post owner
        if (me._id.toString() !== post.user.toString()) {
            const newNotification = new Notification({
                from: me._id,
                to: post.user,
                type: "like",
                post: postId,
            });
            await newNotification.save();
        }

        // Return the updated post
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comment.user", select: "-password" });
        return res.status(200).json(posts);
    } else {
        // If already liked, remove the like
        await Post.findByIdAndUpdate(postId, {
            $pull: { likes: me._id }
        });

        await User.findByIdAndUpdate(me._id, {
            $pull: { likedPosts: postId }
        });

        // Return the updated post
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comment.user", select: "-password" });
        return res.status(200).json(posts);
    }
})

export const getAllPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" });

    const total = await Post.countDocuments();

    return res.status(200).json({
        posts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
    });
})

export const getOnePost = asyncHandler(async (req, res) => {
    const { id } = req.params
    const post = await Post.findById(id).sort({ createdAt: -1 })
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" })
    if (!post) {
        return res.status(400).json({ message: "Invalid Id" })
    }
    return res.status(200).json(post)
})

export const getLikedPosts = asyncHandler(async (req, res) => {
    const me = req.user
    if (!me) return res.status(404).json({ message: "user not found" })

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ _id: { $in: me.likedPosts } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "likes", select: "-password" })
        .populate({ path: "comment.user", select: "-password" })
    return res.status(200).json(posts)
})

export const getFollowingPosts = asyncHandler(async (req, res) => {
    const me = req.user
    if (!me) return res.status(404).json({ message: "user not found" })

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const myfollowingId = me.following
    const followingPosts = await Post.find({ user: { $in: myfollowingId } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "likes", select: "-password" })
        .populate({ path: "comment.user", select: "-password" })
    return res.status(200).json(followingPosts)
})

export const getUserPosts = asyncHandler(async (req, res) => {
    const userId = req.params.userid
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "user not found" })

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userPosts = await Post.find({ user: { $in: user._id } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "likes", select: "-password" })
        .populate({ path: "comment.user", select: "-password" })
    return res.status(200).json(userPosts)
})