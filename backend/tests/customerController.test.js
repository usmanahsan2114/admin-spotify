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
    const mockCustomer = {
        findAll: jest.fn(),
        findAndCountAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    };
    const mockOrder = {
        findAll: jest.fn(),
        update: jest.fn(),
    };
    const mockReturn = {
        findAll: jest.fn(),
    };

    const mockSequelize = {
        transaction: jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn(),
        }),
    };

    return {
        db: {
            Customer: mockCustomer,
            Order: mockOrder,
            Return: mockReturn,
            sequelize: mockSequelize,
        },
        initializeDatabase: jest.fn(),
    };
});

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin', email: 'admin@example.com' };
        req.storeId = 'store-123';
        next();
    },
    authorizeRole: (...roles) => (req, res, next) => next(),
    authenticateCustomer: (req, res, next) => next(),
    buildStoreWhere: (req, where = {}) => ({ ...where, storeId: req.storeId }),
}));

jest.mock('../middleware/validateRequest', () => (schema) => (req, res, next) => next());

// Mock helpers
jest.mock('../utils/helpers', () => ({
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
    error: jest.fn(),
    warn: jest.fn(),
}));

// Mock validation schemas
jest.mock('../middleware/validationSchemas', () => ({
    createCustomerSchema: {},
    updateCustomerSchema: {},
}));

// Mock demo middleware
jest.mock('../middleware/demo', () => ({
    restrictDemoStore: (req, res, next) => next(),
}));

const express = require('express');
const customerRoutes = require('../routes/customerRoutes');
const { db } = require('../db/init');

const app = express();
app.use(express.json());
// Mock middleware globally for the test app
app.use((req, res, next) => {
    req.user = { id: 'admin-id', role: 'admin', storeId: 'store-123' }; // Ensure user has storeId
    req.storeId = 'store-123';
    req.isSuperAdmin = false;
    next();
});
app.use('/api/customers', customerRoutes);

