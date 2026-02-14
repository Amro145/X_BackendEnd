import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'X API Documentation',
            version: '1.0.0',
            description: 'API documentation for the X (formerly Twitter) clone backend',
        },
        servers: [
            {
                url: 'http://localhost:8000',
                description: 'Local development server',
            },
            {
                url: 'https://x-backend-end.vercel.app',
                description: 'Production server',
            }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'jwt'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userName: { type: 'string' },
                        email: { type: 'string' },
                        profilePic: { type: 'string' },
                        coverPic: { type: 'string' },
                        bio: { type: 'string' },
                        link: { type: 'string' },
                        followers: { type: 'array', items: { type: 'string' } },
                        following: { type: 'array', items: { type: 'string' } },
                        likedPosts: { type: 'array', items: { type: 'string' } },
                    },
                },
                Post: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        text: { type: 'string' },
                        image: { type: 'string' },
                        likes: { type: 'array', items: { type: 'string' } },
                        comment: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    user: { type: 'string' },
                                    text: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                Notification: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        from: { type: 'string' },
                        to: { type: 'string' },
                        type: { type: 'string', enum: ['follow', 'like', 'comment'] },
                        read: { type: 'boolean' },
                        post: { type: 'string' },
                    }
                }
            },
        },
    },
    apis: ['./Routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
