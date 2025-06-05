const { DataTypes} = require("sequelize");
const sequelize = require("../database/connect");

const Registers = sequelize.define(
    "Registers",
    {
        register_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        room_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        register_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        register_init_time: {
            type: DataTypes.TIME,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        register_end_time: {
            type: DataTypes.TIME,
            allowNull: true,
        },
    },
    {
        timestamps: false,
        tableName: "registers"
    }
);
module.exports = Registers;