const express = require('express');

// Mock dependencies manually
const mockAuth = {
    authenticateToken: (req, res, next) => next(),
    authorizeRole: () => (req, res, next) => next(),
};
const mockValidationSchemas = {
    createUserSchema: {},
    updateUserSchema: {},
    userProfileSchema: {},
};
const mockValidateRequest = () => (req, res, next) => next();
const mockUserController = {
    getCurrentUser: (req, res) => res.json({ id: 'mock' }),
    updateCurrentUser: (req, res) => res.json({ id: 'mock' }),
    changePassword: (req, res) => res.json({ message: 'mock' }),
    getUsers: (req, res) => res.json([]),
    createUser: (req, res) => res.json({ id: 'mock' }),
    updateUser: (req, res) => res.json({ id: 'mock' }),
    deleteUser: (req, res) => res.sendStatus(204),
};

// Override require
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (path) {
    if (path.includes('middleware/auth')) return mockAuth;
    if (path.includes('middleware/validationSchemas')) return mockValidationSchemas;
    if (path.includes('middleware/validateRequest')) return mockValidateRequest;
    if (path.includes('controllers/userController')) return mockUserController;
    return originalRequire.apply(this, arguments);
};

try {
    console.log('Loading userRoutes...');
    const userRoutes = require('./routes/userRoutes');
    console.log('userRoutes loaded successfully');

    const app = express();
    app.use('/api/users', userRoutes);
    console.log('App setup successful');
} catch (error) {
    console.error('Error loading userRoutes:', error);
}
