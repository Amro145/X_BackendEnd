import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
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
    comment: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            text: {
                type: String,
                required: true,

            },
        },
    ],
}, { timestamps: true })

postSchema.post("save", async function (doc, next) {
    try {
        const session = doc.$session();
        const User = mongoose.model("User");
        const Notification = mongoose.model("Notification");

        const me = await User.findById(doc.user).session(session);
        if (me && me.followers && me.followers.length > 0) {
            for (const followerId of me.followers) {
                const newNotification = new Notification({
                    from: me._id,
                    to: followerId,
                    type: "post",
                    post: doc._id,
                });
                await newNotification.save({ session });
            }
        }
        // next() is not needed in async post middleware if promise is returned/awaited, but good practice if signature has (doc, next)
    } catch (error) {
        console.error("Error in post save middleware:", error);
        // In post hooks, throwing error might not stop the main save if it already completed? 
        // Actually post('save') runs after save. If it fails, does it rollback the transaction?
        // If we are in a transaction, throwing here should propagate up, and the transaction should be aborted by the caller (controller).
        throw error;
    }
});

const Post = mongoose.model("Post", postSchema)
export default Post