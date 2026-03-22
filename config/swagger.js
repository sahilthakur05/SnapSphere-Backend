const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SnapSphere API",
      version: "1.0.0",
      description: "SnapSphere social media backend API documentation",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            fullName: { type: "string" },
            avatar: { type: "string" },
          },
        },
        ProfileUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            fullName: { type: "string" },
            avatar: { type: "string" },
            bio: { type: "string" },
            followers: { type: "array", items: { type: "string" } },
            following: { type: "array", items: { type: "string" } },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            image: { type: "string" },
            caption: { type: "string" },
            likes: { type: "array", items: { type: "string" } },
            comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            text: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["like", "comment", "follow"] },
            sender: { $ref: "#/components/schemas/User" },
            postId: { type: "string" },
            read: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        StoryGroup: {
          type: "object",
          properties: {
            userId: { type: "string" },
            username: { type: "string" },
            avatar: { type: "string" },
            stories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  image: { type: "string" },
                  caption: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User profile endpoints" },
      { name: "Posts", description: "Post CRUD and interactions" },
      { name: "Notifications", description: "Notification endpoints" },
      { name: "Stories", description: "Story endpoints" },
    ],
  },
  apis: ["./docs/swagger/*.js"],
};

module.exports = swaggerJsdoc(options);
