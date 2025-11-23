const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock dependencies before requiring server
jest.mock('../db/init', () => {
    const mockUser = {
        findOne: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
    };
    const mockRefreshToken = {
        create: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    };
    const mockStore = {
        findOne: jest.fn(),
    };

    return {
        db: {
            User: mockUser,
            RefreshToken: mockRefreshToken,
            Store: mockStore,
            // Add other models if server.js destructures them
            Product: {},
            Customer: {},
            Order: {},
            Return: {},
            Setting: {},
        },
        initializeDatabase: jest.fn(),
    };
});

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Import app after mocks
const app = require('../server');
const { db } = require('../db/init');

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/login', () => {
        it('should return 400 if email or password missing', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ email: 'test@example.com' }); // Missing password

            expect(res.statusCode).toBe(400);
            // Validation middleware should catch this
        });

        it('should return 401 if user not found', async () => {
            db.User.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/login')
                .send({ email: 'wrong@example.com', password: 'password' });

            expect(res.statusCode).toBe(401);
            expect(res.body.error.message).toBe('Invalid email or password.');
        });

        it('should return 401 if password invalid', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                role: 'admin',
            };
            db.User.findOne.mockResolvedValue(mockUser);
            bcrypt.compareSync.mockReturnValue(false); // Mock synchronous compare

            const res = await request(app)
                .post('/api/login')
                .send({ email: 'test@example.com', password: 'wrong-password' });

            expect(res.statusCode).toBe(401);
            expect(res.body.error.message).toBe('Invalid email or password.');
        });

        it('should return tokens on successful login', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                role: 'admin',
                name: 'Test User',
                active: true, // Ensure user is active
                toJSON: function () { return this; } // Mock toJSON
            };
            db.User.findOne.mockResolvedValue(mockUser);
            bcrypt.compareSync.mockReturnValue(true); // Mock synchronous compare
            jwt.sign.mockReturnValue('access-token');

            // Mock RefreshToken.create
            db.RefreshToken.create.mockResolvedValue({});

            const res = await request(app)
                .post('/api/login')
                .send({ email: 'test@example.com', password: 'password' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token', 'access-token');
            expect(res.body).toHaveProperty('user');
            expect(res.headers['set-cookie']).toBeDefined(); // Refresh token cookie
        });
    });
});
