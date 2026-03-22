/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *   put:
 *     summary: Update own profile (supports avatar upload)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Sahil Thakur
 *               bio:
 *                 type: string
 *                 example: Backend developer
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (optional)
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /users/search:
 *   get:
 *     summary: Search users by username or full name
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Array of matching users
 *
 * /users/suggestions:
 *   get:
 *     summary: Get suggested users to follow
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of suggested users
 *
 * /users/{username}:
 *   get:
 *     summary: Get user profile and posts
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile with posts
 *       404:
 *         description: User not found
 *
 * /users/{userId}/follow:
 *   put:
 *     summary: Toggle follow/unfollow a user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Followed/Unfollowed successfully
 *       400:
 *         description: Cannot follow yourself
 *
 * /users/{username}/followers:
 *   get:
 *     summary: Get user's followers list
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of follower users
 *
 * /users/{username}/following:
 *   get:
 *     summary: Get user's following list
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of following users
 */
