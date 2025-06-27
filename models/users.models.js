const { DataTypes} = require("sequelize");
const sequelize = require("../database/connect");

const Users = sequelize.define(
    "Users",
    {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true,
        },
        user_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_hashed_password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_register_date: {
            type: DataTypes.TIME,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        user_profile_photo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_delete: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        timestamps: false,
        tableName: "users"
    }
);
module.exports = Users;