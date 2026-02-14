import express from "express";
import { protectRoute } from "../MiddleWare/protectRoute.js"
import { deleteNotifications, deleteOneNotification, getNotifications } from "../Controller/notification.controller.js";
const Route = express.Router()
/**
 * @swagger
 * /api/notification:
 *   get:
 *     summary: Get all notifications for the current user
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
Route.get("/", protectRoute, getNotifications)

/**
 * @swagger
 * /api/notification:
 *   delete:
 *     summary: Delete all notifications for the current user
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
 */
Route.delete("/", protectRoute, deleteNotifications)

/**
 * @swagger
 * /api/notification/{id}:
 *   delete:
 *     summary: Delete a specific notification by ID
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
Route.delete("/:id", protectRoute, deleteOneNotification)
export default Route; 