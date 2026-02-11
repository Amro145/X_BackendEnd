import User from "../Models/auth.model.js"
import Notification from "../Models/notification.model.js"
import Post from "../Models/post.model.js"
import { v2 as cloudinary } from "cloudinary"
import { asyncHandler } from "../MiddleWare/asyncHandler.js"
import mongoose from "mongoose"
import { getCache, setCache, clearCacheByPrefix } from "../lib/cache.js"

export const createPost = asyncHandler(async (req, res) => {
    const { text } = req.body
    let { image } = req.body
    const myId = req.user._id

    if (!text && !image) {
        return res.status(400).json({ message: "Post should have text or image" })
    }

    if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image)
        image = uploadResponse.secure_url
    }

    const newPost = new Post({
        user: myId,
        text,
        image,
    });

    await newPost.save();

    // Clear related caches
    clearCacheByPrefix("posts_all");
    clearCacheByPrefix("posts_following");
    clearCacheByPrefix(`posts_user_${myId}`);

    const createdPost = await Post.findById(newPost._id)
        .populate("user", "-password")
        .populate("comment.user", "-password")
        .lean()
        .exec();

    return res.status(201).json(createdPost);
})

export const deletePost = asyncHandler(async (req, res) => {
    const postId = req.params.id
    const post = await Post.findById(postId)
    if (!post) {
        return res.status(404).json({ message: "Post not found" })
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

    clearCacheByPrefix("posts_all");
    clearCacheByPrefix("posts_following");
    clearCacheByPrefix(`posts_user_${userId}`);

    return res.status(200).json({ message: "Post deleted successfully", id: postId });
})

export const commentOnPost = asyncHandler(async (req, res) => {
    const me = req.user;
    const postId = req.params.id;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    if (!text) {
        return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = { user: me._id, text };
    post.comment.push(comment);
    await post.save();

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

    clearCacheByPrefix("posts_all");
    clearCacheByPrefix("posts_following");
    clearCacheByPrefix(`posts_user_${post.user}`);

    const updatedPost = await Post.findById(postId)
        .populate("user", "-password")
        .populate("comment.user", "-password")
        .lean()
        .exec();

    return res.status(200).json(updatedPost);
})

export const likeUnlike = asyncHandler(async (req, res) => {
    const me = req.user;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    const isLike = post.likes.some(id => id.toString() === me._id.toString());

    if (!isLike) {
        await Post.findByIdAndUpdate(postId, { $push: { likes: me._id } });
        await User.findByIdAndUpdate(me._id, { $push: { likedPosts: postId } });

        if (me._id.toString() !== post.user.toString()) {
            await new Notification({
                from: me._id,
                to: post.user,
                type: "like",
                post: postId,
            }).save();
        }
    } else {
        await Post.findByIdAndUpdate(postId, { $pull: { likes: me._id } });
        await User.findByIdAndUpdate(me._id, { $pull: { likedPosts: postId } });
    }

    clearCacheByPrefix("posts_all");
    clearCacheByPrefix("posts_following");
    clearCacheByPrefix(`posts_user_${post.user}`);

    const updatedPost = await Post.findById(postId)
        .populate("user", "-password")
        .populate("comment.user", "-password")
        .lean()
        .exec();

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

    const posts = await Post.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comment.user", select: "-password" })
        .lean()
        .exec();

    const total = await Post.countDocuments({});

    const responseData = {
        posts: posts || [],
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
    };

    setCache(cacheKey, responseData, 60);

    return res.status(200).json(responseData);
})

export const getOnePost = asyncHandler(async (req, res) => {
    const { id } = req.params
    const post = await Post.findById(id)
        .populate("user", "-password")
        .populate("comment.user", "-password")
        .lean()
        .exec();

    if (!post) {
        return res.status(404).json({ message: "Post not found" })
    }
    return res.status(200).json(post)
})

export const getLikedPosts = asyncHandler(async (req, res) => {
    const me = req.user
    if (!me) return res.status(404).json({ message: "User not found" })

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ _id: { $in: me.likedPosts } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "-password")
        .populate("comment.user", "-password")
        .lean()
        .exec();

    const total = await Post.countDocuments({ _id: { $in: me.likedPosts } });

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
    if (!me) return res.status(404).json({ message: "User not found" })

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts_following_${me._id}_p${page}_l${limit}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        return res.status(200).json(cachedData);
    }

    const myfollowingId = me.following || [];
    const followingPosts = await Post.find({ user: { $in: myfollowingId } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "-password")
        .populate("comment.user", "-password")
        .lean()
        .exec();

    const total = await Post.countDocuments({ user: { $in: myfollowingId } });

    const responseData = {
        posts: followingPosts || [],
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
    };

    setCache(cacheKey, responseData, 60);

    return res.status(200).json(responseData)
})

export const getUserPosts = asyncHandler(async (req, res) => {
    const userId = req.params.userid

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts_user_${userId}_p${page}_l${limit}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        return res.status(200).json(cachedData);
    }

    const userPosts = await Post.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "-password")
        .populate("comment.user", "-password")
        .lean()
        .exec();

    const total = await Post.countDocuments({ user: userId });

    const responseData = {
        posts: userPosts || [],
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
    };

    setCache(cacheKey, responseData, 120);

    return res.status(200).json(responseData)
})