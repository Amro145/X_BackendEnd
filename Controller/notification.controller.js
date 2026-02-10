import Notification from "../Models/notification.model.js"

export const getNotifications = async (req, res) => {

    try {
        const me = req.user
        if (!me) return res.status(404).json({ message: "User not found" });
        const notifications = await Notification.find({ to: { $in: me._id } }).populate({
            path: "from",
            select: "userName , profilePic"
        })
        // await Notification.updateMany({ to: me._id }, { read: true })

        return res.status(200).json(notifications)
    } catch (error) {
        console.log("Error in get notifications:", error);

        return res.status(500).json({ message: "Error in get notifications" })
    }
}
export const deleteNotifications = async (req, res) => {

    const me = req.user
    try {
        await Notification.deleteMany({ to: me._id })
        return res.status(200).json([])

    } catch (error) {
        console.log("Error in delete notifications:", error);
        return res.status(500).json({ message: "Error in delete notifications" })
    }
}
export const deleteOneNotification = async (req, res) => {

    try {
        const notificationId = req.params.id;
        const me = req.user;
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.to.toString() !== me._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Notification.findByIdAndDelete(notificationId);

        // Fetch updated notifications after deletion
        const updatedNotifications = await Notification.find({ to: { $in: me._id } }).populate({
            path: "from",
            select: "userName , profilePic",
        });

        return res.status(200).json(updatedNotifications);
    } catch (error) {
        console.log("Error in deleting one notification:", error);
        return res.status(500).json({ message: "Error in deleting one notification" });
    }
};