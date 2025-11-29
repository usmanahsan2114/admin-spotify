module.exports = (sequelize, DataTypes) => {
    const CartItem = sequelize.define('CartItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        cartId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'cart_items',
        timestamps: true
    });

    return CartItem;
};
