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
    };
    const mockSetting = {
        create: jest.fn(),
    };

    return {
        db: {
            Store: mockStore,
            User: mockUser,
            RefreshToken: {},
            Product: {},
            Customer: {},
            Order: {},
            Return: {},
            Setting: mockSetting,
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

const app = require('../server');
const { db } = require('../db/init');

describe('Store Controller', () => {
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
            const newStoreData = { name: 'New Store', domain: 'newstore.com' };
            const createdStore = { id: 'new-id', ...newStoreData };

            db.Store.create.mockResolvedValue(createdStore);
            db.Setting.create.mockResolvedValue({});

            const res = await request(app)
                .post('/api/stores')
                .send(newStoreData);

            expect(res.statusCode).toBe(201);
            expect(res.body).toEqual(createdStore);
        });
    });
});
