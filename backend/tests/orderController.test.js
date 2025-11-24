jest.mock('sequelize', () => {
    const actualSequelize = jest.requireActual('sequelize');
    return {
        ...actualSequelize,
        Op: actualSequelize.Op,
    };
});

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
        findByPk: jest.fn(),
        findOne: jest.fn(),
    };
    const mockSetting = {
        create: jest.fn(),
    };
    const mockOrder = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        reload: jest.fn(),
        toJSON: jest.fn(),
    };
    const mockProduct = {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        update: jest.fn().mockResolvedValue([1]),
    };
    const mockCustomer = {
        findOne: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
    };
    const mockReturn = {
        findAll: jest.fn(),
    };

    return {
        db: {
            Store: mockStore,
            User: mockUser,
            RefreshToken: {},
            Product: mockProduct,
            Customer: mockCustomer,
            Order: mockOrder,
            Return: mockReturn,
            Setting: mockSetting,
            sequelize: {
                transaction: jest.fn().mockResolvedValue({
                    commit: jest.fn(),
                    rollback: jest.fn(),
                }),
                literal: jest.fn(val => val),
            },
        },
        initializeDatabase: jest.fn(),
    };
});

// Mock auth middleware to bypass checks
jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'superadmin-id', role: 'superadmin', email: 'admin@example.com' };
        req.storeId = 'store-id';
        next();
    },
    authorizeRole: (...roles) => (req, res, next) => next(),
    authenticateCustomer: (req, res, next) => next(),
    buildStoreWhere: (req, where = {}) => ({ ...where, storeId: req.storeId }),
}));

jest.mock('../middleware/validateRequest', () => (schema) => (req, res, next) => next());

// Mock helpers
jest.mock('../utils/helpers', () => ({
    generateStoreCredentials: jest.fn().mockResolvedValue({ email: 'store@admin.com', password: 'password' }),
    sanitizeUser: jest.fn(u => u),
    normalizeEmail: jest.fn(email => email?.toLowerCase()),
    normalizePhone: jest.fn(phone => phone),
    normalizeAddress: jest.fn(addr => addr),
}));

jest.mock('winston', () => ({
    createLogger: jest.fn().mockReturnValue({
        add: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    }),
    format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        errors: jest.fn(),
        json: jest.fn(),
        colorize: jest.fn(),
        simple: jest.fn(),
    },
    transports: {
        File: jest.fn(),
        Console: jest.fn(),
    },
}));

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn((msg, err) => console.log('LOGGER ERROR:', msg, err)),
    warn: jest.fn(),
}));

const express = require('express');
const orderRoutes = require('../routes/orderRoutes');
const { db } = require('../db/init');

const app = express();
app.use(express.json());
// Mock middleware globally for the test app
app.use((req, res, next) => {
    req.user = { id: 'superadmin-id', role: 'superadmin', email: 'admin@example.com' };
    req.storeId = 'store-id';
    req.isSuperAdmin = true;
    next();
});
app.use('/api', orderRoutes);

describe('Order Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/orders', () => {
        it('should return a list of orders', async () => {
            const mockOrders = [
                {
                    id: 'order-1',
                    total: 100,
                    toJSON: () => ({ id: 'order-1', total: 100 })
                },
                {
                    id: 'order-2',
                    total: 200,
                    toJSON: () => ({ id: 'order-2', total: 200 })
                }
            ];

            db.Order.findAll.mockResolvedValue(mockOrders);

            const res = await request(app).get('/api/orders');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should return order details if found', async () => {
            const mockOrder = {
                id: 'order-1',
                storeId: 'store-id',
                toJSON: () => ({ id: 'order-1', storeId: 'store-id' })
            };
            db.Order.findByPk.mockResolvedValue(mockOrder);
            db.Return.findAll.mockResolvedValue([]);

            const res = await request(app).get('/api/orders/order-1');

            expect(res.statusCode).toBe(200);
            expect(res.body.id).toBe('order-1');
        });

        it('should return 404 if order not found', async () => {
            db.Order.findByPk.mockResolvedValue(null);

            const res = await request(app).get('/api/orders/non-existent');

            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /api/orders', () => {
        it('should create a new order', async () => {
            const newOrderData = {
                productName: 'Test Product',
                customerName: 'Test Customer',
                email: 'test@example.com',
                quantity: 1,
                storeId: 'store-id'
            };

            const mockProduct = {
                id: 'prod-1',
                name: 'Test Product',
                price: 50,
                stockQuantity: 10,
                storeId: 'store-id'
            };

            db.Product.findOne.mockResolvedValue(mockProduct);
            db.Product.update.mockResolvedValue([1]);
            db.sequelize.transaction.mockResolvedValue({
                commit: jest.fn(),
                rollback: jest.fn(),
            });
            db.Customer.findOne.mockResolvedValue(null);
            db.Customer.create.mockResolvedValue({ id: 'cust-1', ...newOrderData });
            db.Order.create.mockResolvedValue({
                id: 'new-order-id',
                ...newOrderData,
                toJSON: function () { return this; }
            });

            const res = await request(app)
                .post('/api/orders')
                .send(newOrderData);

            if (res.statusCode === 500) {
                console.log('DEBUG ERROR BODY (Create):', res.body);
            }

            expect(res.statusCode).toBe(201);
            expect(res.body.id).toBe('new-order-id');
            expect(db.Order.create).toHaveBeenCalled();
        });

        it('should return 400 if product not found', async () => {
            const newOrderData = {
                productName: 'Unknown',
                customerName: 'Test Customer',
                email: 'test@example.com',
                quantity: 1
            };

            db.Product.findOne.mockResolvedValue(null);
            db.sequelize.transaction.mockResolvedValue({
                commit: jest.fn(),
                rollback: jest.fn(),
            });

            const res = await request(app)
                .post('/api/orders')
                .send(newOrderData);

            if (res.statusCode === 500) {
                console.log('DEBUG ERROR BODY (Product Not Found):', res.body);
            }

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Product "Unknown" not found');
        });
    });

    describe('PUT /api/orders/:id', () => {
        it('should update an order', async () => {
            const mockOrder = {
                id: 'order-1',
                storeId: 'store-id',
                update: jest.fn(),
                reload: jest.fn(),
                toJSON: () => ({ id: 'order-1', status: 'Shipped', storeId: 'store-id' })
            };

            db.Order.findByPk.mockResolvedValue(mockOrder);

            const res = await request(app)
                .put('/api/orders/order-1')
                .send({ status: 'Shipped' });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('Shipped');
            expect(mockOrder.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'Shipped' }));
        });
    });
});
