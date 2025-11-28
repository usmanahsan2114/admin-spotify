const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Try loading .env from backend directory
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// If that didn't work (or if we are running from root), try root .env
if (!process.env.DB_HOST) {
    require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
}

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && process.env.DB_HOST) {
    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
    databaseUrl = `postgres://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

if (!databaseUrl) {
    console.error('Error: Could not construct DATABASE_URL. Check .env file.');
    process.exit(1);
}

// Initialize Sequelize
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const Store = sequelize.define('Store', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    domain: { type: DataTypes.STRING, unique: true },
    // status column removed as it doesn't exist in the model
}, {
    tableName: 'stores',
    timestamps: true
});

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false }, // Changed from password to passwordHash
    name: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    storeId: { type: DataTypes.UUID, allowNull: true }
}, {
    tableName: 'users',
    timestamps: true
});

async function verifyData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Verify Store
        const store = await Store.findOne({ where: { name: 'Pak Gusu Pvt Ltd' } });
        if (store) {
            console.log(`[OK] Store found: ${store.name} (${store.id})`);
        } else {
            console.error('[FAIL] Store "Pak Gusu Pvt Ltd" not found.');
        }

        // 2. Verify Users
        const emailsToCheck = [
            'admin@pakgusu.com',
            'apex@pakgusu.com',
            'test1@pakgusu.com'
        ];

        for (const email of emailsToCheck) {
            const user = await User.findOne({ where: { email } });
            if (user) {
                console.log(`[OK] User found: ${user.email} (Role: ${user.role}, Name: ${user.name})`);
                if (store && user.storeId === store.id) {
                    console.log(`  -> Linked to correct store.`);
                } else if (store) {
                    console.warn(`  -> WARNING: Linked to store ${user.storeId}, expected ${store.id}`);
                }
            } else {
                console.error(`[FAIL] User "${email}" not found.`);
            }
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await sequelize.close();
    }
}

verifyData();
