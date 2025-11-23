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
    const mockProduct = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    };
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
        findOne: jest.fn(),
    };
    const mockOrder = {
        findAll: jest.fn(),
    };
    const mockCustomer = {
        findAll: jest.fn(),
    };
    const mockReturn = {
        findAll: jest.fn(),
    };
    const mockRefreshToken = {
        create: jest.fn(),
        findOne: jest.fn(),
        destroy: jest.fn(),
    };

    return {
        db: {
            Product: mockProduct,
            Store: mockStore,
            User: mockUser,
            Setting: mockSetting,
            Order: mockOrder,
            Customer: mockCustomer,
            Return: mockReturn,
            RefreshToken: mockRefreshToken,
        },
        initializeDatabase: jest.fn(),
    };
});

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin', email: 'admin@example.com' };
        req.storeId = 'store-id';
        next();
    },
    authorizeRole: (...roles) => (req, res, next) => next(),
    buildStoreWhere: (req, where = {}) => ({ ...where, storeId: req.storeId }),
}));

jest.mock('../middleware/validateRequest', () => (schema) => (req, res, next) => next());

jest.mock('../middleware/envValidation', () => ({
    validateEnvironmentVariables: jest.fn(),
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

jest.mock('../utils/columnDetector', () => ({
    detectProductColumns: jest.fn(),
    getMappingSummary: jest.fn(),
    extractRowData: jest.fn(),
}));

const express = require('express');
const productRoutes = require('../routes/productRoutes');
const { db } = require('../db/init');

const app = express();
app.use(express.json());
// Mock middleware globally for the test app
app.use((req, res, next) => {
    req.user = { id: 1, role: 'admin', storeId: 'store-123' };
    req.storeId = 'store-123';
    req.isSuperAdmin = false;
    next();
});
app.use('/api', productRoutes);

describe('Product Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/products', () => {
        it('should return a list of products', async () => {
            const mockProducts = [
                {
                    id: 'prod-1',
                    name: 'Product 1',
                    price: 100,
                    stockQuantity: 10,
                    reorderThreshold: 5,
                    toJSON: () => ({
                        id: 'prod-1',
                        name: 'Product 1',
                        price: 100,
                        stockQuantity: 10,
                        reorderThreshold: 5
                    })
                },
                {
                    id: 'prod-2',
                    name: 'Product 2',
                    price: 200,
                    stockQuantity: 2,
                    reorderThreshold: 5,
                    toJSON: () => ({
                        id: 'prod-2',
                        name: 'Product 2',
                        price: 200,
                        stockQuantity: 2,
                        reorderThreshold: 5
                    })
                }
            ];

            db.Product.findAll.mockResolvedValue(mockProducts);

            const res = await request(app).get('/api/products');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0].lowStock).toBe(false);
            expect(res.body[1].lowStock).toBe(true);
        });
    });

    describe('GET /api/products/:id', () => {
        it('should return product details if found', async () => {
            const mockProduct = {
                id: 'prod-1',
                storeId: 'store-id',
                stockQuantity: 10,
                reorderThreshold: 5,
                toJSON: () => ({
                    id: 'prod-1',
                    storeId: 'store-id',
                    stockQuantity: 10,
                    reorderThreshold: 5
                })
            };
            db.Product.findByPk.mockResolvedValue(mockProduct);

            const res = await request(app).get('/api/products/prod-1');

            expect(res.statusCode).toBe(200);
            expect(res.body.id).toBe('prod-1');
            expect(res.body.lowStock).toBe(false);
        });

        it('should return 404 if product not found', async () => {
            db.Product.findByPk.mockResolvedValue(null);

            const res = await request(app).get('/api/products/non-existent');

            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /api/products', () => {
        it('should create a new product', async () => {
            const newProductData = {
                name: 'New Product',
                price: 50,
                stockQuantity: 20,
                reorderThreshold: 5,
                category: 'Electronics'
            };

            const createdProduct = {
                id: 'new-prod-id',
                ...newProductData,
                storeId: 'store-id',
                toJSON: () => ({
                    id: 'new-prod-id',
                    ...newProductData,
                    storeId: 'store-id'
                })
            };

            db.Product.create.mockResolvedValue(createdProduct);

            const res = await request(app)
                .post('/api/products')
                .send(newProductData);

            expect(res.statusCode).toBe(201);
            expect(res.body.id).toBe('new-prod-id');
            expect(db.Product.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Product',
                storeId: 'store-id'
            }));
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update a product', async () => {
            const mockProduct = {
                id: 'prod-1',
                storeId: 'store-id',
                stockQuantity: 10,
                reorderThreshold: 5,
                update: jest.fn(),
                reload: jest.fn(),
                toJSON: () => ({
                    id: 'prod-1',
                    storeId: 'store-id',
                    stockQuantity: 15, // Updated value
                    reorderThreshold: 5
                })
            };

            db.Product.findByPk.mockResolvedValue(mockProduct);

            const res = await request(app)
                .put('/api/products/prod-1')
                .send({ stockQuantity: 15 });

            expect(res.statusCode).toBe(200);
            expect(res.body.stockQuantity).toBe(15);
            expect(mockProduct.update).toHaveBeenCalledWith(expect.objectContaining({ stockQuantity: 15 }));
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete a product', async () => {
            const mockProduct = {
                id: 'prod-1',
                storeId: 'store-id',
                destroy: jest.fn(),
                toJSON: () => ({ id: 'prod-1', storeId: 'store-id' })
            };

            db.Product.findByPk.mockResolvedValue(mockProduct);

            const res = await request(app).delete('/api/products/prod-1');

            expect(res.statusCode).toBe(204);
            expect(mockProduct.destroy).toHaveBeenCalled();
        });
    });
});
