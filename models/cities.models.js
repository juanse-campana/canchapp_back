const { DataTypes } = require("sequelize");
const sequelize = require("../database/connect");

const Cities = sequelize.define("Cities", {
  city_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  city_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: "Cities",
});

module.exports = Cities;