describe('Customer Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/customers', () => {
        it('should return a list of customers', async () => {
            const mockCustomers = [
                {
                    id: 'cust-1',
                    name: 'Customer 1',
                    email: 'cust1@example.com',
                    phone: '1234567890',
                    address: '123 Test St',
                    alternativeEmails: [],
                    alternativePhones: [],
                    alternativeNames: [],
                    alternativeAddresses: [],
                    createdAt: new Date().toISOString(),
                    storeId: 'store-123',
                    toJSON: () => ({
                        id: 'cust-1',
                        name: 'Customer 1',
                        email: 'cust1@example.com',
                        phone: '1234567890',
                        address: '123 Test St',
                        alternativeEmails: [],
                        alternativePhones: [],
                        alternativeNames: [],
                        alternativeAddresses: [],
                        createdAt: new Date().toISOString(),
                        storeId: 'store-123'
                    })
                },
                {
                    id: 'cust-2',
                    name: 'Customer 2',
                    email: 'cust2@example.com',
                    phone: '0987654321',
                    address: '456 Test Ave',
                    alternativeEmails: [],
                    alternativePhones: [],
                    alternativeNames: [],
                    alternativeAddresses: [],
                    createdAt: new Date().toISOString(),
                    storeId: 'store-123',
                    toJSON: () => ({
                        id: 'cust-2',
                        name: 'Customer 2',
                        email: 'cust2@example.com',
                        phone: '0987654321',
                        address: '456 Test Ave',
                        alternativeEmails: [],
                        alternativePhones: [],
                        alternativeNames: [],
                        alternativeAddresses: [],
                        createdAt: new Date().toISOString(),
                        storeId: 'store-123'
                    })
                }
            ];

            db.Customer.findAndCountAll.mockResolvedValue({ count: 2, rows: mockCustomers });
            db.Order.findAll.mockResolvedValue([]); // Mock orders for stats calculation

            const res = await request(app).get('/api/customers');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(2);
        });
    });

    describe('GET /api/customers/:id', () => {
        it('should return customer details if found', async () => {
            const mockCustomer = {
                id: 'cust-1',
                storeId: 'store-123',
                name: 'Customer 1',
                email: 'test@example.com',
                phone: '1234567890',
                address: '123 Test St',
                alternativeEmails: [],
                alternativePhones: [],
                alternativeNames: [],
                alternativeAddresses: [],
                createdAt: new Date().toISOString(),
                toJSON: () => ({
                    id: 'cust-1',
                    storeId: 'store-123',
                    name: 'Customer 1',
                    email: 'test@example.com',
                    phone: '1234567890',
                    address: '123 Test St',
                    alternativeEmails: [],
                    alternativePhones: [],
                    alternativeNames: [],
                    alternativeAddresses: [],
                    createdAt: new Date().toISOString()
                })
            };
            db.Customer.findByPk.mockResolvedValue(mockCustomer);
            db.Customer.findAll.mockResolvedValue([]); // For related customers check
            db.Order.findAll.mockResolvedValue([]);
            db.Return.findAll.mockResolvedValue([]);

            const res = await request(app).get('/api/customers/cust-1');

            if (res.statusCode !== 200) {
                console.error('GET /:id failed:', res.statusCode, JSON.stringify(res.body, null, 2));
            }

            expect(res.statusCode).toBe(200);
            expect(res.body.id).toBe('cust-1');
        });

        it('should return 404 if customer not found', async () => {
            db.Customer.findByPk.mockResolvedValue(null);

            const res = await request(app).get('/api/customers/non-existent');

            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /api/customers', () => {
        it('should create a new customer', async () => {
            const newCustomerData = {
                name: 'New Customer',
                email: 'new@example.com',
                phone: '1234567890'
            };

            const createdCustomer = {
                id: 'new-cust-id',
                ...newCustomerData,
                storeId: 'store-123',
                alternativeEmails: [],
                alternativePhones: [],
                alternativeNames: [],
                alternativeAddresses: [],
                createdAt: new Date().toISOString(),
                toJSON: () => ({
                    id: 'new-cust-id',
                    ...newCustomerData,
                    storeId: 'store-123',
                    alternativeEmails: [],
                    alternativePhones: [],
                    alternativeNames: [],
                    alternativeAddresses: [],
                    createdAt: new Date().toISOString()
                })
            };

            db.Customer.findOne.mockResolvedValue(null); // No existing customer
            db.Customer.create.mockResolvedValue(createdCustomer);
            db.Order.findAll.mockResolvedValue([]); // For serialization

            const res = await request(app)
                .post('/api/customers')
                .send(newCustomerData);

            expect(res.statusCode).toBe(201);
            expect(res.body.id).toBe('new-cust-id');
            expect(db.Customer.create).toHaveBeenCalled();
        });
    });

    /*
    describe('PUT /api/customers/:id', () => {
        it('should update a customer', async () => {
            const mockCustomer = {
                id: 'cust-1',
                storeId: 'store-123',
                name: 'Old Name',
                email: 'test@example.com',
                phone: '1234567890',
                address: '123 Test St',
                alternativeEmails: [],
                alternativePhones: [],
                alternativeNames: [],
                alternativeAddresses: [],
                createdAt: new Date().toISOString(),
                update: jest.fn().mockResolvedValue(true),
                reload: jest.fn().mockResolvedValue(true),
                toJSON: () => ({
                    id: 'cust-1',
                    storeId: 'store-123',
                    name: 'Old Name',
                    email: 'test@example.com',
                    phone: '1234567890',
                    address: '123 Test St',
                    alternativeEmails: [],
                    alternativePhones: [],
                    alternativeNames: [],
                    alternativeAddresses: [],
                    createdAt: new Date().toISOString()
                })
            };

            db.Customer.findByPk.mockResolvedValue(mockCustomer);
            db.Order.findAll.mockResolvedValue([]); // For serialization

            const res = await request(app)
                .put('/api/customers/cust-1')
                .send({ name: 'Updated Name' });

            if (res.statusCode !== 200) {
                console.error('PUT /:id failed:', res.statusCode, res.body.message, res.body.error);
            }

            expect(res.statusCode).toBe(200);
            expect(mockCustomer.update).toHaveBeenCalled();
        });
    });
    */
});
