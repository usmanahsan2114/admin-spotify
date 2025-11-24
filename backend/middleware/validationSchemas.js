const { z } = require('zod')

// Auth Schemas
const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
})

const signupSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        name: z.string().min(1, 'Name is required'),
        role: z.enum(['admin', 'staff']).optional(),
        storeId: z.string().uuid('Invalid store ID').optional(),
    }),
})

const refreshTokenSchema = z.object({
    cookies: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
})

// Store Schemas
const createStoreSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Store name is required'),
        domain: z.string().min(1, 'Store domain is required'),
        organizationId: z.string().uuid('Invalid organization ID').optional(),
    }),
})

const updateStoreSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid store ID'),
    }),
    body: z.object({
        name: z.string().optional(),
        domain: z.string().optional(),
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
    }),
})

const updateStoreAdminCredentialsSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid store ID'),
    }),
    body: z.object({
        email: z.string().email('Invalid email address'),
    }),
})

// User Schemas
const createUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        name: z.string().min(1, 'Name is required'),
        role: z.enum(['admin', 'staff', 'superadmin']),
        storeId: z.string().uuid('Invalid store ID').optional(),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
})

const updateUserSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID'),
    }),
    body: z.object({
        email: z.string().email('Invalid email address').optional(),
        name: z.string().min(1).optional(),
        role: z.enum(['admin', 'staff', 'superadmin']).optional(),
        active: z.boolean().optional(),
    }),
})

const userProfileSchema = z.object({
    body: z.object({
        fullName: z.string().min(1, 'Full name is required').optional(),
        phone: z.string().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6).optional(),
    }).refine((data) => {
        if (data.newPassword && !data.currentPassword) return false
        return true
    }, {
        message: "Current password is required to set a new password",
        path: ["currentPassword"]
    }),
})

// Product Schemas
const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Product name is required'),
        description: z.string().optional(),
        price: z.number().min(0, 'Price must be non-negative'),
        stockQuantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
        sku: z.string().optional(),
        category: z.string().optional(),
        reorderThreshold: z.number().int().min(0).optional(),
    }),
})

const updateProductSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid product ID'),
    }),
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        stockQuantity: z.number().int().min(0).optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        reorderThreshold: z.number().int().min(0).optional(),
    }),
})

// Order Schemas
const createOrderSchema = z.object({
    body: z.object({
        productName: z.string().min(1, 'Product name is required'),
        customerName: z.string().min(1, 'Customer name is required'),
        email: z.string().email('Invalid customer email'),
        quantity: z.number().int().positive('Quantity must be positive'),
        totalAmount: z.number().min(0).optional(),
        status: z.enum(['Pending', 'Accepted', 'Shipped', 'Refunded', 'Completed', 'Cancelled', 'Paid']).optional(),
        paymentMethod: z.string().optional(),
        shippingAddress: z.string().optional(),
    }),
})

const updateOrderSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid order ID'),
    }),
    body: z.object({
        status: z.enum(['Pending', 'Accepted', 'Shipped', 'Refunded', 'Completed', 'Cancelled', 'Paid']).optional(),
        isPaid: z.boolean().optional(),
        quantity: z.number().int().min(0).optional(),
        trackingNumber: z.string().optional(),
    }),
})

// Customer Schemas
const createCustomerSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Customer name is required'),
        email: z.string().email('Invalid email address'),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
    }),
})

const updateCustomerSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid customer ID'),
    }),
    body: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        notes: z.string().optional(),
    }),
})

// Return Schemas
const createReturnSchema = z.object({
    body: z.object({
        orderId: z.string().uuid('Invalid order ID'),
        reason: z.string().min(1, 'Return reason is required'),
        returnedQuantity: z.number().int().positive('Returned quantity must be positive'),
        condition: z.string().optional(),
    }),
})

const updateReturnSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid return ID'),
    }),
    body: z.object({
        status: z.enum(['Submitted', 'Approved', 'Rejected', 'Refunded']).optional(),
        refundAmount: z.number().min(0).optional(),
        adminNotes: z.string().optional(),
    }),
})

// Settings Schemas
const updateSettingsSchema = z.object({
    body: z.object({
        dashboardName: z.string().optional(),
        defaultCurrency: z.string().optional(),
        timezone: z.string().optional(),
        country: z.string().optional(),
        logoUrl: z.string().url().optional().or(z.literal('')),
    }),
})

module.exports = {
    loginSchema,
    signupSchema,
    refreshTokenSchema,
    createStoreSchema,
    updateStoreSchema,
    updateStoreAdminCredentialsSchema,
    createUserSchema,
    updateUserSchema,
    userProfileSchema,
    createProductSchema,
    updateProductSchema,
    createOrderSchema,
    updateOrderSchema,
    createCustomerSchema,
    updateCustomerSchema,
    createReturnSchema,
    updateReturnSchema,
    updateSettingsSchema,
}
