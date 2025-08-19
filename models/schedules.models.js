const { DataTypes} = require("sequelize");
const sequelize = require("../database/connect");

const Schedules = sequelize.define(
    "Schedules",
    {
        schedule_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true,
        },
        field_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        schedule_mon: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        schedule_tue: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        schedule_wed: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        schedule_thu: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        schedule_fri: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        schedule_sat: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        schedule_sun: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: "Schedules"
    }
);
module.exports = Schedules;