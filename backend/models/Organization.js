'use strict'

module.exports = (sequelize, DataTypes) => {
    const Organization = sequelize.define(
        'Organization',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('active', 'inactive', 'pending'),
                defaultValue: 'active',
            },
        },
        {
            tableName: 'organizations',
            timestamps: true,
            underscored: false,
        }
    )

    Organization.associate = function (models) {
        Organization.hasMany(models.Store, {
            foreignKey: 'organizationId',
            as: 'stores',
        })
    }

    return Organization
}
