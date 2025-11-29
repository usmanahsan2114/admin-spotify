module.exports = (sequelize, DataTypes) => {
    const Discount = sequelize.define('Discount', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        storeId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        type: {
            type: DataTypes.ENUM('percentage', 'fixed_amount', 'bogo'),
            allowNull: false
        },
        value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Percentage value or Fixed Amount. For BOGO, this could be 100 (100% off second item)'
        },
        minOrderValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        startsAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        endsAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        usageLimit: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        usageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'discounts',
        timestamps: true
    });

    return Discount;
};
