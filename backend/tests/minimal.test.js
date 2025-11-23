const request = require('supertest');

jest.mock('../db/init', () => ({
    db: {},
    initializeDatabase: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => next(),
    authorizeRole: () => (req, res, next) => next(),
    buildStoreWhere: (req) => ({}),
}));

jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));

console.error('Loading server...');
const app = require('../server');
console.error('Server loaded');

describe('Minimal Test', () => {
    it('should pass', () => {
        expect(true).toBe(true);
    });
});
