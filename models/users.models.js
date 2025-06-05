const { DataTypes} = require("sequelize");
const sequelize = require("../database/connect");

const Users = sequelize.define(
    "Users",
    {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_phone: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        user_mail: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_state: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: "users"
    }
);
module.exports = Users;