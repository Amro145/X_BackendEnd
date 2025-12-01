import { v2 as cloudinary } from "cloudinary";
import User from "../Models/auth.model.js";
import Notfication from "../Models/notification.model.js";
import bcrypt from "bcryptjs";

export const getUsersProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error in getUsersProfile:", error); // Use console.error for errors
        return res.status(500).json({ message: "Error in getting user profile" });
    }
};

export const followUnFollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user; // Renamed 'me' to 'currentUser' for clarity

        const selectedUser = await User.findById(id);

        if (!currentUser || !selectedUser) {
            return res.status(400).json({ message: "User not found" });
        }

        if (selectedUser._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({ message: "You cannot follow/unfollow yourself!" });
        }

        const isFollowing = currentUser.following.some(fid => fid.toString() === id);

        if (isFollowing) {
            // Unfollowing
            await User.findByIdAndUpdate(id, { $pull: { followers: currentUser._id } });
            await User.findByIdAndUpdate(currentUser._id, { $pull: { following: id } });
            const myAccount = await User.findById(currentUser._id).select("-password");
            const followedUser = await User.findById(id).select("-password");

            return res.status(200).json({ myAccount, followedUser, isFollowing: false });
        } else {
            // Following
            await User.findByIdAndUpdate(id, { $push: { followers: currentUser._id } });
            await User.findByIdAndUpdate(currentUser._id, { $push: { following: id } });
            const myAccount = await User.findById(currentUser._id).select("-password");
            const followedUser = await User.findById(id).select("-password");

            // Send notification
            const newNotification = new Notfication({
                from: currentUser._id,
                to: selectedUser._id,
                type: "follow",
            });
            await newNotification.save();

            return res.status(200).json({ myAccount, followedUser, isFollowing: true });
        }
    } catch (error) {
        console.error("Error in followUnFollowUser:", error);
        return res.status(500).json({ message: "Error in follow/unfollow user" });
    }
}
export const isGetSuggestedUser = async (req, res) => {

    try {
        const currentUser = req.user;
        const myFollowingList = await User.findById(currentUser._id).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: currentUser._id }
                }
            },
            {
                $sample: {
                    size: 10
                }
            },
            {
                $project: { // Use $project to exclude password directly in aggregation
                    password: 0,
                    // Add other fields you want to include/exclude explicitly
                }
            }
        ]);

        const filteredUsers = users.filter(user =>
            !myFollowingList.following.some(fid => fid.toString() === user._id.toString())
        );

        const suggestedUsers = filteredUsers.slice(0, 4); // Renamed for consistency

        return res.status(200).json(suggestedUsers);
    } catch (error) {
        console.error("Error in getSuggestedUsers:", error);
        return res.status(500).json({ message: "Error in getting suggested users" });
    }
};

export const updateProfile = async (req, res) => {
    let { userName, email, bio, link, profilePic, coverPic } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    try {
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
        ).select("-password"); // Exclude password from the returned object

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error in updateProfile:", error);
        return res.status(500).json({ message: "Error in updating profile" });
    }
};

export const updatePassword = async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    let { password, oldPassword } = req.body;

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    try {
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
        ).select("-password"); // Exclude password from the returned object

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error in updatePassword:", error);
        return res.status(500).json({ message: "Error in updating password" });
    }
};

export const getFollowing = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).populate("following", "-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const myFollowing = user.following;
        const myProfile = await User.findById(req.user._id).select("-password");
        return res.status(200).json({ myFollowing, myProfile });
    } catch (error) {
        console.error("Error in getFollowing:", error);
        return res.status(500).json({ message: "Error in getting following list" });
    }
};

export const getFollowers = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).populate("followers", "-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user.followers);
    } catch (error) {
        console.error("Error in getFollowers:", error);
        return res.status(500).json({ message: "Error in getting followers list" });
    }
};