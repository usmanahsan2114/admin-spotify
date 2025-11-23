'use strict'

module.exports = (sequelize, DataTypes) => {
    const RefreshToken = sequelize.define(
        'RefreshToken',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            token: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            revoked: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            replacedByToken: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: 'refresh_tokens',
            timestamps: true,
            underscored: false,
        }
    )

    RefreshToken.associate = function (models) {
        RefreshToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    }

    return RefreshToken
}
