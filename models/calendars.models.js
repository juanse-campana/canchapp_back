const { DataTypes} = require("sequelize");
const sequelize = require("../database/connect");

const Calendars = sequelize.define(
    "Calendars",
    {
        calendar_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true,
        },
        field_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        cash_closing_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
            type: DataTypes.ENUM('Disponible', 'Reservada', 'No Disponible', 'Por Confirmar'),
            defaultValue: 'Disponible'
        },
        calendar_transaction: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
        }
    },
    {
        timestamps: false,
        tableName: "Calendars"
    }
);
module.exports = Calendars;