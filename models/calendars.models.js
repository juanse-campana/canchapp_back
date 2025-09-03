const { DataTypes } = require('sequelize');
const sequelize = require('../database/connect');

const Calendars = sequelize.define('Calendars', {
    calendar_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    field_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cash_closing_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    calendar_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    calendar_init_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    calendar_end_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    calendar_state: {
        type: DataTypes.ENUM('Disponible','Reservada','No Disponible','Por Confirmar','Confirmada','Completada','Cancelada','Pendiente','Aprobada','Rechazada'),
        allowNull: false,
        defaultValue: 'Disponible'
    },
    calendar_payment: {
        type: DataTypes.ENUM('Pendiente','Cerrado'),
        allowNull: true
    },
    // ✅ CORREGIDO: Usar el nombre correcto de la columna
    calendar_transaccion: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    // NUEVAS COLUMNAS para reservas recurrentes
    calendar_is_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    calendar_recurring_type: {
        type: DataTypes.ENUM('semanal', 'mensual'),
        allowNull: true
    },
    calendar_recurring_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    calendar_created_by_owner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    calendar_is_presential: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    calendar_parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    calendar_payment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    calendar_payment_status: {
        type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
        defaultValue: 'pendiente'
    },
    calendar_payment_receipt: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    calendar_payment_receipt_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    calendar_approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    calendar_approved_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    calendar_rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'calendars',
    timestamps: false
});

module.exports = Calendars;