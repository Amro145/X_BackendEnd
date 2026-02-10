import mongoose from "mongoose";
import User from "./auth.model.js";
const notifictionSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    type: {
        type: String,
        required: true,
        enum: ["follow", "like", "comment", "post"],
    },
    read: {
        type: mongoose.Schema.Types.Boolean,
        default: false
    },
    text: {
        type: String,
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    }
}, { timestamps: true })
const Notification = mongoose.model("Notification", notifictionSchema)
export default Notification