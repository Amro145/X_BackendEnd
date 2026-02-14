import express from "express"
import { protectRoute } from "../MiddleWare/protectRoute.js"
import { followUnFollowUser, isGetSuggestedUser, getUsersProfile, updateProfile, updatePassword, getFollowing, getFollowers } from "../Controller/users.controller.js"
const router = express.Router()

/**
 * @swagger
 * /api/users/profile/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
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
 *         description: User profile data
 */
router.get("/profile/:id", protectRoute, getUsersProfile)

/**
 * @swagger
 * /api/users/follow/{id}:
 *   post:
 *     summary: Follow or unfollow a user
 *     tags: [Users]
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
 *         description: Successfully followed/unfollowed
 */
router.post("/follow/:id", protectRoute, followUnFollowUser)

/**
 * @swagger
 * /api/users/suggested:
 *   get:
 *     summary: Get suggested users to follow
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of suggested users
 */
router.get("/suggested", protectRoute, isGetSuggestedUser)

/**
 * @swagger
 * /api/users/updateProfile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName: { type: 'string' }
 *               bio: { type: 'string' }
 *               link: { type: 'string' }
 *               profilePic: { type: 'string' }
 *               coverPic: { type: 'string' }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put("/updateProfile", protectRoute, updateProfile)

/**
 * @swagger
 * /api/users/updatePassword:
 *   put:
 *     summary: Update user password
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword: { type: 'string' }
 *               newPassword: { type: 'string' }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.put("/updatePassword", protectRoute, updatePassword)

/**
 * @swagger
 * /api/users/following/{id}:
 *   get:
 *     summary: Get users followed by a user
 *     tags: [Users]
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
 *         description: List of following users
 */
router.get("/following/:id", protectRoute, getFollowing)

/**
 * @swagger
 * /api/users/followers/{id}:
 *   get:
 *     summary: Get followers of a user
 *     tags: [Users]
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
 *         description: List of followers
 */
router.get("/followers/:id", protectRoute, getFollowers)
export default router