import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    ],
    comment: [commentSchema],
}, { timestamps: true })

postSchema.post("save", async function (doc) {
    try {
        const User = mongoose.model("User");
        const Notification = mongoose.model("Notification");

        const me = await User.findById(doc.user);
        if (me && me.followers && me.followers.length > 0) {
            const notifications = me.followers.map(followerId => ({
                from: me._id,
                to: followerId,
                type: "post",
                post: doc._id,
            }));
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error("Error in post save middleware:", error);
    }
});

const Post = mongoose.model("Post", postSchema)
export default Post