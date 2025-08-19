//models/bank_accounts.models.js - CORREGIDO
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
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // 🔧 Permitir null para cuentas de admin
            field: 'company_id' // 🔧 Mapear explícitamente al campo de la DB
        },
        b_account_bank: {
            type: DataTypes.ENUM('Banco de Loja','CoopMego','Banco Pichincha','Banco Guayaquil','Cacpe Loja'),
            allowNull: false,
        },
        b_account_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true // 🔧 Agregar unique constraint
        },
        b_account_ci: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        b_account_type: {
            type: DataTypes.ENUM('Ahorros', 'Corriente'), // 🔧 ENUM para consistencia
            allowNull: false,
        },
        b_account_owner: {
            type: DataTypes.STRING(255), // 🔧 Especificar longitud
            allowNull: false,
        },
        b_account_delete: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        // 🆕 CAMPOS ADICIONALES DE LA DB
        account_type: {
            type: DataTypes.ENUM('admin_collection', 'company_collection', 'owner_payout'),
            allowNull: true,
            defaultValue: 'owner_payout',
            field: 'account_type'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
            field: 'is_active'
        },
        created_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
            field: 'created_date'
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'created_by'
        }
    },
    {
        timestamps: false,
        tableName: "Bank_accounts"
    }
);

module.exports = Bank_accounts;