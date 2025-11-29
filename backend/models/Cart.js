module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        storeId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        customerId: {
            type: DataTypes.UUID,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'abandoned', 'recovered', 'converted'),
            defaultValue: 'active'
        },
        lastActiveAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        recoveryEmailSentAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'carts',
        timestamps: true
    });

    return Cart;
};
