import express from "express"
import { protectRoute } from "../MiddleWare/protectRoute.js"
import { commentOnPost, createPost, deletePost, getAllPosts, getFollowingPosts, getLikedPosts, getOnePost, getUserPosts, likeUnlike } from "../Controller/post.controller.js"
const router = express.Router()

/**
 * @swagger
 * /api/post/createpost:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 */
router.post("/createpost", protectRoute, createPost)

/**
 * @swagger
 * /api/post/all:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all posts
 */
router.get("/all", protectRoute, getAllPosts)

/**
 * @swagger
 * /api/post/post/{id}:
 *   get:
 *     summary: Get a specific post by ID
 *     tags: [Posts]
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
 *         description: Post data
 */
router.get("/post/:id", protectRoute, getOnePost)

/**
 * @swagger
 * /api/post/following:
 *   get:
 *     summary: Get posts from followed users
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of posts
 */
router.get("/following", protectRoute, getFollowingPosts)

/**
 * @swagger
 * /api/post/user/{userid}:
 *   get:
 *     summary: Get all posts by a specific user
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user posts
 */
router.get("/user/:userid", protectRoute, getUserPosts)

/**
 * @swagger
 * /api/post/liked:
 *   get:
 *     summary: Get liked posts
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of liked posts
 */
router.get("/liked", protectRoute, getLikedPosts)

/**
 * @swagger
 * /api/post/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
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
 *         description: Post deleted successfully
 */
router.delete("/:id", protectRoute, deletePost)

/**
 * @swagger
 * /api/post/comment/{id}:
 *   post:
 *     summary: Comment on a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added successfully
 */
router.post("/comment/:id", protectRoute, commentOnPost)

/**
 * @swagger
 * /api/post/like/{id}:
 *   put:
 *     summary: Like or unlike a post
 *     tags: [Posts]
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
 *         description: Post liked/unliked successfully
 */
router.put("/like/:id", protectRoute, likeUnlike)
export default router

