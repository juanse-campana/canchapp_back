const { DataTypes} = require("sequelize");
const sequelize = require("../database/connect");

const Companies = sequelize.define(
    "Companies",
    {
        companie_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique:  true,
        },
        companie_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        companie_city: {
            type: DataTypes.ENUM('Loja','Catamayo','Cuenca','Zamora'),
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        companie_phone: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        companie_email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        companie_password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        companie_register_date: {
            type: DataTypes.TIME,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        companie_location: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        companie_description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        companie_features: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        companie_state: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        companie_logo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: false,
        tableName: "Companies"
    }
);
module.exports = Companies;