const { DataTypes} = require("sequelize");
const sequelize = require("../database/connect");

const Fields = sequelize.define(
    "Fields",
    {
        field_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true,
        },
        companie_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        field_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        field_type: {
            type: DataTypes.ENUM('Fútbol 5','Fútbol 7','Fútbol 11','Basquet 3x3','Basquet 5x5','Tenis','EcuaVoley'),
            allowNull: false,
            defaultValue: 'Fútbol 5',
        },
        field_size: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        field_max_capacity: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        field_hour_price: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: false,
        },
        field_description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        field_img: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        field_calification: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
        },
    },
    {
        timestamps: false,
        tableName: "Fields"
    }
);
module.exports = Fields;