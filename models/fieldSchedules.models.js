const { DataTypes } = require("sequelize");
const sequelize = require("../database/connect");

const FieldSchedules = sequelize.define(
    "FieldSchedules",
    {
        schedule_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        field_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'fields',
                key: 'field_id'
            }
        },
        day_of_week: {
            type: DataTypes.TINYINT,
            allowNull: false,
            comment: '0=Domingo, 1=Lunes, 2=Martes, etc.'
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        is_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        timestamps: false,
        tableName: "field_schedules",
        indexes: [
            {
                fields: ['field_id', 'day_of_week', 'start_time'],
                unique: true
            }
        ]
    }
);

module.exports = FieldSchedules;