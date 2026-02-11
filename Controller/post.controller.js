import User from "../Models/auth.model.js"
import Notification from "../Models/notification.model.js"
import Post from "../Models/post.model.js"
import { v2 as cloudinary } from "cloudinary"
import { asyncHandler } from "../MiddleWare/asyncHandler.js"
import mongoose from "mongoose"
import { getCache, setCache, clearCacheByPrefix, delCache } from "../lib/cache.js"


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

        const savedPost = await newPost.save({ session })

        await session.commitTransaction();

        // Clear related caches
        clearCacheByPrefix("posts_all");
        clearCacheByPrefix("posts_following");
        clearCacheByPrefix(`posts_user_${myId}`);

        const createdPost = await Post.findById(savedPost._id)
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comment.user", select: "-password" });

        return res.status(201).json(createdPost);

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
    const userId = post.user;
    await Post.findByIdAndDelete(post._id)

    // Clear caches
    clearCacheByPrefix("posts_all");
    clearCacheByPrefix("posts_following");
    clearCacheByPrefix(`posts_user_${userId}`);

    return res.status(200).json({ message: "Post deleted successfully", id: post._id });
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

    // Clear caches
    clearCacheByPrefix("posts_all");
    clearCacheByPrefix("posts_following");
    clearCacheByPrefix(`posts_user_${post.user}`);

    // Return the specified post with comments
    const updatedPost = await Post.findById(postId)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" });

    return res.status(200).json(updatedPost);
})

export const likeUnlike = asyncHandler(async (req, res) => {
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
    } else {
        // If already liked, remove the like
        await Post.findByIdAndUpdate(postId, {
            $pull: { likes: me._id }
        });

        await User.findByIdAndUpdate(me._id, {
            $pull: { likedPosts: postId }
        });
    }

    // Clear caches
    clearCacheByPrefix("posts_all");
    clearCacheByPrefix("posts_following");
    clearCacheByPrefix(`posts_user_${post.user}`);

    // Return the updated post
    const updatedPost = await Post.findById(postId)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" });

    return res.status(200).json(updatedPost);
})


export const getAllPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts_all_p${page}_l${limit}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        return res.status(200).json(cachedData);
    }

    const [posts, total] = await Promise.all([
        Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comment.user", select: "-password" })
            .exec(),
        Post.countDocuments()
    ]);

    const responseData = {
        posts: posts || [],
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
    };

    setCache(cacheKey, responseData, 60); // Cache for 1 minute

    return res.status(200).json(responseData);
})

export const getOnePost = asyncHandler(async (req, res) => {
    const { id } = req.params
    const post = await Post.findById(id)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" });

    if (!post) {
        return res.status(404).json({ message: "Post not found" })
    }
    return res.status(200).json(post)
})

export const getLikedPosts = asyncHandler(async (req, res) => {
    const me = req.user
    if (!me) return res.status(404).json({ message: "user not found" })

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
        Post.find({ _id: { $in: me.likedPosts } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: "user", select: "-password" })
            .populate({ path: "likes", select: "-password" })
            .populate({ path: "comment.user", select: "-password" })
            .exec(),
        Post.countDocuments({ _id: { $in: me.likedPosts } })
    ]);

    const responseData = {
        posts: posts || [],
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
    };

    return res.status(200).json(responseData)
})

export const getFollowingPosts = asyncHandler(async (req, res) => {
    const me = req.user
    if (!me) return res.status(404).json({ message: "user not found" })

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts_following_${me._id}_p${page}_l${limit}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        return res.status(200).json(cachedData);
    }

    const myfollowingId = me.following || [];
    const [followingPosts, total] = await Promise.all([
        Post.find({ user: { $in: myfollowingId } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: "user", select: "-password" })
            .populate({ path: "likes", select: "-password" })
            .populate({ path: "comment.user", select: "-password" })
            .exec(),
        Post.countDocuments({ user: { $in: myfollowingId } })
    ]);

    const responseData = {
        posts: followingPosts || [],
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
    };

    setCache(cacheKey, responseData, 60); // Cache for 1 minute

    return res.status(200).json(responseData)
})

export const getUserPosts = asyncHandler(async (req, res) => {
    const userId = req.params.userid
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "user not found" })

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts_user_${userId}_p${page}_l${limit}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        return res.status(200).json(cachedData);
    }

    const [userPosts, total] = await Promise.all([
        Post.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: "user", select: "-password" })
            .populate({ path: "likes", select: "-password" })
            .populate({ path: "comment.user", select: "-password" })
            .exec(),
        Post.countDocuments({ user: userId })
    ]);

    const responseData = {
        posts: userPosts || [],
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
    };

    setCache(cacheKey, responseData, 120); // Cache for 2 minutes

    return res.status(200).json(responseData)
})