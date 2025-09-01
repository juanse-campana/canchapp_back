const { DataTypes } = require("sequelize");
const sequelize = require("../database/connect");

const RecurringReservations = sequelize.define(
    "RecurringReservations",
    {
        recurring_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        parent_calendar_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        field_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'fields',
                key: 'field_id'
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // CAMBIADO: Ahora permite NULL
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        created_by_owner_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        recurring_type: {
            type: DataTypes.ENUM('semanal', 'mensual'),
            allowNull: false,
        },
        day_of_week: {
            type: DataTypes.TINYINT,
            allowNull: true,
            comment: 'Para reservas semanales (1=Lunes, 0=Domingo)'
        },
        day_of_month: {
            type: DataTypes.TINYINT,
            allowNull: true,
            comment: 'Para reservas mensuales (1-31)'
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Si es NULL, es indefinida'
        },
        payment_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // NUEVO CAMPO AGREGADO
        client_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Nombre del cliente para reservas creadas por el owner'
        },
    },
    {
        timestamps: false,
        tableName: "recurring_reservations",
        indexes: [
            {
                fields: ['field_id', 'day_of_week', 'start_time']
            },
            {
                fields: ['is_active']
            },
            {
                fields: ['start_date', 'end_date']
            }
        ]
    }
);

module.exports = RecurringReservations;