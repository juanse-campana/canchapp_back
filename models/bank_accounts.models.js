const { DataTypes} = require("sequelize");
const sequelize = require("../database/connect");

const Bank_accounts = sequelize.define(
    "Bank_accounts",
    {
        b_account_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true,
        },
        companie_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        b_account_bank: {
            type: DataTypes.ENUM('Banco de Loja','CoopMego','Banco Pichincha','Banco Guayaquil','Cacpe Loja'),
            allowNull: false,
        },
        b_account_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        b_account_ci: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        b_account_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        b_account_owner: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        b_account_delete: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        timestamps: false,
        tableName: "Bank_accounts"
    }
);
module.exports = Bank_accounts;