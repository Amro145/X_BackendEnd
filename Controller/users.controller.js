import { v2 as cloudinary } from "cloudinary";
import User from "../Models/auth.model.js";
import Notification from "../Models/notification.model.js";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../MiddleWare/asyncHandler.js";
import mongoose from "mongoose";
import { updateProfileSchema } from "../Validators/auth.validator.js";

export const getUsersProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cacheKey = `user_profile_${id}`;
    const cachedProfile = getCache(cacheKey);

    if (cachedProfile) {
        return res.status(200).json(cachedProfile);
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    setCache(cacheKey, user, 600); // Cache for 10 minutes

    return res.status(200).json(user);
});

export const followUnFollowUser = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const currentUser = req.user;

        // Clear suggested users cache on follow/unfollow
        clearCacheByPrefix(`suggested_users_${currentUser._id}`);

        const selectedUser = await User.findById(id).session(session);

        if (!currentUser || !selectedUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "User not found" });
        }

        if (selectedUser._id.toString() === currentUser._id.toString()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "You cannot follow/unfollow yourself!" });
        }

        const isFollowing = currentUser.following.some(fid => fid.toString() === id);

        if (isFollowing) {
            // Unfollowing
            await User.findByIdAndUpdate(id, { $pull: { followers: currentUser._id } }).session(session);
            await User.findByIdAndUpdate(currentUser._id, { $pull: { following: id } }).session(session);

            await session.commitTransaction();

            const myAccount = await User.findById(currentUser._id).select("-password");
            const followedUser = await User.findById(id).select("-password");

            return res.status(200).json({ myAccount, followedUser, isFollowing: false });
        } else {
            // Following
            await User.findByIdAndUpdate(id, { $push: { followers: currentUser._id } }).session(session);
            await User.findByIdAndUpdate(currentUser._id, { $push: { following: id } }).session(session);

            // Send notification
            const newNotification = new Notification({
                from: currentUser._id,
                to: selectedUser._id,
                type: "follow",
            });
            await newNotification.save({ session });

            await session.commitTransaction();

            const myAccount = await User.findById(currentUser._id).select("-password");
            const followedUser = await User.findById(id).select("-password");

            return res.status(200).json({ myAccount, followedUser, isFollowing: true });
        }
    } catch (error) {
        await session.abortTransaction();
        console.error("Error in followUnFollowUser:", error);
        throw error;
    } finally {
        session.endSession();
    }
});

import { getCache, setCache, clearCacheByPrefix } from "../lib/cache.js";

export const isGetSuggestedUser = asyncHandler(async (req, res) => {
    const currentUser = req.user;

    const cacheKey = `suggested_users_${currentUser._id}`;
    const cachedUsers = getCache(cacheKey);

    if (cachedUsers) {
        return res.status(200).json(cachedUsers);
    }

    const suggestedUsers = await User.aggregate([
        {
            $match: {
                _id: {
                    $ne: currentUser._id,
                    $nin: currentUser.following || []
                }
            }
        },
        {
            $sample: {
                size: 4
            }
        },
        {
            $project: {
                password: 0,
            }
        }
    ]);

    setCache(cacheKey, suggestedUsers, 300); // Cache for 5 minutes

    return res.status(200).json(suggestedUsers);
});

export const updateProfile = asyncHandler(async (req, res) => {
    const validatedData = await updateProfileSchema.parseAsync(req.body);
    let { userName, email, bio, link, profilePic, coverPic } = validatedData;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (profilePic) {
        if (user.profilePic) {
            const publicId = user.profilePic.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }
        const uploadedImage = await cloudinary.uploader.upload(profilePic);
        profilePic = uploadedImage.secure_url;
    }

    if (coverPic) {
        if (user.coverPic) {
            const publicId = user.coverPic.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }
        const uploadedImage = await cloudinary.uploader.upload(coverPic);
        coverPic = uploadedImage.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            userName,
            email,
            bio,
            link,
            profilePic,
            coverPic,
        },
        { new: true, runValidators: true }
    ).select("-password");

    // Clear profile cache
    delCache(`user_profile_${userId}`);
    clearCacheByPrefix("posts_all"); // User info in posts might be outdated

    return res.status(200).json(updatedUser);
});

export const updatePassword = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    let { password, oldPassword } = req.body;

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!oldPassword || !password) {
        return res.status(400).json({ message: "Please provide both old and new passwords." });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Old password is not correct. Please try again." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json(updatedUser);
});

export const getFollowing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate("following", "-password");
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const myFollowing = user.following;
    const myProfile = await User.findById(req.user._id).select("-password");
    return res.status(200).json({ myFollowing, myProfile });
});

export const getFollowers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate("followers", "-password");
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user.followers);
});