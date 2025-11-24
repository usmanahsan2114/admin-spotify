const request = require('supertest');

// Mock dependencies
jest.mock('../db/init', () => {
    const mockStore = {
        findAll: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    };
    const mockUser = {
        create: jest.fn(),
        destroy: jest.fn(),
        findOne: jest.fn(),
        count: jest.fn(),
    };

    return {
        db: {
            Store: mockStore,
            User: mockUser,
            RefreshToken: { destroy: jest.fn().mockResolvedValue(1) },
            Product: { destroy: jest.fn().mockResolvedValue(1), count: jest.fn() },
            Customer: { destroy: jest.fn().mockResolvedValue(1), count: jest.fn() },
            Order: { destroy: jest.fn().mockResolvedValue(1), count: jest.fn(), findAll: jest.fn() },
            Return: { destroy: jest.fn().mockResolvedValue(1) },
            Setting: {
                create: jest.fn(),
                destroy: jest.fn().mockResolvedValue(1)
            },
            sequelize: {
                transaction: jest.fn((callback) => callback()),
            },
        },
        initializeDatabase: jest.fn(),
    };
});

// Mock auth middleware to bypass checks
jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'superadmin-id', role: 'superadmin', email: 'admin@example.com' };
        next();
    },
    authorizeRole: (...roles) => (req, res, next) => next(),
    authenticateCustomer: (req, res, next) => next(),
}));

// Mock helpers
jest.mock('../utils/helpers', () => ({
    generateStoreCredentials: jest.fn().mockResolvedValue({ email: 'store@admin.com', password: 'password' }),
    sanitizeUser: jest.fn(u => u),
}));

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn((msg, err) => console.error(msg, err)),
    warn: jest.fn(),
}));

const app = require('../server');
const { db } = require('../db/init');

describe('Store Controller', () => {
    const storeId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/stores', () => {
        it('should return all stores', async () => {
            const mockStores = [{ id: 1, name: 'Store 1' }, { id: 2, name: 'Store 2' }];
            db.Store.findAll.mockResolvedValue(mockStores);

            const res = await request(app).get('/api/stores');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockStores);
        });
    });

    describe('POST /api/stores', () => {
        it('should create a new store', async () => {
            const newStoreData = { name: 'New Store', dashboardName: 'new-dashboard', domain: 'new-store.com', category: 'Retail' };
            const createdStore = { id: 'new-id', ...newStoreData };

            db.Store.create.mockResolvedValue(createdStore);
            db.Setting.create.mockResolvedValue({});

            const res = await request(app)
                .post('/api/stores')
                .send(newStoreData);

            expect(res.statusCode).toBe(201);
            expect(res.body).toEqual(expect.objectContaining({ name: 'New Store' }));
        });
    });

    describe('PUT /api/stores/:id', () => {
        it('should update a store', async () => {
            const store = {
                id: storeId,
                name: 'Old Name',
                domain: 'old.com',
                update: jest.fn().mockResolvedValue(true),
                reload: jest.fn().mockResolvedValue(true),
                toJSON: jest.fn().mockReturnValue({ id: storeId, name: 'Updated Name', domain: 'old.com' })
            };
            db.Store.findByPk.mockResolvedValue(store);

            const res = await request(app)
                .put(`/api/stores/${storeId}`)
                .send({ name: 'Updated Name' });

            if (res.statusCode !== 200) console.log('PUT Error:', res.body);

            expect(res.statusCode).toBe(200);
            expect(store.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
        });

        it('should return 404 if store not found', async () => {
            db.Store.findByPk.mockResolvedValue(null);

            const res = await request(app)
                .put(`/api/stores/${storeId}`)
                .send({ name: 'Updated' });

            expect(res.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/stores/:id', () => {
        it('should delete a store', async () => {
            const store = {
                id: storeId,
                name: 'Store To Delete',
                isDemo: false,
                destroy: jest.fn().mockResolvedValue(true)
            };
            db.Store.findByPk.mockResolvedValue(store);

            // Explicitly mock transaction to execute callback
            db.sequelize.transaction.mockImplementation(async (callback) => {
                await callback();
            });

            // Ensure destroy returns a promise to avoid catch error
            db.Setting.destroy.mockResolvedValue(1);
            db.User.destroy.mockResolvedValue(1);
            db.Order.destroy.mockResolvedValue(1);
            db.Product.destroy.mockResolvedValue(1);
            db.Customer.destroy.mockResolvedValue(1);
            db.Return.destroy.mockResolvedValue(1);

            const res = await request(app).delete(`/api/stores/${storeId}`);

            expect(res.statusCode).toBe(200);
            expect(store.destroy).toHaveBeenCalled();
        });

        it('should return 400 if trying to delete demo store', async () => {
            const store = { id: storeId, isDemo: true };
            db.Store.findByPk.mockResolvedValue(store);

            const res = await request(app).delete(`/api/stores/${storeId}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/Demo store cannot be deleted/i);
        });
    });

    describe('POST /api/stores/:id/admin-credentials', () => {
        it('should generate admin credentials for a store', async () => {
            const store = { id: storeId, name: 'Test Store' };
            db.Store.findByPk.mockResolvedValue(store);
            db.User.findOne.mockResolvedValue(null);
            db.User.create.mockResolvedValue({
                id: 'admin-id',
                email: 'test@store.com',
                name: 'Admin - Test Store',
                role: 'admin',
                active: true,
                storeId: storeId,
                toJSON: () => ({
                    id: 'admin-id',
                    email: 'test@store.com',
                    name: 'Admin - Test Store',
                    role: 'admin',
                    active: true,
                    storeId: storeId
                })
            });

            const res = await request(app)
                .post(`/api/stores/${storeId}/admin-credentials`)
                .send({ email: 'test@store.com', password: 'password123' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('email', 'test@store.com');
        });

        it('should return 404 if store not found', async () => {
            db.Store.findByPk.mockResolvedValue(null);

            const res = await request(app)
                .post(`/api/stores/${storeId}/admin-credentials`);

            expect(res.statusCode).toBe(404);
        });
    });
});
