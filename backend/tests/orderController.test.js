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

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
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
            customerName: 'John Doe',
            email: 'john@example.com',
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

        const mockCustomer = {
            id: 'cust-1',
            toJSON: () => ({ id: 'cust-1' })
        };

        const createdOrder = {
            id: 'new-order-id',
            ...newOrderData,
            total: 50,
            toJSON: () => ({ id: 'new-order-id', ...newOrderData, total: 50 })
        };

        db.Product.findOne.mockResolvedValue(mockProduct);
        db.Customer.findOne.mockResolvedValue(null); // Simulate new customer
        db.Customer.create.mockResolvedValue(mockCustomer);
        db.Order.create.mockResolvedValue(createdOrder);

        const res = await request(app)
            .post('/api/orders')
            .send(newOrderData);

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBe('new-order-id');
        expect(db.Order.create).toHaveBeenCalled();
    });

    it('should return 400 if product not found', async () => {
        db.Product.findOne.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/orders')
            .send({ productName: 'Unknown', email: 'test@test.com' });

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

