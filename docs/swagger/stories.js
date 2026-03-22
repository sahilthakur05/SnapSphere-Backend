/**
 * @swagger
 * /stories:
 *   get:
 *     summary: Get active stories from followed users
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of story groups (grouped by user)
 *   post:
 *     summary: Add a new story (expires in 24h)
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Story image
 *               caption:
 *                 type: string
 *                 example: My day!
 *     responses:
 *       201:
 *         description: Story created
 *       400:
 *         description: No image uploaded
 */
