const { DataTypes } = require("sequelize");
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_hashed_password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_register_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    user_profile_photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    user_role: {
      type: DataTypes.ENUM("jugador", "dueno"),
      defaultValue: "jugador",
    },
  },
  {
    timestamps: false,
    tableName: "Users",
  }
);

module.exports = Users;
