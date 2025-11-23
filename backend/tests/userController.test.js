const request = require('supertest');
const express = require('express');
const { Op } = require('sequelize');

// Mock dependencies
jest.mock('sequelize', () => {
    const actualSequelize = jest.requireActual('sequelize');
    return {
        ...actualSequelize,
        Op: actualSequelize.Op,
    };
});

jest.mock('../db/init', () => {
    const mockUser = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        findAndCountAll: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    };
    const mockStore = {
        findByPk: jest.fn(),
    };
    return {
        db: {
            User: mockUser,
            Store: mockStore,
        },
    };
});

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    hashSync: jest.fn(),
    compareSync: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../utils/helpers', () => {
    const actual = jest.requireActual('../utils/helpers');
    return {
        ...actual,
        normalizeEmail: jest.fn(email => email?.toLowerCase()),
    };
});

jest.mock('../middleware/auth', () => ({
    authenticateToken: jest.fn((req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin', email: 'admin@example.com', storeId: 'store-123' };
        req.storeId = 'store-123';
        req.isSuperAdmin = false;
        next();
    }),
    authorizeRole: jest.fn((...roles) => (req, res, next) => next()),
    buildStoreWhere: jest.fn((req, where = {}) => ({ ...where, storeId: req.storeId })),
}));

jest.mock('../middleware/validateRequest', () => (schema) => (req, res, next) => next());

jest.mock('../middleware/validationSchemas', () => ({
    createUserSchema: {},
    updateUserSchema: {},
    userProfileSchema: {},
}));

const userRoutes = require('../routes/userRoutes');
const { db } = require('../db/init');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Controller', () => {
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = {
            id: 'admin-id',
            role: 'admin',
            email: 'admin@example.com',
            storeId: 'store-123',
            passwordHash: 'hashed_password',
            update: jest.fn().mockResolvedValue(true),
            reload: jest.fn().mockResolvedValue(true),
            save: jest.fn().mockResolvedValue(true),
            destroy: jest.fn().mockResolvedValue(true),
            toJSON: jest.fn().mockReturnValue({ id: 'admin-id', role: 'admin', email: 'admin@example.com', storeId: 'store-123' }),
        };

        // Override authenticateToken to use the current mockUser
        authenticateToken.mockImplementation((req, res, next) => {
            req.user = mockUser;
            req.storeId = 'store-123';
            req.isSuperAdmin = false;
            next();
        });
    });

    describe('GET /api/users/me', () => {
        it('should return current user profile', async () => {
            const res = await request(app).get('/api/users/me');
            expect(res.statusCode).toBe(200);
            expect(res.body.id).toBe('admin-id');
            expect(res.body.email).toBe('admin@example.com');
            expect(res.body.passwordHash).toBeUndefined();
        });
    });

    describe('PUT /api/users/me', () => {
        it('should update current user profile', async () => {
            db.User.findByPk.mockResolvedValue(mockUser);
            const res = await request(app)
                .put('/api/users/me')
                .send({ fullName: 'New Name' });

            expect(res.statusCode).toBe(200);
            expect(mockUser.update).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'New Name' }));
        });
    });

    describe('POST /api/users/me/change-password', () => {
        it('should change password successfully', async () => {
            db.User.findByPk.mockResolvedValue(mockUser);
            bcrypt.compareSync.mockReturnValue(true); // Old password matches
            bcrypt.hashSync.mockReturnValue('new_hashed_password'); // Mock sync hash

            const res = await request(app)
                .post('/api/users/me/change-password')
                .send({ currentPassword: 'oldPass', newPassword: 'newPassword123' });

            expect(res.statusCode).toBe(200);
            expect(mockUser.update).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'new_hashed_password' }));
        });

        it('should fail if current password is incorrect', async () => {
            db.User.findByPk.mockResolvedValue(mockUser);
            bcrypt.compareSync.mockReturnValue(false);

            const res = await request(app)
                .post('/api/users/me/change-password')
                .send({ currentPassword: 'wrongPass', newPassword: 'newPassword123' });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toMatch(/incorrect/i);
        });
    });

    describe('GET /api/users', () => {
        it('should return list of users', async () => {
            db.User.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockUser] });
            db.User.findAll.mockResolvedValue([mockUser]);

            const res = await request(app).get('/api/users');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].id).toBe('admin-id');
        });
    });

    describe('POST /api/users', () => {
        it('should create a new user', async () => {
            db.User.findOne.mockResolvedValue(null); // No existing user
            db.Store.findByPk.mockResolvedValue({ id: 'store-123' }); // Mock store
            db.User.create.mockResolvedValue(mockUser);
            bcrypt.hash.mockResolvedValue('hashed_password');

            const res = await request(app)
                .post('/api/users')
                .send({ email: 'new@example.com', password: 'password123', role: 'staff', storeId: 'store-123' });

            expect(res.statusCode).toBe(201);
            expect(db.User.create).toHaveBeenCalled();
        });

        it('should fail if email already exists', async () => {
            db.User.findOne.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/users')
                .send({ email: 'admin@example.com', password: 'password123', role: 'staff' });

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toMatch(/already exists/i);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update a user', async () => {
            db.User.findByPk.mockResolvedValue(mockUser);

            const res = await request(app)
                .put('/api/users/user-123')
                .send({ name: 'Updated Name' });

            expect(res.statusCode).toBe(200);
            expect(mockUser.save).toHaveBeenCalled();
            expect(mockUser.fullName).toBe('Updated Name');
        });

        it('should return 404 if user not found', async () => {
            db.User.findByPk.mockResolvedValue(null);

            const res = await request(app)
                .put('/api/users/user-999')
                .send({ name: 'Updated' });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete a user', async () => {
            const userToDelete = { ...mockUser, id: 'user-123', destroy: jest.fn().mockResolvedValue(true) };
            db.User.findByPk.mockResolvedValue(userToDelete);

            const res = await request(app).delete('/api/users/user-123');

            expect(res.statusCode).toBe(204);
            expect(userToDelete.destroy).toHaveBeenCalled();
        });

        it('should return 404 if user not found', async () => {
            db.User.findByPk.mockResolvedValue(null);

            const res = await request(app).delete('/api/users/user-999');

            expect(res.statusCode).toBe(404);
        });
    });
});
