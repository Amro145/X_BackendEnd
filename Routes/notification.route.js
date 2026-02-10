import express from "express";
import { protectRoute } from "../MiddleWare/protectRoute.js"
import { deleteNotifications, deleteOneNotification, getNotifications } from "../Controller/notification.controller.js";
const Route = express.Router()
Route.get("/", protectRoute, getNotifications)
Route.delete("/", protectRoute, deleteNotifications)
Route.delete("/:id", protectRoute, deleteOneNotification)
export default Route; 